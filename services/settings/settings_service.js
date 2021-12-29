const tool = require('../../models/tool');
const bitbucket_sync_projects = require('../../connectors/bitbucket/bitbucket_sync_projects');
const azurerepos_sync_projects = require('../../connectors/azurerepos/azurerepos_sync_projects.js');
const gitlab_sync_projects = require('../../connectors/GitLab/gitlab_sync_project');
const jira_sync_projects = require('../../connectors/jira/jira_sync_projects');
const sonarqube_sync_projects = require('../../connectors/sonarqube/sonarqube_sync_projects');
const jenkins_sync_projects = require('../../connectors/jenkins/jenkins_sync_jobs');
const jira_validate_tool = require('../../connectors/jira/jira_validate_tool');
const bitbucket_validate_tool = require('../../connectors/bitbucket/bitbucket_validate_tool');
const qualys_validate_tool = require('../../connectors/qualys/qualys_validate_tool');
const qualys_sync_projects = require('../../connectors/qualys/qualys_sync_projects');
const sonarqube_validate_tool = require('../../connectors/sonarqube/sonarqube_validate_tool');
const jenkins_validate_tool = require('../../connectors/jenkins/jenkins_validate_tool');
const azurerepos_validate_tool = require('../../connectors/azurerepos/azurerepos_validate_tool.js');
const jira_sync_users = require('../../connectors/jira/jira_sync_users');
const bitbucket_sync_users = require('../../connectors/bitbucket/bitbucket_sync_users');
const azurerepos_sync_users = require('../../connectors/azurerepos/azurerepos_sync_users.js');
const gitlab_sync_users = require('../../connectors/GitLab/gitlab_sync_users');
const sonarqube_sync_users = require('../../connectors/sonarqube/sonarqube_sync_users');
const jenkins_sync_users = require('../../connectors/jenkins/jenkins_sync_users');
const azure_sync_project = require('../../connectors/azure_devops/azure_project_sync');
const existing_continuous_integration_jobs = require('../../models/existing_continuous_integration_jobs');
const existing_scm_projects = require('../../models/existing_scm_projects');
const existing_planning_projects = require('../../models/existing_planning_projects');
const existing_code_analysis_projects = require('../../models/existing_code_analysis_projects');
const existing_dast_projects = require('../../models/existing_dast_projects');
const existing_planning_users = require('../../models/existing_planning_users');
const existing_scm_users = require('../../models/existing_scm_users');
const existing_code_analysis_users = require('../../models/existing_code_analysis_users');
const existing_continuous_integration_users = require('../../models/existing_continuous_integration_users');
const applications = require('../../models/application');
const pipelines = require('../../models/pipeline');
const master_tool_data = require('../../models/tool_master_datas')
const jfrog = require('../../connectors/jfrog/jfrog_validate')
const { userInfo } = require('os');
const servicenow_validate_tool = require('../../connectors/servicenow/servicenow_validate_tool');
var hashicorp_vault_create = require('../../connectors/hashicorp-vault/create_secret');
var hashicorp_vault_helper = require('../../service_helpers/hashicorp_vault');
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
const existing_artifactory_management_repo = require('../../models/existing_artifactory_management_repo')
const jfrog_sync_repo = require('../../connectors/jfrog/jfrog_sync_repo')
const codex = require('../../connectors/codeDX/codeDx_validate')
const codex_project_list = require('../../connectors/codeDX/get_project_list');
const existing_codedx_projects = require('../../models/existing_codedx_projects');
const gitLab_validate_tool = require('../../connectors/GitLab/gitLab_validate_tool');
const serviceNowData = require('../servicenow/servicenow_service');
const vaultToken = require('../../connectors/common/createconnection')
var azure_service = require('../../services/azure_devops_services/azure_services');
var application_service = require('../../services/application_configuration/application_configuration_service');
var bitbucket_sync = require('../../connectors/bitbucket/bitbucket_sync');
const pipeline_table = require('../../models/pipeline');
const poller_service = require('../poller/poller_service');
var application_service = require('../../services/application_configuration/application_configuration_service');
var logger = require('../../configurations/logging/logger');
module.exports.get_tools_by_categories = async (application_key) => {
  try {
    var tool_categories = [
      "Planning",
      "Source Control",
      "Continuous Integration",
      "Code Analysis",
      "Continuous Deployment",
      "Code Security",
      "DAST",
    ];
    var tools = [];
    for await (let tool_category of tool_categories) {
      var temp_tools = await module.exports.get_tools(
        application_key,
        tool_category
      );
      var temp_category = {
        category_name: tool_category,
        category_tools: temp_tools,
      };
      tools.push(temp_category);
    }
    return tools;
  } catch (error) {
    throw new Error(error.message);
  }
},

  module.exports.tool_create = async (body) => {
    await master_tool_data.create(body);
    return true;
  },
  /**
   * This function fetches Tool Categories for an application
   * multer-s3
   * aws-sdk
   * @param {String} application_key
   */
  module.exports.get_tool_categories = async (application_key) => {
    try {

      var tool_categories = await master_tool_data.aggregate([
        { $match: { is_provisioning: true, is_active: true } },

        {
          $group: {
            _id: "$tool_category",
            tool_name: { $addToSet: "$tool_name" },
            tool_index: { $first: "$tool_index" },
          },
        },
        { $sort: { tool_index: 1 } },
      ]);

      var unique_categories = [];

      for await (let category_name of tool_categories) {
        var tool_categories_2 = await tool
          .find({
            application_key: application_key,
            tool_category: category_name._id,
          })
          .countDocuments();

        unique_categories.push({
          category_name: category_name._id,
          instance_count: tool_categories_2,
          tool_names: category_name.tool_name,
        });
      }

      return unique_categories;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  /**
   * This function fetches Tools for an application
   * @param {String} application_key
   * @param {String} tool_category
   */
  module.exports.get_tools = async (application_key, tool_category) => {
    try {
      var tools = await tool.find(
        { application_key: application_key, tool_category: tool_category },
        {
          tool_url: 1,
          tool_instance_name: 1,
          tool_name: 1,
          tool_version: 1,
          proxy_required: 1,
          _id: 0,
        }
      );
      return tools;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  /**
   * This function fetches projects from the respective Tool
   * @param {String} application_key
   * @param {String} tool_category
   * @param {String} tool_instance_name
   */



  module.exports.sync_jira_projects = async (
    jira_tool
  ) => {

    var jira_projects = await jira_sync_projects.fetch_projects(
      jira_tool
    );
    return jira_projects;
  },


  // module.exports.sync_tool_projects = async (
  //   application_key,
  //   tool_category,
  //   tool_instance_name
  // ) => {
  //   try {
  //     // console.log("app_key",application_key);
  //     // console.log("category",tool_category);
  //     // console.log("instance_name",tool_instance_name);

  //     var fetched_tool = await tool
  //       .findOne({
  //         application_key: application_key,
  //         tool_category: tool_category,
  //         tool_instance_name: tool_instance_name,
  //       })
  //       .lean();

  //     // console.log(application_key,tool_category,tool_instance_name);
  //     // console.log(fetched_tool)

  //     let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
  //       application_key
  //     );


  //     if (vault_config_status == true) {
  //       let vault_configuration = await hashicorp_vault_config.read_tool_secret(
  //         application_key,
  //         tool_category,
  //         fetched_tool.tool_name,
  //         tool_instance_name
  //       );

  //       if (vault_configuration.auth_type == "password") {
  //         fetched_tool = {

  //           "tool_category": fetched_tool.tool_category,
  //           "tool_url": fetched_tool.tool_url,
  //           "proxyFlag": fetched_tool.proxy_required,
  //           "_id": fetched_tool._id,
  //           "tool_name": fetched_tool.tool_name,
  //           "tool_auth": {
  //             "auth_type": vault_configuration.auth_type,
  //             "auth_username": vault_configuration.auth_username,
  //             "auth_password": vault_configuration.auth_password
  //           }
  //         }

  //         // fetched_tool.tool_auth.auth_username =
  //         //   vault_configuration.auth_username;
  //         // fetched_tool.tool_auth.auth_password =
  //         //   vault_configuration.auth_password;
  //       } else {
  //         fetched_tool.tool_auth.auth_token = vault_configuration.auth_token;
  //       }
  //     } else {
  //     }

  //     switch (fetched_tool.tool_category) {
  //       case "Planning": {
  //         switch (fetched_tool.tool_name) {
  //           case "Jira": {

  //             try {
  //               var jira_projects = await jira_sync_projects.fetch_projects(
  //                 fetched_tool
  //               );
  //               await existing_planning_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for (let jira_project of jira_projects) {
  //                 var jira_project_object = new existing_planning_projects({
  //                   planning_tool: "Jira",
  //                   planning_project_id: jira_project.id,
  //                   planning_project_key: jira_project.key,
  //                   planning_project_name: jira_project.name,
  //                   planning_self: jira_project.self,
  //                   tool_id: fetched_tool._id,
  //                 });
  //                 await existing_planning_projects.create(jira_project_object);
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {

  //               throw new Error(error.message);
  //             }
  //             break;
  //           }
  //           case "Azure Boards": {

  //             try {
  //               var azure_projects = await azure_sync_project.fetch_azureboards_project(
  //                 fetched_tool
  //               );
  //               await existing_planning_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for (let azure_project of azure_projects) {
  //                 var azure_project_object = new existing_planning_projects({
  //                   planning_tool: "Azure Boards",
  //                   planning_project_id: azure_project.id,
  //                   planning_project_key: azure_project.id,
  //                   planning_project_name: azure_project.name,
  //                   planning_self: azure_project.url,
  //                   tool_id: fetched_tool._id,
  //                 });
  //                 await existing_planning_projects.create(azure_project_object);
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {

  //               throw new Error(error.message);
  //             }
  //             break;
  //           }
  //         }
  //         break;
  //       }
  //       case "Source Control": {
  //         switch (fetched_tool.tool_name) {
  //           case "Bitbucket": {
  //             try {
  //               var scm_projects = await bitbucket_sync_projects.fetch_projects(
  //                 fetched_tool
  //               );

  //               await existing_scm_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });

  //               for await (let scm_project of scm_projects) {
  //                 let projid = scm_project.id;
  //                 let proj_id = projid.toString();
  //                 var scm_project_object = new existing_scm_projects({
  //                   scm_tool: "Bitbucket",
  //                   scm_project_id: proj_id,
  //                   scm_project_key: scm_project.key,
  //                   scm_project_type: scm_project.type,
  //                   scm_project_name: scm_project.name,
  //                   scm_project_self: scm_project.links.self[0].href,
  //                   tool_id: fetched_tool._id,
  //                 });
  //                 await existing_scm_projects.create(scm_project_object);
  //                 var scm_repos = await bitbucket_sync_projects.fetch_repositories(
  //                   fetched_tool,
  //                   scm_project.key
  //                 );

  //                 for await (let scm_repo of scm_repos) {
  //                   var scm_repo_object = {
  //                     scm_repo_id: scm_repo.id,
  //                     scm_repo_name: scm_repo.name,
  //                     scm_repo_self: scm_repo.links.self[0].href,
  //                   };

  //                   await existing_scm_projects.updateMany(
  //                     { scm_project_key: scm_project.key },
  //                     { $push: { repos: scm_repo_object } }
  //                   );
  //                   var scm_branches = await bitbucket_sync_projects.fetch_branches(
  //                     fetched_tool,
  //                     scm_project.key,
  //                     scm_repo.name
  //                   );
  //                   for await (let scm_branch of scm_branches) {
  //                     var scm_branch_object = {
  //                       scm_branch_id: scm_branch.id,
  //                       scm_branch_display_id: scm_branch.displayId,
  //                     };
  //                     await existing_scm_projects.updateMany(
  //                       {
  //                         scm_project_key: scm_project.key,
  //                         "repos.scm_repo_name": scm_repo.name,
  //                       },
  //                       {
  //                         $push: { "repos.$.branches": scm_branch_object },
  //                       }
  //                     );
  //                   }
  //                 }
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }

  //           }
  //           case "GitLabb": {
  //             try {
  //               var scm_projects = [];
  //               scm_projects = await gitlab_sync_projects.fetch_projects(
  //                 fetched_tool
  //               );

  //               await existing_scm_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for await (let scm_project of scm_projects) {
  //                 var scm_project_object = new existing_scm_projects({
  //                   scm_tool: "GitLab",
  //                   scm_project_id: scm_project.id,
  //                   scm_project_key: scm_project.id,
  //                   scm_project_name: scm_project.name,
  //                   scm_project_self: scm_project.web_url,
  //                   tool_id: fetched_tool._id,
  //                 });
  //                 // var scm_project_object = new existing_scm_projects({
  //                 //   scm_tool: "GitLab",
  //                 //   scm_project_id: scm_projects.id,
  //                 //   scm_project_key: scm_projects.id,
  //                 //   scm_project_name: scm_projects.name,
  //                 //   scm_project_self: scm_projects.web_url,
  //                 //   tool_id: fetched_tool._id,
  //                 // });
  //                 await existing_scm_projects.create(scm_project_object);
  //                 var scm_repos = await gitlab_sync_projects.fetch_repositories(
  //                   fetched_tool,
  //                   scm_project.id
  //                 );

  //                 for await (let scm_repo of scm_repos) {
  //                   var scm_repo_object = {
  //                     scm_repo_id: scm_repo.id,
  //                     scm_repo_name: scm_repo.name,

  //                   };

  //                   await existing_scm_projects.updateMany(
  //                     { scm_project_key: scm_project.id },
  //                     { $push: { repos: scm_repo_object } }
  //                   );
  //                   var scm_branches = await gitlab_sync_projects.fetch_branches(
  //                     fetched_tool,
  //                     scm_project.id,
  //                     scm_repo.name
  //                   );
  //                   for await (let scm_branch of scm_branches) {
  //                     var scm_branch_object = {
  //                       scm_branch_id: scm_branch.commit.id,
  //                       scm_branch_display_id: scm_branch.name,
  //                     };
  //                     await existing_scm_projects.updateMany(
  //                       {
  //                         scm_project_key: scm_project.id,
  //                         "repos.scm_repo_name": scm_repo.name,
  //                       },
  //                       {
  //                         $push: { "repos.$.branches": scm_branch_object },
  //                       }
  //                     );
  //                   }
  //                 }
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }

  //             break;
  //           }
  //           case "GitLab": {
  //             try {
  //               var scm_projects = [];
  //               scm_projects = await gitlab_sync_projects.fetch_groups(
  //                 fetched_tool
  //               );
  //               var gitlab_projects = await gitlab_sync_projects.fetch_usernamespace_projects(fetched_tool);

  //               await existing_scm_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for await (let scm_project of scm_projects) {
  //                 let projid = scm_project.id;
  //                 let proj_id = projid.toString();
  //                 var scm_project_object = new existing_scm_projects({
  //                   scm_tool: "GitLab",
  //                   scm_project_id: proj_id,
  //                   scm_project_key: scm_project.id,
  //                   scm_project_name: scm_project.name,
  //                   scm_project_self: scm_project.web_url,
  //                   tool_id: fetched_tool._id,
  //                 });
  //                 // var scm_project_object = new existing_scm_projects({
  //                 //   scm_tool: "GitLab",
  //                 //   scm_project_id: scm_projects.id,
  //                 //   scm_project_key: scm_projects.id,
  //                 //   scm_project_name: scm_projects.name,
  //                 //   scm_project_self: scm_projects.web_url,
  //                 //   tool_id: fetched_tool._id,
  //                 // });
  //                 await existing_scm_projects.create(scm_project_object);
  //                 var scm_repos = await gitlab_sync_projects.fetch_projectsusingGroup(
  //                   fetched_tool,
  //                   scm_project.id
  //                 );

  //                 for await (let scm_repo of scm_repos) {
  //                   var scm_repo_object = {
  //                     scm_repo_id: scm_repo.id,
  //                     scm_repo_name: scm_repo.name,

  //                   };

  //                   await existing_scm_projects.updateMany(
  //                     { scm_project_key: scm_project.id },
  //                     { $push: { repos: scm_repo_object } }
  //                   );
  //                   var scm_branches = await gitlab_sync_projects.fetch_branches(
  //                     fetched_tool,
  //                     scm_repo.id,
  //                     scm_repo.name
  //                   );
  //                   for await (let scm_branch of scm_branches) {
  //                     var scm_branch_object = {
  //                       scm_branch_id: scm_branch.commit.id,
  //                       scm_branch_display_id: scm_branch.name,
  //                     };
  //                     await existing_scm_projects.updateMany(
  //                       {
  //                         scm_project_key: scm_project.id,
  //                         "repos.scm_repo_name": scm_repo.name,
  //                       },
  //                       {
  //                         $push: { "repos.$.branches": scm_branch_object },
  //                       }
  //                     );
  //                   }
  //                 }
  //               }
  //               var scm_groups_with_access = await gitlab_sync_projects.fetchGroupsWithAccess(fetched_tool);
  //               // for storing projects within usernamespace
  //               for await (let scm_project of gitlab_projects) {
  //                 let match_url = fetched_tool.tool_url + "/" + scm_project.namespace.path;
  //                 if (scm_project.namespace.web_url == match_url) {
  //                   await existing_scm_projects.findOneAndUpdate(
  //                     { "scm_project_key": scm_project.namespace.id },
  //                     {
  //                       "$set": {
  //                         scm_tool: "GitLab",
  //                         scm_project_id: scm_project.namespace.id,
  //                         scm_project_key: scm_project.namespace.id,
  //                         scm_project_name: scm_project.namespace.path,
  //                         scm_project_self: scm_project.namespace.web_url,
  //                         tool_id: fetched_tool._id
  //                       }
  //                     },
  //                     // scm_project_object,
  //                     { upsert: true, new: true }
  //                   );
  //                   scm_web_urls = scm_project.namespace.web_url.split("/");
  //                   scm_web_url = scm_web_urls[3];
  //                   // var scm_repos = await gitlab_sync_projects.fetch_projectsusingGroup(
  //                   //   fetched_tool,
  //                   //   scm_project.id
  //                   // );
  //                   var scm_repo_object = {
  //                     scm_repo_id: scm_project.id,
  //                     scm_repo_name: scm_project.name,

  //                   };

  //                   await existing_scm_projects.updateMany(
  //                     { scm_project_key: scm_project.namespace.id },
  //                     { $addToSet: { repos: scm_repo_object } }
  //                   );
  //                   var scm_branches = await gitlab_sync_projects.fetch_branches(
  //                     fetched_tool,
  //                     scm_project.id
  //                   );
  //                   for await (let scm_branch of scm_branches) {
  //                     var scm_branch_object = {
  //                       scm_branch_id: scm_branch.commit.id,
  //                       scm_branch_display_id: scm_branch.name,
  //                     };
  //                     await existing_scm_projects.updateMany(
  //                       {
  //                         scm_project_key: scm_project.namespace.id,
  //                         "repos.scm_repo_name": scm_project.name,
  //                       },
  //                       {
  //                         $push: { "repos.$.branches": scm_branch_object },
  //                       }
  //                     );
  //                   }

  //                 }
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {

  //               throw new Error(error.message);
  //             }

  //             break;
  //           }

  //           case "Azure Repos": {
  //             try {
  //               var scm_projects = await azurerepos_sync_projects.fetch_projects(
  //                 fetched_tool
  //               );

  //               await existing_scm_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for await (let scm_project of scm_projects) {
  //                 var scm_project_object = new existing_scm_projects({
  //                   scm_tool: "Azure Repos",
  //                   scm_project_id: scm_project.id,
  //                   scm_project_key: scm_project.id,
  //                   scm_project_type: "NORMAL",
  //                   scm_project_name: scm_project.name,
  //                   scm_project_self: scm_project.url,
  //                   tool_id: fetched_tool._id,
  //                 });
  //                 await existing_scm_projects.create(scm_project_object);
  //                 var scm_repos = await azurerepos_sync_projects.fetch_repositories(
  //                   fetched_tool,
  //                   scm_project.name
  //                 );

  //                 for await (let scm_repo of scm_repos) {
  //                   var scm_repo_object = {
  //                     scm_repo_id: scm_repo.id,
  //                     scm_repo_name: scm_repo.name,
  //                     scm_repo_self: scm_repo.url,
  //                   };
  //                   //console.log("scm_repo: ",scm_repo_object);
  //                   await existing_scm_projects.updateMany(
  //                     { scm_project_key: scm_project.id },
  //                     { $push: { repos: scm_repo_object } }
  //                   );

  //                   var scm_branches = await azurerepos_sync_projects.fetch_branches(
  //                     fetched_tool,
  //                     scm_project.name,
  //                     scm_repo.name,
  //                     scm_repo.id
  //                   );
  //                   for await (let scm_branch of scm_branches) {
  //                     var scm_branch_object = {
  //                       scm_branch_id: scm_branch.objectId,
  //                       scm_branch_display_id: scm_branch.name,
  //                     };
  //                     await existing_scm_projects.updateMany(
  //                       {
  //                         scm_project_key: scm_project.id,
  //                         "repos.scm_repo_name": scm_repo.name,
  //                       },
  //                       {
  //                         $push: { "repos.$.branches": scm_branch_object },
  //                       }
  //                     );
  //                   }
  //                 }
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }

  //           }

  //         }
  //         break;
  //       }

  //       case "Continuous Integration": {
  //         switch (fetched_tool.tool_name) {
  //           case "Jenkins": {
  //             try {

  //               var jenkins_jobs = await jenkins_sync_projects.fetch_jobs(
  //                 fetched_tool
  //               );
  //               await existing_continuous_integration_jobs.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for await (let jenkins_job of jenkins_jobs) {
  //                 var ci_job_object = new existing_continuous_integration_jobs({
  //                   ci_project_name: jenkins_job.name,
  //                   ci_project_url: jenkins_job.url,
  //                   tool_id: fetched_tool._id,
  //                   ci_tool: "Jenkins",
  //                 });
  //                 await existing_continuous_integration_jobs.create(
  //                   ci_job_object
  //                 );
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }
  //           }
  //           case "Azure Devops": {
  //             try {

  //               var azure_jobs = await jenkins_sync_projects.fetch_jobs_azure(
  //                 fetched_tool
  //               );

  //               await existing_continuous_integration_jobs.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });
  //               for await (let azure_job of azure_jobs) {

  //                 var ci_job_object = new existing_continuous_integration_jobs({
  //                   ci_project_name: azure_job.name,
  //                   ci_project_url: azure_job.url,
  //                   tool_id: fetched_tool._id,
  //                   definition_id: azure_job.id,
  //                   ci_tool: "Azure Devops"
  //                 });

  //                 await existing_continuous_integration_jobs.create(
  //                   ci_job_object
  //                 );

  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }
  //           }
  //         }
  //         break;
  //       }
  //       case "Continuous Deployment":
  //       case "Code Security":
  //       case "Code Analysis": {
  //         switch (fetched_tool.tool_name) {
  //           case "Sonarqube": {
  //             try {
  //               var sonarqube_projects = await sonarqube_sync_projects.fetch_projects(
  //                 fetched_tool
  //               );
  //               await existing_code_analysis_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });

  //               for await (let sonarqube_project of sonarqube_projects) {
  //                 var sonarqube_project_object = new existing_code_analysis_projects(
  //                   {
  //                     code_analysis_project_id: sonarqube_project.id,
  //                     code_analysis_project_key: sonarqube_project.key,
  //                     code_analysis_project_name: sonarqube_project.name,
  //                     tool_id: fetched_tool._id,
  //                     code_analysis_tool: "Sonarqube",
  //                   }
  //                 );
  //                 await existing_code_analysis_projects.create(
  //                   sonarqube_project_object
  //                 );
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }

  //             ;
  //           }

  //         }
  //         break;
  //       }

  //       case "DAST": {
  //         switch (fetched_tool.tool_name) {
  //           case "Qualys": {
  //             try {
  //               var qualys_projects = await qualys_sync_projects.fetch_projects(
  //                 fetched_tool
  //               );
  //               await existing_dast_projects.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });

  //               for await (let qualys_project of qualys_projects) {
  //                 var qualys_project_object = new existing_dast_projects(
  //                   {
  //                     dast_project_id: qualys_project.id[0],
  //                     dast_project_key: qualys_project.id[0],
  //                     dast_project_name: qualys_project.name[0],
  //                     tool_id: fetched_tool._id,
  //                     dast_tool: "Qualys",
  //                   }
  //                 );
  //                 await existing_dast_projects.create(
  //                   qualys_project_object
  //                 );
  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }

  //             ;
  //           }
  //         }
  //         break;
  //       }

  //       case "Artifactory Management": {
  //         switch (fetched_tool.tool_name) {
  //           case "JFrog": {
  //             try {

  //               var artifactory_management_repos = await jfrog_sync_repo.getAllRepos(
  //                 fetched_tool
  //               );
  //               await existing_artifactory_management_repo.deleteMany({
  //                 tool_id: fetched_tool._id,
  //               });

  //               for await (let artifactory_management_repo of artifactory_management_repos) {

  //                 var artifactory_management_repos_object = new existing_artifactory_management_repo({
  //                   artifactory_management_tool: fetched_tool.tool_name,
  //                   repo_name: artifactory_management_repo.key,
  //                   description: artifactory_management_repo.description,
  //                   type: artifactory_management_repo.type,
  //                   url: artifactory_management_repo.url,
  //                   packageType: artifactory_management_repo.packageType,
  //                   tool_id: fetched_tool._id,
  //                   application_key: application_key
  //                 });
  //                 await existing_artifactory_management_repo.create(artifactory_management_repos_object);

  //               }
  //               return "Projects data fetched successfully";
  //             } catch (error) {
  //               throw new Error(error.message);
  //             }


  //           }
  //         }
  //         break;
  //       }
  //       case "Security": {
  //         switch (fetched_tool.tool_name) {
  //           case "CodeDx": {
  //             try {



  //               var codex_projects = await codex_project_list.getProjectList(fetched_tool);

  //               codex_projects = JSON.parse(codex_projects)
  //               await existing_codedx_projects.deleteMany({ "tool_id": fetched_tool._id });

  //               for await (let codedx of codex_projects.projects) {


  //                 var codedx_project_object = new existing_codedx_projects({
  //                   tool_id: fetched_tool._id,
  //                   project_id: codedx.id,
  //                   project_name: codedx.name
  //                 });


  //                 await existing_codedx_projects.create(codedx_project_object);

  //                 // existing_codedx_projects.create()

  //               }

  //               return ("Projects data fetched successfully");
  //             }
  //             catch (error) {


  //               throw new Error(error.message);
  //             }

  //             break;
  //           }
  //         }
  //         break;
  //       }
  //       case "ITSM": {
  //         switch (fetched_tool.tool_name) {
  //           case "ServiceNow": {

  //             try {
  //               let snResult = await serviceNowData.get_all_incidents_by_app(application_key);

  //               return ("Incidents data fetched successfully");
  //             }
  //             catch (error) {



  //               throw new Error(error.message);
  //             }

  //             break;
  //           }
  //         }
  //         break;
  //       }
  //       case "Binary Repository":
  //       default:
  //         return "Tool Category Not Found";
  //     }
  //   } catch (error) {

  //     throw new Error(error.message);
  //   }
  // },
  module.exports.sync_tool_projects = async (
    application_key,
    tool_category,
    tool_instance_name
  ) => {
    try {


      var fetched_tool = await tool
        .findOne({
          application_key: application_key,
          tool_category: tool_category,
          tool_instance_name: tool_instance_name,
        })
        .lean();

      // console.log(application_key,tool_category,tool_instance_name);


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

          // fetched_tool.tool_auth.auth_username =
          //   vault_configuration.auth_username;
          // fetched_tool.tool_auth.auth_password =
          //   vault_configuration.auth_password;
        } else {
          fetched_tool.tool_auth.auth_token = vault_configuration.auth_token;
        }
      } else {
      }

      switch (fetched_tool.tool_category) {
        case "Planning": {
          switch (fetched_tool.tool_name) {
            case "Jira":
              try {

                let application_details = await applications.findOne({ application_key: application_key });

                if (application_details.plan[0] != undefined) {
                  var plan_obj = {
                    application_key: application_key,
                    project_key: application_details.plan[0].tool_project_key,
                    tool_name: fetched_tool.tool_name,
                    instance_name: tool_instance_name
                  }
                  console.log("plan obj--->", plan_obj);
                  var update_jira = await application_service.update_jira_planning(plan_obj);
                  if (update_jira == "Jira Project Sync Sucessfull") {
                    logger.info("Sync Projects Done Successfully.");
                    return "Projects data fetched successfully";
                  }
                }
              }
              catch (error) {
                console.log("error--->", error);
                throw error;
              }
              break;
            case "Azure Boards":
              var updateazure = await azure_service.update_work_item_azure(fetched_tool.application_key);
              if (updateazure == 'success') {
                logger.info("Sync Projects Done Successfully.");
                return ("Projects data fetched successfully");
              }
              else if (updateazure == "failure") {
                return ("Projects data not fetched successfully");
              }
              break;
          }
        }
        case "Source Control": {
          switch (fetched_tool.tool_name) {
            case "Bitbucket": {
              try {
                var token = new Buffer.from(fetched_tool.tool_auth.auth_username + ":" +
                  fetched_tool.tool_auth.auth_password)
                  .toString('base64');
                let fetched_pipobj = await pipelines.findOne({
                  application_key: application_key
                });
                let project_find = await existing_scm_projects.findOne({ tool_id: fetched_tool._id });
                console.log("project_find bitbucket---->", project_find);
                let scm_object = {
                  project_data: {
                    project_key: fetched_pipobj.scm.tool_project_key,
                  },
                  tool_project_name: fetched_pipobj.scm.tool_project_name,
                  repository_name: fetched_pipobj.scm.repo_name,
                  repo_url: fetched_pipobj.scm.repo_url,
                  branch_name: fetched_pipobj.scm.branch_name,
                  pipeline_key: fetched_pipobj.pipeline_key,
                  tool_name: fetched_pipobj.scm.instance_details.tool_name,
                  instance_name: fetched_pipobj.scm.instance_details.instance_name,
                  project_name: project_find.scm_project_name,
                  application_key: fetched_tool.application_key
                }
                console.log("scmobj bitbucket---->", scm_object);
                let sync_status = await bitbucket_sync.bitbucketCommitAggregation(scm_object, fetched_tool.tool_url, token, fetched_tool.proxy_required)
                console.log("sync_status bitbucket---->", sync_status);
                if (sync_status == "success") {
                  logger.info("Sync Projects Done Successfully.");
                  return "Projects data fetched successfully";
                }
              } catch (error) {
                throw new Error(error.message);
              }
              break;

            }
            case "GitLab": {
              try {
                let fetched_pipobj = await pipelines.findOne({
                  application_key: application_key
                });

                let token = fetched_tool.tool_auth.auth_token;
                let pretoken = token.split(":");
                let scm_auth_token = pretoken[1];

                let scm_obj = {
                  tool_project_key: fetched_pipobj.scm.tool_project_key,
                  tool_project_name: fetched_pipobj.scm.tool_project_name,
                  repo_name: fetched_pipobj.scm.repo_name,
                  branch_name: fetched_pipobj.scm.branch_name,
                  pipeline_key: fetched_pipobj.pipeline_key,
                }
                console.log("scm_obj  ", scm_obj);

                console.log("tool_url  ", fetched_tool.tool_url);

                let sync_status = await gitlab_sync_projects.updategitlabCommitAggregation(scm_obj, fetched_tool.tool_url, scm_auth_token);
                if (sync_status == "success") {
                  logger.info("Sync Projects Done Successfully.");
                  return "Data fetched successfully";
                }
                else if (sync_status == "failed") {
                  return "Data Not fetched successfully";
                }

              } catch (error) {
                throw new Error("Gitlab ERorrr------>", error.message);
              }
              //break;
            }
            case "Azure Repos": {
              try {
                let fetched_pipobj = await pipelines.findOne({
                  application_key: application_key
                });

                let scm_obj = {
                  tool_project_key: fetched_pipobj.scm.tool_project_key,
                  tool_project_name: fetched_pipobj.scm.tool_project_name,
                  repo_name: fetched_pipobj.scm.repo_name,
                  branch_name: fetched_pipobj.scm.branch_name,
                  pipeline_key: fetched_pipobj.pipeline_key,
                }

                let sync_status = await azurerepos_sync_projects.UpdateazurereposCommitAggregation(scm_obj, fetched_tool.tool_url, fetched_tool.tool_auth.auth_token);
                if (sync_status == "success") {
                  logger.info("Sync Projects Done Successfully.");
                  return "Data fetched successfully";
                }
                else if (sync_status == "failed") {
                  return "Data Not fetched successfully";
                }

              } catch (error) {
                throw new Error(error.message);
              }
              break;
            }
          }
        }

        case "Continuous Integration": {
          //switch (fetched_tool.tool_name) {
          // case "Jenkins": {
          try {
            const pipeline_for_app = await pipeline_table.find({ "application_key": application_key, "continuous_integration.instance_details.instance_name": tool_instance_name })

            for (let n = 0; n < pipeline_for_app.length; n++) {
              if (pipeline_for_app[n].pipeline_type == "PIPELINE_EXISTING" || pipeline_for_app[n].pipeline_type == "PIPELINE_STANDARD") {
                const cii_obj = {
                  'tool_project_name': pipeline_for_app[n].continuous_integration.tool_project_name,
                  'job_url': pipeline_for_app[n].continuous_integration.job_url
                }
                const sync_status = await poller_service.sync_tool_data_continuousIntegration(application_key,
                  tool_category,
                  tool_instance_name,
                  cii_obj,
                  pipeline_for_app[n].pipeline_key
                )

              }
            }
            logger.info("Sync Projects Done Successfully.");
            return "Projects data fetched successfully";
          }
          catch (error) {
            throw new Error(error.message);
          }
        }

        case "Continuous Deployment":
        case "Code Security":
        case "Code Analysis": {
          switch (fetched_tool.tool_name) {
            case "Sonarqube":
              try {

                const pipeline_for_app = await pipeline_table.find({ "application_key": application_key, "code_quality.instance_details.instance_name": tool_instance_name })

                for (let n = 0; n < pipeline_for_app.length; n++) {

                  const caa_obj = {
                    'tool_project_key': pipeline_for_app[n].code_quality.tool_project_key,
                    'tool_project_name': pipeline_for_app[n].code_quality.tool_project_name,
                    'is_sync': pipeline_for_app[n].code_quality.is_sync
                  }
                  var sync_status_sonar = await poller_service.sync_tool_data_codeAnalysis(application_key,
                    tool_category,
                    tool_instance_name,
                    caa_obj,
                    pipeline_for_app[n].pipeline_key
                  )
                  console.log(sync_status_sonar);

                }
                if (sync_status_sonar == "success") {
                  logger.info("Sync Projects Done Successfully.");
                  return "Projects data fetched successfully";
                }
                else if (sync_status_sonar == "failure") {
                  return "Projects data not fetched successfully";
                }
              }
              catch (error) {
                throw new Error(error.message);
              }
          }
        }

        case "DAST": {
          switch (fetched_tool.tool_name) {
            case "Qualys":
          }
        }

        case "Artifactory Management": {
          switch (fetched_tool.tool_name) {
            case "JFrog":
          }
        }

        case "Security": {
          switch (fetched_tool.tool_name) {
            case "CodeDx":
          }
        }
        case "ITSM": {
          switch (fetched_tool.tool_name) {
            case "ServiceNow": {

              try {
                let snResult = await serviceNowData.get_all_incidents_by_app(application_key);
                if (snResult == 'success') {
                  return ("Incidents data fetched successfully");
                }
                else if (snResult == 'failure') {
                  return ("Incidents data not fetched successfully");
                }
              }
              catch (error) {
                throw new Error("ITSM ERROR--------------->", error.status);
              }
              break;
            }
          }
          break;
        }

        case "Binary Repository":
        default:
          return "Tool Category Not Found";

      }


    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  module.exports.getAllProjects = async (
    application_key,
    // tool_category,
    tool_name,
    tool_instance_name
  ) => {
    try {

      // console.log('appkey ', application_key)
      // console.log('tool_category ', tool_category)
      // console.log('tool_instance_name ', tool_instance_name)

      var fetched_tool = await tool
        .findOne({
          application_key: application_key,
          tool_name: tool_name,
          tool_instance_name: tool_instance_name,
        })
        .lean();

      try {
        switch (tool_name) {
          //Codedx Can be Optimized here for fecthing projects
          case 'Bitbucket':
            console.log('start2 ', new Date())
            let buildToolData = await vaultToken.getToken(fetched_tool);
            // console.log('fetched_tool', new Date(), buildToolData, fetched_tool)
            let scm_projects = await bitbucket_sync_projects.fetch_projects1(
              buildToolData
            )
            // console.log('fetched_tool1', new Date())
            return scm_projects.map(elem => {
              return { 'key': elem.key, 'name': elem.name, 'url': elem.links.self[0].href }

            }
            );
            break;
          case "GitLab":
            let scm_project = [];
            scm_project = await gitlab_sync_projects.fetch_groups(
              fetched_tool
            );
            var gitlab_projects = await gitlab_sync_projects.fetch_usernamespace_projects(fetched_tool);

            let gitlab_usernamespace = {
              'id': gitlab_projects[0].namespace.id,
              'name': gitlab_projects[0].namespace.name,
              'web_url': gitlab_projects[0].namespace.web_url
            }

            scm_project.push(gitlab_usernamespace);

            return scm_project.map(elem => {
              return { 'key': elem.id, 'name': elem.name, 'url': elem.web_url }
            }
            );
            break;
          case "Azure Repos":
            let az_projects = await azurerepos_sync_projects.fetch_projects(
              fetched_tool
            );

            return az_projects.map(elem => {
              return { 'key': elem.id, 'name': elem.name, 'url': elem.url }
            }
            );
            break;
          case "Sonarqube":
            let caprojects = await sonarqube_sync_projects.fetch_projects(fetched_tool);
            return caprojects.map(elem => {
              return { 'key': elem.key, 'name': elem.name }
            });
            break;
          case "Jenkins":
            let jenkinsdata = await jenkins_sync_projects.fetch_jobs(fetched_tool);
            return jenkinsdata.map(elem => {
              return { 'name': elem.name }
            });
            break;
          case "Azure Devops":
            let azuredevopsdata = await jenkins_sync_projects.fetch_jobs_azure(fetched_tool);
            return azuredevopsdata.map(elem => {
              return { 'name': elem.name, 'url': elem.url, 'id': elem.id }
            });
            break;
          //Codedx Can be Optimized here for fecthing projects
        }
      }
      catch (error) {

        throw error;
      }

    }
    catch (error) {

      throw new Error(error.message);
    }
  },
  module.exports.getAllRepo = async (
    application_key,
    tool_name,
    tool_instance_name,
    project_key,
    project_name
  ) => {
    try {

      let fetched_tool = await tool
        .findOne({
          application_key: application_key,
          tool_name: tool_name,
          tool_instance_name: tool_instance_name,
        })
        .lean();

      try {
        switch (tool_name) {

          case 'Bitbucket':

            let buildToolData = await vaultToken.getToken(
              fetched_tool
            )

            let scm_repo = await bitbucket_sync_projects.fetch_repo(
              buildToolData, project_key
            )

            // let v = scm_projects
            //   .map(elem => {
            //      {'id': elem.id,
            //       'name': elem.name }

            //   });
            // console.log("map", v);
            return scm_repo
              .map(elem => {
                return { 'id': elem.id, 'name': elem.name, 'url': elem.links.self[0].href }

              }
              );
            break;
          case "GitLab":
            let scm_repos = await gitlab_sync_projects.fetch_projectsusingGroup(
              fetched_tool,
              project_key
            );

            return scm_repos
              .map(elem => {
                return { 'id': elem.id, 'name': elem.name, 'url': elem.web_url }

              }
              );

            break;
          case "Azure Repos":

            let az_repos = await azurerepos_sync_projects.fetch_repositories(
              fetched_tool,
              project_name
            );

            return az_repos
              .map(elem => {
                return { 'id': elem.id, 'name': elem.name, 'url': elem.url }

              }
              );
        }
      }
      catch (error) {

        throw error;
      }

    }
    catch (error) {

      throw new Error(error.message);
    }
  },
  module.exports.getAllBranches = async (
    application_key,
    // tool_category,
    tool_name,
    tool_instance_name,
    project_key,
    repo_name,
    repo_id,
    project_name
  ) => {
    try {


      let fetched_tool = await tool
        .findOne({
          application_key: application_key,
          tool_name: tool_name,
          tool_instance_name: tool_instance_name,
        })
        .lean();
      try {
        switch (tool_name) {

          case 'Bitbucket':

            let buildToolData = await vaultToken.getToken(
              fetched_tool
            )

            let scm_branches_received = await bitbucket_sync_projects.fetch_branch(
              buildToolData, project_key, repo_name
            )
            // console.log('scm_branch', scm_projects);
            if (scm_branches_received.length != 0) {
              return scm_branches_received
                .map(elem => {
                  return { 'id': elem.id, 'name': elem.displayId }

                }
                );
            }
            else {
              return 0
            }


            break;

          case "GitLab":

            let scm_branches = await gitlab_sync_projects.fetch_branches(
              fetched_tool, repo_id
            );

            return scm_branches
              .map(elem => {
                return { 'id': elem.commit.id, 'name': elem.name }

              }
              );
            break;

          case "Azure Repos":

            let az_branches = await azurerepos_sync_projects.fetch_branches(
              fetched_tool,
              project_name,
              repo_name,
              repo_id
            );
            return az_branches
              .map(elem => {
                return { 'id': elem.objectId, 'name': elem.name }

              }
              );



        }
      }
      catch (error) {

        throw error;
      }


    }
    catch (error) {
      throw new Error(error.message);
    }
  },
  /**
    * This function validates a new Tool
    * @param {Object} tool_details
  
    */

  module.exports.get_project_data = async (
    tool_url,
    tool_pass
  ) => {
    var unirest = require('unirest');
    let azuretoken = new Buffer.from(tool_pass).toString('base64');
    let req = await unirest('GET', `${tool_url}/_apis/projects?api-version=5.0-preview.3`)
      .headers({
        'Authorization': 'Basic' + azuretoken,//dGVzdDpleWtsaGtsNHJvMmJ1Y2d4bmNqNndnaWFpaHp1YmJyeXN5eTVpdGlvY2dpc3FsaHhpdWlx',
        'Content-Type': 'application/json',
      })
    //   .then((response) => {
    //     console.log("response",response.body.value);
    //     return response.body.value;

    // });
    // console.log("req.body.value",req.body);
    resp = req.body.value;
    var project_data = [];
    for (var i = 0; i < resp.length; i++) {
      //project_data.push({"name": resp[i]["name"], "id": resp[i]["id"]});
      project_data.push(resp[i]["name"]);
    }

    return project_data;
  },
  module.exports.validate_tool = async (tool_details) => {

    try {

      switch (tool_details.tool_category) {
        case "Planning": {
          switch (tool_details.tool_name) {
            case "Jira": {

              var validation_status = await jira_validate_tool.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");

              }
            }
            case "Azure Boards": {

              var validation_status = await jenkins_validate_tool.validateAzure(
                tool_details
              );

              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
          }
          break;
        }

        case "Source Control": {
          switch (tool_details.tool_name) {
            case "Bitbucket": {
              var validation_status = await bitbucket_validate_tool.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
            case "GitLab": {
              var validation_status = await gitLab_validate_tool.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
            case "Azure Repos": {
              var validation_status = await azurerepos_validate_tool.validateAzure(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
          }
          break;
        }
        case "Code Analysis": {
          switch (tool_details.tool_name) {
            case "Sonarqube": {
              var validation_status = await sonarqube_validate_tool.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
          }
          break
        }
        case "Continuous Integration": {
          switch (tool_details.tool_name) {
            case "Jenkins": {
              var validation_status = await jenkins_validate_tool.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }

            case "Azure Devops": {

              var validation_status = await jenkins_validate_tool.validateAzure(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }

            case "JFrog": {
              return "Tool validation successfull";
            }
          }
          break
        }
        case "ITSM": {
          switch (tool_details.tool_name) {
            case "ServiceNow": {
              var validation_status = await servicenow_validate_tool.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
          }
          break
        }
        case "Artifactory Management": {
          switch (tool_details.tool_name) {
            case "JFrog": {
              var validation_status = await jfrog.validate(tool_details);
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return "Tool validation successfull";
              } else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }
            }
          }
          break
        }
        case "Security": {
          switch (tool_details.tool_name) {
            case "CodeDx": {

              var validation_status = await codex.validate(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return ("Tool validation successfull");
              }
              else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }




            }

          }
          break
        }

        case "DAST": {
          switch (tool_details.tool_name) {
            case "Qualys": {

              var validation_status = await qualys_validate_tool.validateTools(
                tool_details
              );
              if (validation_status == 200) {
                logger.info("Tool Validated Successfully");
                return ("Tool validation successfull");
              }
              else {
                logger.error("Tool Validation Failed");
                throw new Error("Tool validation unsuccessfull");
              }

            }
          }
          break
        }
        case "default": {
          throw new Error("Tool validation unsuccessfull");
        }
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },

  /**
   * This function saves a new Tool
   * @param {Object} tool_details
   */
  module.exports.save_tool = async (tool_details) => {
    try {
      var new_tool;
      let vault_tool_category = "";
      let vault_config_status
      var find_tool = await tool.findOne({
        application_key: tool_details.application_key,
        tool_name: tool_details.tool_name,
        tool_instance_name: tool_details.tool_instance_name,
      });

      if (find_tool == null) {
        vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
          tool_details.application_key
        );

        if (vault_config_status == true) {

          switch (tool_details.tool_category) {
            case "Source Control":
              vault_tool_category = "Source_Control";
              break;
            case "Planning":
              vault_tool_category = "Planning";
              break;
            case "Code Analysis":
              vault_tool_category = "Code_Analysis";
              break;
            case "Continuous Integration":
              vault_tool_category = "Continuous_Integration";
              break;
            case "Security":

              vault_tool_category = "Code_Security";
              break;
            case "Continuous Deployment":
              vault_tool_category = "Continuous_Deployment";
              break;
            case "ITSM":
              vault_tool_category = "ITSM";
              break;
            case "Artifactory Management":
              vault_tool_category = "Artifactory_Management";
              break;
            case "DAST":
              vault_tool_category = "DAST";
              break;
          }
          var create_secret = await hashicorp_vault_create.create_tool_secret(
            tool_details.application_key,
            vault_tool_category,
            tool_details
          );

          if (create_secret == "created") {
            var new_tool = new tool({
              proxy_required: tool_details.proxy_required,
              application_key: tool_details.application_key,
              tool_url: tool_details.tool_url,
              tool_instance_name: tool_details.tool_instance_name,
              tool_category: tool_details.tool_category,
              tool_name: tool_details.tool_name,
              tool_version: tool_details.tool_version,
              webhook_enable: tool_details.webhook_enable
            });
            await tool.create(new_tool);
            logger.info("Tool Saved Successfully");
            return "success";
          } else {
            logger.error("Tool is not saved ");
            throw new Error("Instance name is taken");
          }
        }
        else {

          //new_tool = new tool(tool_details);
          var new_tool = new tool(tool_details);
          await tool.create(new_tool);
          logger.info("Tool Saved Successfully");
          return "success";

        }
      }
      else {
        logger.error("Tool is not saved ");
        throw new Error("Instance name  is taken ");
      }
    } catch (error) {
      logger.error("Tool is not saved ");
      throw new Error(error.message);

    }
  },



  module.exports.sync_tool_users = async (
    application_key,
    tool_category,
    tool_instance_name
  ) => {
    try {
      var fetched_tool = await tool
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

          // fetched_tool.tool_auth.auth_username =
          //   vault_configuration.auth_username;
          // fetched_tool.tool_auth.auth_password =
          //   vault_configuration.auth_password;
        } else {
          fetched_tool.tool_auth.auth_token = vault_configuration.auth_token;
        }
      } else {
      }

      switch (fetched_tool.tool_category) {
        case "Planning": {
          switch (fetched_tool.tool_name) {
            case "Jira": {
              try {
                var jira_users = await jira_sync_users.fetch_users(
                  fetched_tool
                );
                await existing_planning_users.deleteMany({
                  tool_id: fetched_tool._id,
                });
                for await (let jira_user of jira_users) {
                  var jira_user_object = new existing_planning_users({
                    planning_tool: "Jira",
                    planning_user_name: jira_user.name,
                    planning_user_display_name: jira_user.displayName,
                    planning_user_key: jira_user.key,
                    planning_user_email: jira_user.emailAddress,
                    application_key: application_key,
                    tool_id: fetched_tool._id,
                  });

                  let test = await existing_planning_users.create(jira_user_object);

                }
                return "Users fetched successfully";
              } catch (error) {
                throw new Error(error.message);
              }
            }
          }
          break;
        }
        case "Source Control": {
          switch (fetched_tool.tool_name) {
            case "Bitbucket": {
              try {
                var scm_users = await bitbucket_sync_users.fetch_users(
                  fetched_tool
                );
                await existing_scm_users.deleteMany({
                  tool_id: fetched_tool._id,
                });
                for await (let scm_user of scm_users) {
                  var scm_user_object = new existing_scm_users({
                    application_key: application_key,
                    scm_user_name: scm_user.name,
                    scm_user_display_name: scm_user.displayName,
                    scm_user_key: scm_user.key,
                    scm_user_email: scm_user.emailAddress,
                    tool_id: fetched_tool._id,
                    scm_tool: "Bitbucket",
                  });
                  await existing_scm_users.create(scm_user_object);
                }
                return "Users fetched successfully";
              } catch (error) {
                throw new Error(error.message);
              }
            }
            case "Azure Repos": {
              try {
                var proj_name = await existing_scm_projects.find({ tool_id: fetched_tool._id })
              }
              catch (error) {
                throw new Error(error);
              }
              for await (let proj of proj_name) {
                try {
                  var scm_users = await azurerepos_sync_users.fetch_users(
                    fetched_tool, proj.scm_project_name
                  );
                  await existing_scm_users.deleteMany({
                    tool_id: fetched_tool._id,
                  });
                  for await (let scm_user of scm_users) {
                    var scm_user_object = new existing_scm_users({
                      application_key: application_key,
                      scm_user_name: scm_user.principalName,
                      scm_user_display_name: scm_user.displayName,
                      scm_user_key: scm_user.originId,
                      scm_user_email: scm_user.mailAddress,
                      tool_id: fetched_tool._id,
                      scm_tool: "Azure Repos",
                    });
                    if (scm_user.mailAddress != '') {
                      await existing_scm_users.create(scm_user_object);
                    }
                  }
                  return "Users fetched successfully";
                } catch (error) {
                  throw new Error(error.message);
                }
              }
            }
            case "GitLab": {
              try {
                var scm_users = await gitlab_sync_users.fetch_gitlab_users(
                  fetched_tool
                );
                await existing_scm_users.deleteMany({
                  tool_id: fetched_tool._id,
                });
                for await (let scm_user of scm_users) {
                  var scm_user_object = new existing_scm_users({
                    application_key: application_key,
                    scm_user_name: scm_user.name,
                    scm_user_display_name: scm_user.username,
                    scm_user_key: scm_user.id,
                    tool_id: fetched_tool._id,
                    scm_tool: "GitLab",
                  });
                  // await existing_scm_users.create(scm_user_object);
                  await existing_scm_users.findOneAndUpdate({ scm_user_key: scm_user.id },
                    {
                      "$set": {
                        application_key: application_key,
                        scm_user_name: scm_user.name,
                        scm_user_display_name: scm_user.username,
                        scm_user_key: scm_user.id,
                        tool_id: fetched_tool._id,
                        scm_tool: "GitLab"
                      }
                    },
                    { upsert: true, new: true });
                }
                return "Users fetched successfully";
              } catch (error) {
                throw new Error(error.message);
              }
            }
          }
          break;


        }

        case "Continuous Integration": {
          switch (fetched_tool.tool_name) {
            case "Jenkins": {
              try {
                var jenkins_users = await jenkins_sync_users.fetch_users(
                  fetched_tool
                );
                await existing_continuous_integration_users.deleteMany({
                  tool_id: fetched_tool._id,
                });
                for await (let jenkins_user of jenkins_users) {
                  var jenkins_user_object = new existing_continuous_integration_users(
                    {
                      ci_user_full_name: jenkins_user.user.fullName,
                      ci_user_url: jenkins_user.user.absoluteUrl,
                      tool_id: fetched_tool._id,
                      ci_tool: "Jenkins",
                      application_key: application_key,
                    }
                  );
                  await existing_continuous_integration_users.create(
                    jenkins_user_object
                  );
                }
                return "Users fetched successfully";
              } catch (error) {
                throw new Error(error.message);
              }
            }
          }
        }
        case "Continuous Deployment":
        case "Code Security":
        case "Code Analysis": {
          switch (fetched_tool.tool_name) {
            case "Sonarqube": {
              try {
                var sonarqube_users = await sonarqube_sync_users.fetch_users(
                  fetched_tool
                );
                await existing_code_analysis_users.deleteMany({
                  tool_id: fetched_tool._id,
                });
                for await (let sonarqube_user of sonarqube_users) {
                  var sonarqube_user_object = new existing_code_analysis_users({
                    application_key: application_key,
                    code_analysis_login: sonarqube_user.login,
                    code_analysis_user_name: sonarqube_user.name,
                    code_analysis_user_email: sonarqube_user.email,
                    tool_id: fetched_tool._id,
                    code_analysis_tool: "Sonarqube",
                  });
                  await existing_code_analysis_users.create(
                    sonarqube_user_object
                  );
                }
                return "Users fetched successfully";
              } catch (error) {
                throw new Error(error.message);
              }
              break;
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
