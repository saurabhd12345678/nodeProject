var cron = require('node-cron');
var applications = require('../../models/application');
var tools_data = require('../../models/tool');
var user_data = require('../../models/user');
var setting_service = require('../../services/settings/settings_service');
var activity_logger = require('../../service_helpers/common/activity_logger');
var poller_data = require('../../models/poller_data');
var azure_sync = require('../../connectors/azure_devops/azure_project_sync');
var application_service = require('../../services/application_configuration/application_configuration_service');
const { application } = require('express');
var azure_service = require('../../services/azure_devops_services/azure_services')
var existing_scm = require("../../models/existing_scm_projects");
var pipelines_tables = require('../../models/pipeline');
var hashicorp_vault_create = require('../../connectors/hashicorp-vault/create_secret');
var hashicorp_vault_helper = require('../../service_helpers/hashicorp_vault');
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var sonarqube_sync = require('../../connectors/sonarqube/sonarqube_sync');
var code_analysis_db_save = require('../../service_helpers/common/code_analysis_db_save');
var jenkins_sync = require('../../connectors/jenkins/jenkins_sync');
var existing_continuous_integration_jobs = require('../../models/existing_continuous_integration_jobs');
var pipeline_workflow = require('../../models/pipeline_workflow');
var ci_sync_db_save = require('../../service_helpers/common/ci_sync_db_save');
var bitbucket_sync = require('../../connectors/bitbucket/bitbucket_sync');
var gitlab_sync = require('../../connectors/GitLab/gitlab_sync_project');
var azurerepos_sync_projects = require('../../connectors/azurerepos/azurerepos_sync_projects.js');
const qualys_data_poller = require('../../connectors/qualys/qualys_get_data');



module.exports.poll_data_application = async () => {
  try {


    let date_ob = new Date();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    let pipeline_tool_category;
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;

    let application_list = await poller_data.find({ 'scheduled_time': strTime, 'trigger': true });

    if (application_list.length != 0) {

      for (let i = 0; i < application_list.length; i++) {

        let tool_details = await tools_data.find({ application_key: `${application_list[i].application_key}` });

        for (let j = 0; j < tool_details.length; j++) {

          if (tool_details[j].tool_name == "Jira" || "Azure Boards") {
            let application_details = await applications.findOne({ application_key: tool_details[j].application_key });

            if (application_details.plan[0] != undefined) {
              var plan_obj = {
                application_key: tool_details[j].application_key,
                project_key: application_details.plan[0].tool_project_key,
                tool_name: tool_details[j].tool_name,
                instance_name: tool_details[j].tool_instance_name
              }
            }
            let sync_success = await setting_service.sync_tool_projects(
              tool_details[j].application_key,
              tool_details[j].tool_category,
              tool_details[j].tool_instance_name);

            if (sync_success == "Projects data fetched successfully") {
              if (tool_details[j].tool_name == "Jira") {
                var update_jira = await application_service.update_jira_planning(plan_obj);


              }
              else if (tool_details[j].tool_name == "Azure Boards") {
                var update_azure = await azure_service.update_work_item_azure(tool_details[j].application_key);


              }

            }

          }

          else {
            let response_projects = await setting_service.sync_tool_projects(
              tool_details[j].application_key,
              tool_details[j].tool_category,
              tool_details[j].tool_instance_name
            );
            response_projects.then(function (result) {

              if (result == "Projects data fetched successfully") {
                activity_logger.logActivity(`${application_list[i].application_key}`, "-", "Sync Project Completed for " + tool_details[j].tool_name, "System");

              }
              else {
                activity_logger.logActivity(`${application_list[i].application_key}`, "-", "Sync Project failed for " + tool_details[j].tool_name, "System");
              }
            })
          }

        }

        let pipeline_details = await pipelines_tables.find({ application_key: `${application_list[i].application_key}` });


        for (let k = 0; k < pipeline_details.length; k++) {

          if (pipeline_details[k].pipeline_type == "PIPELINE_EXISTING" || pipeline_details[k].pipeline_type == "PIPELINE_STANDARD") {

            let tools_for_pipeline = [
              pipeline_details[k].scm,
              pipeline_details[k].code_quality,
              pipeline_details[k].continuous_integration

            ]
            for (let n = 0; n < tools_for_pipeline.length; n++) {

              if (tools_for_pipeline[n].instance_details.tool_name == "Sonarqube") {
                pipeline_tool_category = "Code Analysis";
                this.sync_tool_data_codeAnalysis(`${application_list[i].application_key}`, pipeline_tool_category,
                  tools_for_pipeline[n].instance_details.instance_name, tools_for_pipeline[n], pipeline_details[k].pipeline_key)
              }
              else if (tools_for_pipeline[n].instance_details.tool_name == "Azure Devops" || tools_for_pipeline[n].instance_details.tool_name == "Jenkins") {
                pipeline_tool_category = "Continuous Integration";
                this.sync_tool_data_continuousIntegration(`${application_list[i].application_key}`, pipeline_tool_category,
                  tools_for_pipeline[n].instance_details.instance_name, tools_for_pipeline[n], pipeline_details[k].pipeline_key)
              }
              else if (tools_for_pipeline[n].instance_details.tool_name == "Bitbucket" || tools_for_pipeline[n].instance_details.tool_name == "GitLab" || tools_for_pipeline[n].instance_details.tool_name == "Azure Repos") {
                pipeline_tool_category = "Source Control";

                this.sync_tool_data_SourceControl(`${application_list[i].application_key}`, pipeline_tool_category,
                  tools_for_pipeline[n].instance_details.instance_name, tools_for_pipeline[n].tool_project_key, tools_for_pipeline[n].tool_project_name,
                  tools_for_pipeline[n].repo_name, tools_for_pipeline[n].repo_url, tools_for_pipeline[n].branch_name, pipeline_details[k].pipeline_key,
                  tools_for_pipeline[n].instance_details.tool_name, tools_for_pipeline[n].instance_details.instance_name)
              }

            }


          }
          else if (pipeline_details[k].pipeline_type == "PIPELINE_CUSTOM") {


            let tools_for_pipeline = [
              pipeline_details[k].scm,
              pipeline_details[k].code_quality,
              pipeline_details[k].continuous_integration,


            ]
            for (let n = 0; n < tools_for_pipeline.length; n++) {

              if (tools_for_pipeline[n].instance_details.tool_name == "Sonarqube") {
                pipeline_tool_category = "Code Analysis";
                this.sync_tool_data_codeAnalysis(`${application_list[i].application_key}`, pipeline_tool_category,
                  tools_for_pipeline[n].instance_details.instance_name, tools_for_pipeline[n], pipeline_details[k].pipeline_key)
              }
              else if (tools_for_pipeline[n].instance_details.tool_name == "Bitbucket" || tools_for_pipeline[n].instance_details.tool_name == "GitLab" || tools_for_pipeline[n].instance_details.tool_name == "Azure Repos") {
                pipeline_tool_category = "Source Control";

                this.sync_tool_data_SourceControl(`${application_list[i].application_key}`, pipeline_tool_category,
                  tools_for_pipeline[n].instance_details.instance_name, tools_for_pipeline[n].tool_project_key, tools_for_pipeline[n].tool_project_name,
                  tools_for_pipeline[n].repo_name, tools_for_pipeline[n].repo_url, tools_for_pipeline[n].branch_name, pipeline_details[k].pipeline_key,
                  tools_for_pipeline[n].instance_details.tool_name, tools_for_pipeline[n].instance_details.instance_name)
              }


            }
            for (let n = 0; n < pipeline_details[k].pipeline_workflow_ui_data.nodes.length; n++) {

              if (pipeline_details[k].pipeline_workflow_ui_data.nodes[n].task.task_name == "Qualys Analysis") {

                var fetched_tool = await tools_data
                  .findOne({
                    application_key: `${application_list[i].application_key}`
                  })
                  .lean();

                qualys_data_poller.fetch_id(fetched_tool, pipeline_details[k].pipeline_key)
              }
            }


          }

        }




      }
    }
    else {
      //No Application Found
    }




  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports.poll_data_save = async (application_list) => {
  try {

    await poller_data.findOneAndUpdate({ 'application_key': application_list.application_key },
      {
        $set: {
          'application_key': application_list.application_key,
          'scheduled_time': application_list.scheduled_time,
          'trigger': application_list.trigger

        }

      }
      , { upsert: true, new: true }).lean();


    return "success";


  } catch (error) {
    throw new Error(error.message);
  }
}


module.exports.sync_tool_data_codeAnalysis = async (
  application_key,
  tool_category,
  tool_instance_name,
  caa_obj,
  pipeline_key
) => {
  try {

    let ca_obj = {
      "project_key": caa_obj.tool_project_key,
      "pipeline_key": pipeline_key,
      "project_name": caa_obj.tool_project_name,
      "is_sync": caa_obj.is_sync,
    }
    let code_quality_auth_token;
    var fetched_tool = await tools_data
      .findOne({
        application_key: application_key,
        tool_category: tool_category,
        tool_instance_name: tool_instance_name,
      })
      .lean();

    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
      application_key
    );


    if (vault_config_status == true) {
      let vault_configuration = await hashicorp_vault_config.read_tool_secret(
        application_key,
        tool_category,
        fetched_tool.tool_name,
        tool_instance_name
      );

      if (vault_configuration.auth_type == "password") {
        fetched_tool = {

          "tool_category": fetched_tool.tool_category,
          "tool_url": fetched_tool.tool_url,
          "proxyFlag": fetched_tool.proxy_required,
          "_id": fetched_tool._id,
          "tool_name": fetched_tool.tool_name,
          "tool_auth": {
            "auth_type": vault_configuration.auth_type,
            "auth_username": vault_configuration.auth_username,
            "auth_password": vault_configuration.auth_password
          }
        }


      } else {
        fetched_tool.tool_auth.auth_token = vault_configuration.auth_token;
      }
    } else {
      if (fetched_tool.tool_auth.auth_type == "password") {
        code_quality_auth_token = new Buffer.from(
          fetched_tool.tool_auth.auth_username +
          ":" +
          fetched_tool.tool_auth.auth_password
        ).toString("base64");
      } else {
        code_quality_auth_token = fetched_tool.tool_auth.auth_token;
      }
    }

    switch (fetched_tool.tool_category) {

      case "Code Analysis": {
        switch (fetched_tool.tool_name) {
          case "Sonarqube": {
            try {

              let result = await sonarqube_sync.sonarAggregation(
                fetched_tool,
                ca_obj,
                fetched_tool.tool_url,
                code_quality_auth_token,
                fetched_tool.proxy_required
              );
              if (result == "failure") {
                return "failure";
              }
              else {
                let sonar_aggregation_status = code_analysis_db_save.sonar_analysis(
                  fetched_tool,
                  ca_obj,
                  result
                );

                sonar_aggregation_status.then(function (results) {
                  // console.log(results)

                })

                return "success";
              }
            } catch (error) {
              throw new Error(error.message);
            }


          }
        }
        break;
      }
      case "Binary Repository":
      default:
        return "Tool Category Not Found";
    }
  } catch (error) {
    throw new Error(error.message);
  }
}


module.exports.sync_tool_data_continuousIntegration = async (
  application_key,
  tool_category,
  tool_instance_name,
  cii_obj,
  pipeline_key
) => {
  try {


    let continuous_integration_auth_token;
    var fetched_tool = await tools_data
      .findOne({
        application_key: application_key,
        tool_category: tool_category,
        tool_instance_name: tool_instance_name,
      })
      .lean();

    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
      application_key
    );


    if (vault_config_status == true) {
      let vault_configuration = await hashicorp_vault_config.read_tool_secret(
        application_key,
        tool_category,
        fetched_tool.tool_name,
        tool_instance_name
      );

      if (vault_configuration.auth_type == "password") {
        fetched_tool = {

          "tool_category": fetched_tool.tool_category,
          "tool_url": fetched_tool.tool_url,
          "proxyFlag": fetched_tool.proxy_required,
          "_id": fetched_tool._id,
          "tool_name": fetched_tool.tool_name,
          "tool_auth": {
            "auth_type": vault_configuration.auth_type,
            "auth_username": vault_configuration.auth_username,
            "auth_password": vault_configuration.auth_password
          }
        }


      } else {
        continuous_integration_auth_token = vault_configuration.auth_token;
      }
    } else {
      if (fetched_tool.tool_auth.auth_type == "password") {
        continuous_integration_auth_token = new Buffer.from(
          fetched_tool.tool_auth.auth_username +
          ":" +
          fetched_tool.tool_auth.auth_password
        ).toString("base64");
      } else {
        continuous_integration_auth_token = fetched_tool.tool_auth.auth_token;
      }
    }


    switch (fetched_tool.tool_name) {

      case "Azure Devops": {
        try {
          let continuous_integration_obj = {

            "pipeline_key": pipeline_key,
            "project_name": cii_obj.tool_project_name,
            "project_url": cii_obj.job_url
          }

          let pipeline_details = await existing_continuous_integration_jobs.findOne({ ci_project_name: cii_obj.tool_project_name }).lean();
          let builds = await jenkins_sync.azureBuildAggregation(continuous_integration_obj, pipeline_details, fetched_tool.tool_url,
            continuous_integration_auth_token, fetched_tool.proxy_required)
          let sync_status = await ci_sync_db_save.saveCiAzureData(builds, continuous_integration_obj);
          return sync_status;
        } catch (error) {
          throw new Error(error.message);
        }


      }
      case "Jenkins": {
        try {
          let continuous_integration_obj = {

            "pipeline_key": pipeline_key,
            "project_name": cii_obj.tool_project_name,
            "project_url": cii_obj.job_url
          }

          let pipeline_details = await existing_continuous_integration_jobs.findOne({ ci_project_name: cii_obj.tool_project_name }).lean();

          let builds = await jenkins_sync.buildAggregation(continuous_integration_obj, fetched_tool.tool_url,
            continuous_integration_auth_token, fetched_tool.proxy_required)


          let sync_status = await ci_sync_db_save.saveCiData(builds, continuous_integration_obj);
          return sync_status;
        } catch (error) {
          throw new Error(error.message);
        }

        ;
      }

    }



  } catch (error) {
    throw new Error(error.message);
  }
}



module.exports.sync_tool_data_SourceControl = async (
  application_key,
  tool_category,
  tool_instance_name,
  tool_project_key,
  tool_project_name,
  repo_name,
  repo_url,
  branch_name,
  pipeline_key,
  tool_name,
  instance_name
) => {
  try {

    var fetched_tool = await tools_data
      .findOne({
        application_key: application_key,
        tool_category: tool_category,
        tool_instance_name: tool_instance_name,
      })
      .lean();

    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
      application_key
    );


    if (vault_config_status == true) {
      let vault_configuration = await hashicorp_vault_config.read_tool_secret(
        application_key,
        tool_category,
        fetched_tool.tool_name,
        tool_instance_name
      );

      if (vault_configuration.auth_type == "password") {
        fetched_tool = {
          "tool_category": fetched_tool.tool_category,
          "tool_url": fetched_tool.tool_url,
          "proxyFlag": fetched_tool.proxy_required,
          "_id": fetched_tool._id,
          "tool_name": fetched_tool.tool_name,
          "tool_auth": {
            "auth_type": vault_configuration.auth_type,
            "auth_username": vault_configuration.auth_username,
            "auth_password": vault_configuration.auth_password
          }
        }

      } else {
        fetched_tool.tool_auth.auth_token = vault_configuration.auth_token;
      }
    } else {
    }
    switch (fetched_tool.tool_category) {
      case "Source Control": {
        switch (fetched_tool.tool_name) {
          case "Bitbucket": {
            var token = new Buffer.from(fetched_tool.tool_auth.auth_username + ":" +
              fetched_tool.tool_auth.auth_password)
              .toString('base64');
            var project_details = {
              "project_id": "",
              "project_name": ""
            }
            let project_find = await existing_scm.findOne({ scm_project_name: tool_project_name })
            {
              project_details.project_name = project_find.scm_project_name;
              project_details.project_id = project_find.scm_project_id;
            }

            try {
              let scm_object = {
                project_data: {
                  project_key: tool_project_key,
                  project_id: project_find.scm_project_id
                },
                tool_project_name: tool_project_name,
                repository_name: repo_name,
                repo_url: repo_url,
                branch_name: branch_name,
                pipeline_key: pipeline_key,
                tool_name: tool_name,
                instance_name: instance_name,
                project_name: project_find.scm_project_name,
                application_key: fetched_tool.application_key
              }

              let sync_status = await bitbucket_sync.bitbucketCommitAggregation(scm_object, fetched_tool.tool_url, token, fetched_tool.proxy_required)
              if (sync_status == "success")
                return "Projects data fetched successfully";
            } catch (error) {
              throw new Error(error.message);
            }

            break;
          }

          case "GitLab": {
            try {
              let scm_auth_token;
              if (fetched_tool.tool_name == "GitLab") {
                let token = fetched_tool.tool_auth.auth_token;
                let pretoken = token.split(":");
                scm_auth_token = pretoken[1];
              }
              else {
                scm_auth_token = fetched_tool.tool_auth.auth_token;
              }
              let scm_obj = {
                tool_project_key: tool_project_key,
                tool_project_name: tool_project_name,
                repo_name: repo_name,
                branch_name: branch_name,
                pipeline_key: pipeline_key,


              }

              let sync_status = await gitlab_sync.updategitlabCommitAggregation(scm_obj, fetched_tool.tool_url, scm_auth_token);
              if (sync_status == "success") {
                return "Data fetched successfully";
              }
            } catch (error) {

              throw new Error(error.message);
            }

            break;
          }

          case "Azure Repos": {
            try {
              let scm_obj = {
                tool_project_key: tool_project_key,
                tool_project_name: tool_project_name,
                repo_name: repo_name,
                branch_name: branch_name,
                pipeline_key: pipeline_key
              }
              let sync_status = await azurerepos_sync_projects.UpdateazurereposCommitAggregation(scm_obj, fetched_tool.tool_url, fetched_tool.tool_auth.auth_token);
              if (sync_status == "success") {
                return "Data fetched successfully";
              }
            } catch (error) {
              throw new Error(error.message);
            }

          }

        }
        break;
      }
      default:
        return "Tool Category Not Found";
    }
  } catch (error) {

    throw new Error(error.message);
  }
}

