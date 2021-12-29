var logger = require("../../../configurations/logging/logger");
var existing_scm = require("../../../models/existing_scm_projects");
var existing_planning = require('../../../models/existing_planning_projects');
var existing_ci = require('../../../models/existing_continuous_integration_jobs');
// var existing_plan = require('../../../models/existing_planning_projects');
var gitlab_sync = require('../../../connectors/GitLab/gitlab_sync_project');
var gitlab_sync_webhook = require('../../../connectors/GitLab/gitlab_sync');
var azure_sync_webhook = require('../../../connectors/azurerepos/azurerepos_sync');
var azurerepos_sync_projects = require('../../../connectors/azurerepos/azurerepos_sync_projects.js');
var bitbucket_sync = require('../../../connectors/bitbucket/bitbucket_sync');
var jenkins_sync = require('../../../connectors/jenkins/jenkins_sync');
var update_creation_status = require('../../../service_helpers/common/update_creation_status');
var existing_code_quality = require('../../../models/existing_code_analysis_projects')
var pipelines = require('../../../models/pipeline');
var tool = require('../../../models/tool');
var jira_sync = require('../../../connectors/jira/jira_sync');
var sonarqube_sync = require('../../../connectors/sonarqube/sonarqube_sync');
var jenkins_ceate = require('../../../connectors/jenkins/jenkins_create');
var sprint_data = require("../../../models/sprint");
var planning_sync_db_save = require('../../../service_helpers/common/planning_sync_db_save');
var ci_sync_db_save = require('../../../service_helpers/common/ci_sync_db_save');
var code_analysis_db_save = require("../../../service_helpers/common/code_analysis_db_save");
var jenkins_xml_update_helper = require("../../../service_helpers/common/jenkins_xml_update_helper");
var dashboard_service = require('../../dashboard/dashboard_service');
var hashicorp_vault_helper = require("../../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../../connectors/hashicorp-vault/read_secret");
var pipeline_dashboard_service = require('../dashboard/pipeline_dashboard_service');
//var generate_file = require('../../../service_helpers/common/generate_sonar_properties_file');
//var generate_jenkins_file = require('../../../service_helpers/common/generate_jenkins_file');
var bitbucket_push = require('../../../service_helpers/bitbucket_push');
const jenkins_update_xml = require("../../../connectors/jenkins/jenkins_update_xml");
var generate_jenkins_file = require("../../../service_helpers/common/generate_jenkins_file.js");

var jenkins_xml_update_helper = require("../../../service_helpers/common/jenkins_xml_update_helper");
var logger = require('../../../configurations/logging/logger');



module.exports = {



    /**
        * function saves  source control data after onboarding of source control
        * @param {object} scm_obj
        * @param {String} project_key
        * @param {object} tool_details
        * @param {String} bitbucket_repo_url
        * @param {[String]} bb_tool_roles
        *
        */
    save_pipeline_scm_data: async (scm_obj, project_key, tool_details, bitbucket_repo_url, bb_tool_roles) => {

        try {
            await pipelines.findOneAndUpdate({
                "pipeline_key": scm_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "scm": {
                        "creation_status": "SUCCESS",
                        "project_url": (`${tool_details.tool_url}/projects/${project_key}`).toLowerCase(),
                        "repo_url": bitbucket_repo_url,
                        "repo_name": scm_obj.repository_name,
                        "branch_name": scm_obj.branch_name,
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": scm_obj.project_name,
                        "is_sync": true,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": bb_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (error) {
            logger.error('Error', error);
            throw error;
        }

    },
    save_pipeline_gitlab_data: async (scm_obj, project_key, tool_details, bitbucket_repo_url, bb_tool_roles) => {

        try {
            let group = scm_obj.project_data.project_repo_url;
            let group_names = group.split("/");
            var group_name = group_names[4];
            await pipelines.findOneAndUpdate({
                "pipeline_key": scm_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "scm": {
                        "creation_status": "SUCCESS",
                        "project_url": scm_obj.project_data.project_repo_url,
                        "repo_url": (`${tool_details.tool_url}/projects/${project_key}`).toLowerCase(),
                        "repo_name": scm_obj.repository_name,
                        "branch_name": scm_obj.branch_name,
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": scm_obj.project_name,
                        "is_sync": true,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": bb_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (error) {
            logger.error('Error', error);
            throw error;
        }

    },
    save_pipeline_azurerepos_data: async (scm_obj, project_key, tool_details, bitbucket_repo_url, bb_tool_roles) => {

        try {
            // let group = scm_obj.project_data.project_repo_url;
            // let group_names = group.split("/");
            // var group_name = group_names[4];
            await pipelines.findOneAndUpdate({
                "pipeline_key": scm_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "scm": {
                        "creation_status": "SUCCESS",
                        "project_url": scm_obj.project_data.project_repo_url,
                        "repo_url": (`${tool_details.tool_url}/${scm_obj.project_name}/${scm_obj.repository_name}`).toLowerCase(),
                        "repo_name": scm_obj.repository_name,
                        "branch_name": scm_obj.branch_name,
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": scm_obj.project_name,
                        "is_sync": true,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": bb_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (error) {
            logger.error('Error', error);
            throw error;
        }

    },
    save_pipeline_gitlab_workflow_data: async (scm_obj, project_key, tool_details, bitbucket_repo_url, bb_tool_roles) => {

        try {
            let group = scm_obj.project_repo_url;
            let group_names = group.split("/");
            var group_name = group_names[4];
            await pipelines.findOneAndUpdate({
                "pipeline_key": scm_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "scm": {
                        "creation_status": "SUCCESS",
                        "project_url": scm_obj.project_repo_url,
                        "repo_url": (`${tool_details.tool_url}/projects/${project_key}`).toLowerCase(),
                        "repo_name": scm_obj.repository_name,
                        "branch_name": scm_obj.branch_name,
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": scm_obj.project_name,
                        "is_sync": true,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": bb_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (error) {
            logger.error('Error', error);
            throw error;
        }

    },


    /**
        * function saves continuous integration data after onboarding of continuous integration
        * @param {object} continuous_integration_obj
        * @param {String} project_key
        * @param {object} tool_details
        * @param {[String]} ci_tool_roles
        */
    save_pipeline_continuous_integration_data: async (continuous_integration_obj, project_key, tool_details, ci_tool_roles) => {
        try {
            await pipelines.findOneAndUpdate({
                "pipeline_key": continuous_integration_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "continuous_integration": {
                        "is_sync": true,
                        "creation_status": "SUCCESS",
                        "job_url": (`${tool_details.tool_url}/job/${continuous_integration_obj.project_name}`),
                        "job_name": continuous_integration_obj.project_name,
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": continuous_integration_obj.project_name,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": ci_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (error) {
            logger.error('save_pipeline_continuous_integration_data', error);
            let err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }
    },


    /**
        * function fetches all commits and pull request data on successful onboarding of source control stage
        * @param {object} scm_obj
        */
    sync_scm: async (scm_obj) => {

        update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "IN PROGRESS");
        try {
            var tool_details = await tool.findOne({ tool_instance_name: scm_obj.instance_name, application_key: scm_obj.application_key }).lean();

            let repos_object = {
                scm_repo_id: scm_obj.repo_id,
                scm_repo_name: scm_obj.repository_name,
                scm_repo_self: scm_obj.repo_url
            }
            let branches_object = {
                scm_branch_id: scm_obj.branch_id,
                scm_branch_display_id: scm_obj.branch_name

            }
            await existing_scm.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: scm_obj.project_key },
                {
                    "$set": {
                        "scm_tool": scm_obj.tool_name,
                        "scm_project_key": scm_obj.project_key,
                        "scm_project_type": "NORMAL",
                        "scm_project_name": scm_obj.project_name,
                        "scm_project_self": scm_obj.project_url,
                        "tool_id": tool_details._id,
                    }
                },
                { upsert: true, new: true }
            );

            // db.coll.update(
            //     {_id: id, 'profile_set.name': {$ne: 'nick'}}, 
            //     {$push: {profile_set: {'name': 'nick', 'options': 2}}})

            let try1 = await existing_scm.findOne({ tool_id: tool_details._id, scm_project_key: scm_obj.project_key, "repos.scm_repo_name": scm_obj.repository_name }).lean();

            let resp = await existing_scm.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: scm_obj.project_key, "repos.scm_repo_name": { $ne: scm_obj.repository_name } },
                {
                    $push: {
                        repos: repos_object

                    }
                }

            );

            let resp3 = await existing_scm.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: scm_obj.project_key, "repos.scm_repo_name": scm_obj.repository_name, "repos.branches.scm_branch_display_id": { $ne: scm_obj.branch_name } },
                {
                    $push: {
                        "repos.$.branches": branches_object
                    }
                }
            );
        }
        catch (error) {
            logger.error('sync_scm tool_details', error);
            throw new Error(error.message);
        }
        try {
            var project_data = {
                "project_repo_url": "",
                "project_id": "",
                "project_key": ""
            }
            let project_details = await existing_scm.findOne({ scm_project_name: scm_obj.project_name })
            project_data.project_id = project_details.scm_project_id;
            project_data.project_key = project_details.scm_project_key;

            for (let repo of project_details.repos) {
                if (repo.scm_repo_name == scm_obj.repository_name)
                    project_data.project_repo_url = project_details.scm_project_self;
            }
            scm_obj.project_data = project_data;
        }
        catch (error) {
            logger.error('sync_scm project_details', error);
            throw new Error(error.message);
        }
        let tool_url = tool_details.tool_url;
        let scm_auth_token
        let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            scm_obj.application_key
        );


        if (vault_config_status == true) {
            let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                scm_obj.application_key,
                tool_details.tool_category,
                scm_obj.tool_name,
                scm_obj.instance_name
            );
            if (vault_configuration.auth_type == "password") {

                scm_auth_token = new Buffer.from(
                    vault_configuration.auth_username + ':' +
                    vault_configuration.auth_password
                ).toString('base64');

            } else {
                scm_auth_token = vault_configuration.auth_token;
            }
        }
        else {
            if (tool_details.tool_auth.auth_type == 'password') {
                scm_auth_token = new Buffer.from(
                    tool_details.tool_auth.auth_username + ':' +
                    tool_details.tool_auth.auth_password
                ).toString('base64');
            }
            else {
                if (tool_details.tool_name == "GitLab") {
                    let token = tool_details.tool_auth.auth_token;
                    let pretoken = token.split(":");
                    scm_auth_token = pretoken[1];

                }
                else {
                    scm_auth_token = tool_details.tool_auth.auth_token;
                }
            }
        }
        let scm_proxy_flag = tool_details.proxy_required;
        let scm_tool_name = scm_obj.tool_name.toUpperCase();
        try {
            switch (scm_tool_name) {
                case 'BITBUCKET':
                    if (scm_obj.is_sync == true) {

                        let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                        try {
                            if (tool_details.webhook_enable) {
                                await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            }
                            let sync_status = await bitbucket_sync.bitbucketCommitAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            if (sync_status == "success") {
                                try {
                                    let data_update_status = await module.exports.save_pipeline_scm_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
                                    if (data_update_status == "success") {
                                        generate_jenkins_file.generate_jenkins(scm_obj.pipeline_key, scm_obj.application_key);

                                        // await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
                                        setTimeout(async function () {
                                            await jenkins_xml_update_helper.updateJenkinsXml(scm_obj.pipeline_key)
                                        }, 10000);
                                        //const logger = log4js.getLogger();
                                        logger.info("Onboarding done Successfully.");
                                        return ("Project synchronized in Bitbucket");
                                    }


                                }
                                catch (error) {
                                    //const logger = log4js.getLogger();
                                    logger.error("Onboarding Failed.");
                                    logger.error('sync_scm data_update_status', error);
                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
                                let err = new Error("Failed to synchronize in Bitbucket");
                                throw err;
                            }
                        }
                        catch (error) {
                            logger.error('sync_scm sync_status', error);
                            throw new Error(error.message);
                        }
                    }
                case 'GITLAB':
                    let project_detail = await existing_scm.findOne({ scm_project_name: scm_obj.project_name, scm_project_key: scm_obj.project_key, tool_id: tool_details._id });


                    for (let repo of project_detail.repos) {
                        console.log("repo.scmname", repo.scm_repo_name);
                        console.log("repo.scmobj", scm_obj.repository_name);
                        if (repo.scm_repo_name == scm_obj.repository_name) {
                            console.log("in if condn for scm repo");
                            project_data.project_id = repo.scm_repo_id;
                            project_data.project_key = repo.scm_repo_id;
                            project_data.project_repo_url = project_detail.scm_project_self;
                        }
                        else {
                            console.log("in else condn for scm repo");
                            project_data.project_repo_url = project_detail.scm_project_self;
                        }

                    }
                    scm_obj.project_data = project_data;

                    if (scm_obj.is_sync == true) {
                        let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                        try {
                            if (tool_details.webhook_enable) {
                                await gitlab_sync_webhook.create_gitlab_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            }

                            let sync_status = await gitlab_sync.gitlabCommitAggregation(scm_obj, tool_url, scm_auth_token);

                            if (sync_status == "success") {
                                try {

                                    let data_update_status = await module.exports.save_pipeline_gitlab_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)

                                    if (data_update_status == "success") {

                                        //await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
                                        setTimeout(async function () {
                                            await jenkins_xml_update_helper.updateJenkinsXml(scm_obj.pipeline_key);
                                        }, 10000);
                                        //const logger = log4js.getLogger();
                                        logger.info("Onboarding done Successfully.");
                                        return ("Project synchronized in Bitbucket");
                                    }


                                }
                                catch (error) {
                                    //const logger = log4js.getLogger();
                                    logger.error("Onboarding Failed.");
                                    logger.error('sync_scm data_update_status', error);
                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
                                let err = new Error("Failed to synchronize in Gitlab");
                                throw err;
                            }
                        }
                        catch (error) {

                            logger.error('sync_scm sync_status', error);
                            throw new Error(error.message);
                        }
                    }
                case 'AZURE REPOS':
                    let project_details = await existing_scm.findOne({ scm_project_name: scm_obj.project_name });

                    for (let repo of project_details.repos) {
                        if (repo.scm_repo_name == scm_obj.repository_name) {
                            project_data.project_id = repo.scm_repo_id;
                            project_data.project_key = repo.scm_repo_id;
                            project_data.project_repo_url = project_details.scm_project_self;
                        }
                        else {
                            project_data.project_repo_url = project_details.scm_project_self;
                        }

                    }
                    scm_obj.project_data = project_data;

                    if (scm_obj.is_sync == true) {
                        let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                        try {
                            // await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            //  let sync_status = await azurerepos_sync_projects.azurereposCommitAggregation(scm_obj, tool_url, scm_auth_token);

                            if (tool_details.webhook_enable) {

                                await azure_sync_webhook.create_azure_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            }
                            let sync_status = await azurerepos_sync_projects.azurereposCommitAggregation(scm_obj, tool_url, scm_auth_token);
                            await generate_jenkins_file.generate_jenkins(scm_obj.pipeline_key, scm_obj.application_key);
                            if (sync_status == "success") {

                                try {

                                    let data_update_status = await module.exports.save_pipeline_azurerepos_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
                                    if (data_update_status == "success") {
                                        generate_jenkins_file.generate_jenkins(scm_obj.pipeline_key, scm_obj.application_key);
                                        // await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
                                        // generate_jenkins_file(scm_obj.pipeline_key, scm_obj.application_key);
                                        //const logger = log4js.getLogger();
                                        logger.info("Onboarding done Successfully.");
                                        return ("Project synchronized in AzureRepos");
                                    }


                                }
                                catch (error) {
                                    //const logger = log4js.getLogger();
                                    logger.error("Onboarding Failed.");
                                    logger.error('sync_scm data_update_status', error);
                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
                                let err = new Error("Failed to synchronize in Azure Devops");
                                throw err;
                            }
                        }
                        catch (error) {

                            logger.error('sync_scm sync_status', error);
                            throw new Error(error.message);
                        }
                    }
            }
        }
        catch (error) {
            logger.error('sync_scm  switch (scm_tool_name)', error);
            throw new Error(error.message);
        }
    },
    // sync_scm: async (scm_obj) => {
    //     update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "IN PROGRESS");

    //     try {
    //         var tool_details = await tool.findOne({ tool_instance_name: scm_obj.instance_name })
    //     }
    //     catch (error) {
    //         logger.error('sync_scm tool_details', error);
    //         throw new Error(error.message);
    //     }
    //     try {
    //         var project_data = {
    //             "project_repo_url": "",
    //             "project_id": "",
    //             "project_key": ""
    //         }
    //         let project_details = await existing_scm.findOne({ scm_project_name: scm_obj.project_name })
    //         project_data.project_id = project_details.scm_project_id;
    //         project_data.project_key = project_details.scm_project_key;

    //         for (let repo of project_details.repos) {
    //             if (repo.scm_repo_name == scm_obj.repository_name)
    //                 project_data.project_repo_url = project_details.scm_project_self;
    //         }
    //         scm_obj.project_data = project_data;
    //     }
    //     catch (error) {
    //         logger.error('sync_scm project_details', error);
    //         throw new Error(error.message);
    //     }
    //     let tool_url = tool_details.tool_url;
    //     let scm_auth_token
    //     let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
    //         scm_obj.application_key
    //     );


    //     if (vault_config_status == true) {
    //         let vault_configuration = await hashicorp_vault_config.read_tool_secret(
    //             scm_obj.application_key,
    //             tool_details.tool_category,
    //             scm_obj.tool_name,
    //             scm_obj.instance_name
    //         );
    //         if (vault_configuration.auth_type == "password") {

    //             scm_auth_token = new Buffer.from(
    //                 vault_configuration.auth_username + ':' +
    //                 vault_configuration.auth_password
    //             ).toString('base64');

    //         } else {
    //             scm_auth_token = vault_configuration.auth_token;
    //         }
    //     }
    //     else {
    //         if (tool_details.tool_auth.auth_type == 'password') {
    //             scm_auth_token = new Buffer.from(
    //                 tool_details.tool_auth.auth_username + ':' +
    //                 tool_details.tool_auth.auth_password
    //             ).toString('base64');
    //         }
    //         else {
    //             if (tool_details.tool_name == "GitLab") {
    //                 let token = tool_details.tool_auth.auth_token;
    //                 let pretoken = token.split(":");
    //                 scm_auth_token = pretoken[1];

    //             }
    //             else {
    //                 scm_auth_token = tool_details.tool_auth.auth_token;
    //             }
    //         }
    //     }
    //     let scm_proxy_flag = tool_details.proxy_required;
    //     let scm_tool_name = scm_obj.tool_name.toUpperCase();
    //     try {
    //         switch (scm_tool_name) {
    //             case 'BITBUCKET':
    //                 if (scm_obj.is_sync == true) {
    //                     let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
    //                     try {
    //                         await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)

    //                         let sync_status = await bitbucket_sync.bitbucketCommitAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
    //                         if (sync_status == "success") {
    //                             try {

    //                                 let data_update_status = await module.exports.save_pipeline_scm_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
    //                                 if (data_update_status == "success") {

    //                                     await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
    //                                     return ("Project synchronized in Bitbucket");
    //                                 }


    //                             }
    //                             catch (error) {
    //                                 logger.error('sync_scm data_update_status', error);
    //                                 throw new Error(error.message);
    //                             }
    //                         }
    //                         else {
    //                             update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
    //                             let err = new Error("Failed to synchronize in Bitbucket");
    //                             throw err;
    //                         }
    //                     }
    //                     catch (error) {
    //                         logger.error('sync_scm sync_status', error);
    //                         throw new Error(error.message);
    //                     }
    //                 }
    //             case 'GITLAB':
    //                 let project_detail = await existing_scm.findOne({ scm_project_name: scm_obj.project_name });


    //                 for (let repo of project_detail.repos) {
    //                     if (repo.scm_repo_name == scm_obj.repository_name) {
    //                         project_data.project_id = repo.scm_repo_id;
    //                         project_data.project_key = repo.scm_repo_id;
    //                         project_data.project_repo_url = project_detail.scm_project_self;
    //                     }
    //                     else {
    //                         project_data.project_repo_url = project_detail.scm_project_self;
    //                     }

    //                 }
    //                 scm_obj.project_data = project_data;

    //                 if (scm_obj.is_sync == true) {
    //                     let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
    //                     try {
    //                         // await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)

    //                         let sync_status = await gitlab_sync.gitlabCommitAggregation(scm_obj, tool_url, scm_auth_token);
    //                         if (sync_status == "success") {
    //                             try {

    //                                 let data_update_status = await module.exports.save_pipeline_gitlab_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
    //                                 if (data_update_status == "success") {

    //                                     await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
    //                                     return ("Project synchronized in Bitbucket");
    //                                 }


    //                             }
    //                             catch (error) {

    //                                 logger.error('sync_scm data_update_status', error);
    //                                 throw new Error(error.message);
    //                             }
    //                         }
    //                         else {
    //                             update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
    //                             let err = new Error("Failed to synchronize in Gitlab");
    //                             throw err;
    //                         }
    //                     }
    //                     catch (error) {

    //                         logger.error('sync_scm sync_status', error);
    //                         throw new Error(error.message);
    //                     }
    //                 }
    //             case 'AZURE REPOS':
    //                 let project_details = await existing_scm.findOne({ scm_project_name: scm_obj.project_name });

    //                 for (let repo of project_details.repos) {
    //                     if (repo.scm_repo_name == scm_obj.repository_name) {
    //                         project_data.project_id = repo.scm_repo_id;
    //                         project_data.project_key = repo.scm_repo_id;
    //                         project_data.project_repo_url = project_details.scm_project_self;
    //                     }
    //                     else {
    //                         project_data.project_repo_url = project_details.scm_project_self;
    //                     }

    //                 }
    //                 scm_obj.project_data = project_data;

    //                 if (scm_obj.is_sync == true) {
    //                     let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
    //                     try {
    //                         // await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)

    //                         let sync_status = await azurerepos_sync_projects.azurereposCommitAggregation(scm_obj, tool_url, scm_auth_token);
    //                         generate_jenkins_file.generate_jenkins(scm_obj.pipeline_key, scm_obj.application_key);
    //                         if (sync_status == "success") {
    //                             try {

    //                                 let data_update_status = await module.exports.save_pipeline_azurerepos_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
    //                                 if (data_update_status == "success") {

    //                                     await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
    //                                    // generate_jenkins_file(scm_obj.pipeline_key, scm_obj.application_key);
    //                                     return ("Project synchronized in AzureRepos");
    //                                 }


    //                             }
    //                             catch (error) {

    //                                 logger.error('sync_scm data_update_status', error);
    //                                 throw new Error(error.message);
    //                             }
    //                         }
    //                         else {
    //                             update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
    //                             let err = new Error("Failed to synchronize in Azure Devops");
    //                             throw err;
    //                         }
    //                     }
    //                     catch (error) {

    //                         logger.error('sync_scm sync_status', error);
    //                         throw new Error(error.message);
    //                     }
    //                 }
    //         }
    //     }
    //     catch (error) {
    //         logger.error('sync_scm  switch (scm_tool_name)', error);
    //         throw new Error(error.message);
    //     }
    // },


    /**
        * function create project in bitbucket on successful onboarding of source control stage
        * @param {object} scm_obj
        */
    sync_create_new_project_scm: async (scm_obj) => {
        update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "IN PROGRESS");

        try {
            var tool_details = await tool.findOne({ tool_instance_name: scm_obj.instance_name })
        }
        catch (error) {
            logger.error('sync_scm tool_details', error);
            throw new Error(error.message);
        }
        try {
            var project_data = {
                "project_repo_url": "",
                "project_id": "",
                "project_key": ""
            }
            let project_details = await existing_scm.findOne({ scm_project_name: scm_obj.project_name })
            project_data.project_id = project_details.scm_project_id;
            project_data.project_key = project_details.scm_project_key;

            for (let repo of project_details.repos) {
                if (repo.scm_repo_name == scm_obj.repository_name) {
                    project_data.project_repo_url = repo.scm_repo_self;
                }

            }


            scm_obj.project_data = project_data;
        }
        catch (error) {
            logger.error('sync_scm project_details', error);
            throw new Error(error.message);
        }
        let tool_url = tool_details.tool_url;
        let scm_auth_token
        let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            scm_obj.application_key
        );


        if (vault_config_status == true) {
            let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                scm_obj.application_key,
                tool_details.tool_category,
                scm_obj.tool_name,
                scm_obj.instance_name
            );
            if (vault_configuration.auth_type == "password") {

                scm_auth_token = new Buffer.from(
                    vault_configuration.auth_username + ':' +
                    vault_configuration.auth_password
                ).toString('base64');

            } else {
                scm_auth_token = vault_configuration.auth_token;
            }
        }
        else {
            if (tool_details.tool_auth.auth_type == 'password') {
                scm_auth_token = new Buffer.from(
                    tool_details.tool_auth.auth_username + ':' +
                    tool_details.tool_auth.auth_password
                ).toString('base64');
            }
            else {
                scm_auth_token = tool_details.tool_auth.auth_token;
            }
        }
        let scm_proxy_flag = tool_details.proxy_required;
        let scm_tool_name = scm_obj.tool_name.toUpperCase();
        try {
            switch (scm_tool_name) {
                case 'BITBUCKET':
                    if (scm_obj.is_sync == true) {
                        let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                        try {
                            await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)

                            let sync_status = await bitbucket_sync.bitbucketCommitAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            if (sync_status == "success") {
                                try {

                                    let data_update_status = await module.exports.save_pipeline_scm_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
                                    // if (data_update_status == "success") {

                                    //     setTimeout(async function () {

                                    //         await jenkins_xml_update_helper.updateJenkinsXml(scm_obj.pipeline_key);

                                    //     }, 10000);

                                    //     return ("Project synchronized in Bitbucket");
                                    // }
                                    if (data_update_status == "success") {
                                        let code_quality_auth_token
                                        try {
                                            await pipeline_dashboard_service.addKPIToDashboard(
                                                "scm_onbording",
                                                scm_obj.pipeline_key
                                            );

                                            setTimeout(async function () {
                                                await jenkins_xml_update_helper.updateJenkinsXml(scm_obj.pipeline_key)
                                            }, 14000);
                                            try {
                                                if (scm_obj.code_analysis_data != false) {

                                                    try {
                                                        var code_analysis_tool_details = await tool.findOne({ tool_instance_name: scm_obj.code_analysis_data.instance_name })
                                                    }

                                                    catch (error) {
                                                        throw new Error(error.message);
                                                    }
                                                    var ca_tool_url = code_analysis_tool_details.tool_url;
                                                    var ca_project_key = scm_obj.code_analysis_data.pipeline_key.toUpperCase();
                                                    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                                                        code_analysis_tool_details.application_key
                                                    );


                                                    if (vault_config_status == true) {
                                                        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                                                            code_analysis_tool_details.application_key,
                                                            code_analysis_tool_details.tool_category,
                                                            code_analysis_tool_details.tool_name,
                                                            code_analysis_tool_details.tool_instance_name
                                                        );
                                                        if (vault_configuration.auth_type == "password") {

                                                            code_quality_auth_token = new Buffer.from(
                                                                vault_configuration.auth_username + ':' +
                                                                vault_configuration.auth_password
                                                            ).toString('base64');

                                                        } else {
                                                            code_quality_auth_token = vault_configuration.auth_token;
                                                        }
                                                    }
                                                    else {
                                                        if (code_analysis_tool_details.tool_auth.auth_type == 'password') {
                                                            code_quality_auth_token = new Buffer.from(
                                                                code_analysis_tool_details.tool_auth.auth_username + ':' +
                                                                code_analysis_tool_details.tool_auth.auth_password
                                                            ).toString('base64');
                                                        }
                                                        else {
                                                            code_quality_auth_token = tool_details.tool_auth.auth_token;
                                                        }
                                                    }


                                                }

                                            }


                                            catch (error) {

                                                throw new Error(error.message);
                                            }

                                        }
                                        catch (error) {
                                            throw new Error(error.message);
                                        }

                                    }

                                }
                                catch (error) {
                                    logger.error('sync_scm data_update_status', error);
                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
                                let err = new Error("Failed to synchronize in Bitbucket");
                                throw err;
                            }
                        }
                        catch (error) {
                            logger.error('sync_scm sync_status', error);
                            throw new Error(error.message);
                        }
                    }
            }
        }
        catch (error) {
            logger.error('sync_scm  switch (scm_tool_name)', error);
            throw new Error(error.message);
        }
    },


    /**
        *function fetches build data on successful onboarding of continuous integration stage
        * @param {object} continuous_integration_obj
        */
    sync_ci: async (continuous_integration_obj) => {
        let tool_details
        update_creation_status.set_creation_status(continuous_integration_obj.pipeline_key, "continuous_integration", "IN PROGRESS");
        try {
            tool_details = await tool.findOne({ tool_instance_name: continuous_integration_obj.instance_name }).lean();
        }
        catch (error) {
            throw new Error(error.message);
        }

        continuous_integration_obj.project_url = (`${tool_details.tool_url}/job/${continuous_integration_obj.project_name}`)
        let tool_url = tool_details.tool_url;
        let continuous_integration_auth_token
        let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            continuous_integration_obj.application_key
        );


        if (vault_config_status == true) {
            let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                continuous_integration_obj.application_key,
                tool_details.tool_category,
                continuous_integration_obj.tool_name,
                continuous_integration_obj.instance_name
            );
            if (vault_configuration.auth_type == "password") {

                continuous_integration_auth_token = new Buffer.from(
                    vault_configuration.auth_username + ':' +
                    vault_configuration.auth_password
                ).toString('base64');

            } else {
                continuous_integration_auth_token = vault_configuration.auth_token;
            }
        }
        else {
            if (tool_details.tool_auth.auth_type == 'password') {
                continuous_integration_auth_token = new Buffer.from(
                    tool_details.tool_auth.auth_username + ':' +
                    tool_details.tool_auth.auth_password
                ).toString('base64');
            }
            else {
                continuous_integration_auth_token = tool_details.tool_auth.auth_token;
            }
        }
        let ci_proxy_flag = tool_details.proxy_required;
        let project_key = "";
        let continuous_integration_tool_name = continuous_integration_obj.tool_name.toUpperCase();//Jenkins
        try {
            switch (continuous_integration_tool_name) {
                case 'JENKINS':
                    if (continuous_integration_obj.is_sync == true) {
                        try {
                            let builds = await jenkins_sync.buildAggregation(continuous_integration_obj, tool_url, continuous_integration_auth_token, ci_proxy_flag)
                            let sync_status = await ci_sync_db_save.saveCiData(builds, continuous_integration_obj);


                            if (sync_status == "success") {
                                let jenkins_roles = ['ADMIN', 'DEVELOPER'];
                                try {
                                    let data_update_status = await module.exports.save_pipeline_continuous_integration_data(continuous_integration_obj, project_key, tool_details, jenkins_roles)
                                    if (data_update_status == "success") {
                                        await dashboard_service.calculateAvailableList(continuous_integration_obj.application_key, continuous_integration_obj.user_email);
                                        //const logger = log4js.getLogger();
                                        logger.info("Onboarding done Successfully.");
                                        return ("Project synchronized in Jenkins");
                                    }
                                }
                                catch (error) {
                                    //const logger = log4js.getLogger();
                                    logger.error("Onboarding Failed.");
                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(continuous_integration_obj.pipeline_key, "continuous_integration", "FAILED");

                            }
                        }
                        catch (error) {
                            throw new Error(error.message);
                        }
                    }
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
    },


    /**
        *function fetches build data on successful onboarding of code analysis stage
        * @param {object} ca_obj
        */
    sync_cq: async (ca_obj) => {
        try {
           
            var tooldetails = await tool.findOne({
                tool_instance_name: ca_obj.instance_name,
            });

            let c_adata = await existing_code_quality.findOneAndUpdate({ tool_id: tooldetails._id, code_analysis_project_key: ca_obj.project_key },
                {
                    "$set": {
                        "code_analysis_project_name": ca_obj.project_name,
                        "code_analysis_project_key": ca_obj.project_key,
                        "tool_id": tooldetails._id,
                        "code_analysis_tool": ca_obj.tool_name
                    }
                },
                { upsert: true, new: true }
            )

            update_creation_status.set_creation_status(
                ca_obj.pipeline_key,
                "code_quality",
                "IN PROGRESS"
            );

            try {
                let ca_data = await existing_code_quality.findOne({
                    code_analysis_project_name: ca_obj.project_name,
                }).lean();
                ca_obj.project_key = ca_data.code_analysis_project_key;

            }
            catch (error) {
                logger.error('Error', error);

                throw err;
            }
            try {

                var tool_details = await tool.findOne({
                    tool_instance_name: ca_obj.instance_name,
                });

            } catch (error) {
                update_creation_status.set_creation_status(
                    ca_obj.pipeline_key,
                    "code_quality",
                    "FAILED"
                );
                logger.error(

                    "Tool not found Error",
                    err.message
                );
                throw new Error(error.message);
            }


            let tool_url = tool_details.tool_url;

            let code_quality_auth_token
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                ca_obj.application_key
            );

            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    ca_obj.application_key,
                    tool_details.tool_category,
                    ca_obj.tool_name,
                    ca_obj.instance_name
                );

                if (vault_configuration.auth_type == "password") {

                    code_quality_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                } else {
                    code_quality_auth_token = vault_configuration.auth_token;
                }
            }


            else {
                if (tool_details.tool_auth.auth_type == "password") {
                    code_quality_auth_token = new Buffer.from(
                        tool_details.tool_auth.auth_username +
                        ":" +
                        tool_details.tool_auth.auth_password
                    ).toString("base64");
                } else {
                    code_quality_auth_token = tool_details.tool_auth.auth_token;
                }

            }
            let code_quality_proxy_flag = tool_details.proxy_required;
            let code_quality_tool_name = ca_obj.tool_name.toUpperCase();

            try {
                switch (code_quality_tool_name) {
                    case "SONARQUBE":
                        if (ca_obj.is_sync == true) {
                            if (tool_details.webhook_enable) {
                                await sonarqube_sync.create_sonarqube_project_webhook(ca_obj, tool_url, code_quality_auth_token, code_quality_proxy_flag);
                            }
                            let result = await sonarqube_sync.sonarAggregation(
                                tool_details,
                                ca_obj,

                                tool_url,
                                code_quality_auth_token,
                                code_quality_proxy_flag
                            );

                            let sonar_aggregation_status = code_analysis_db_save.sonar_analysis(
                                tool_details,
                                ca_obj,
                                result
                            );

                            //await dashboard_service.calculateAvailableList(ca_obj.application_key, ca_obj.user_email);
                            // await pipeline_dashboard_service.addKPIToDashboard("sonarqube_onbording", ca_obj.pipeline_key);
                            //const logger = log4js.getLogger();
                            logger.info("Onboarding done Successfully.");
                            return sonar_aggregation_status;


                        }
                }
            } catch (error) {
                update_creation_status.set_creation_status(
                    ca_obj.pipeline_key,
                    "code_quality",
                    "FAILED"
                );
                logger.error(

                    "Error in sonarqube_sync service  ",
                    error.message
                );
                //const logger = log4js.getLogger();
                logger.error("Onboarding Failed.");
                throw new Error(error.message);
            }
        }
        catch (error) {
            throw error
        }
    },


    /**
        *function fetches jira data on successful onboarding of Planing stage
        * @param {object} plan_obj
        */

}
