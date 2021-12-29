var logger = require("../../../configurations/logging/logger");
var existing_scm = require("../../../models/existing_scm_projects");
var existing_planning = require('../../../models/existing_planning_projects');
var existing_ci = require('../../../models/existing_continuous_integration_jobs');
var bitbucket_sync = require('../../../connectors/bitbucket/bitbucket_sync');
var azuredevops_sync = require('../../../connectors/azure_devops/azuredevops_sync');
var jenkins_sync = require('../../../connectors/jenkins/jenkins_sync');
var update_creation_status = require('../../../service_helpers/common/update_creation_status');
var existing_code_quality = require('../../../models/existing_code_analysis_projects')
var pipelines = require('../../../models/pipeline');
var tool = require('../../../models/tool');
var existing_continuous_integration_jobs = require('../../../models/existing_continuous_integration_jobs');
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
var bitbucket_push = require('../../../service_helpers/bitbucket_push');
const jenkins_update_xml = require("../../../connectors/jenkins/jenkins_update_xml");
const { Console } = require("console");
const onboarding_create_service = require("../onboarding_create/onboarding_create_service");
var azurerepos_sync_projects = require('../../../connectors/azurerepos/azurerepos_sync_projects.js');
var gitlab_sync = require('../../../connectors/GitLab/gitlab_sync_project');



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

            logger.error('Error', error);

            throw error;
        }
    },


    /**
        * function fetches all commits and pull request data on successful onboarding of source control stage
        * @param {object} scm_obj
        */
    existing_scm: async (scm_obj) => {
        update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "IN PROGRESS");

        try {
            var tool_details = await tool.findOne({ tool_instance_name: scm_obj.instance_name, application_key: scm_obj.application_key }).lean();

            let repos_object = {
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
                    project_data.project_id = repo.scm_repo_id;
                project_data.project_repo_url = repo.scm_repo_self;
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
        let bb_tool_roles;
        try {
            switch (scm_tool_name) {
                case 'BITBUCKET':
                    {
                        bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                        try {
                            if (tool_details.webhook_enable) {
                                await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            }
                            let sync_status = await bitbucket_sync.bitbucketCommitAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            if (sync_status == "success") {
                                try {

                                    let data_update_status = await module.exports.save_pipeline_scm_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
                                    if (data_update_status == "success") {

                                        await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
                                        return ("Project synchronized in Bitbucket");
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
                        break;
                    }
                case "GITLAB":
                    {
                        let project_detail = await existing_scm.findOne({ scm_project_name: scm_obj.project_name });


                        for (let repo of project_detail.repos) {
                            if (repo.scm_repo_name == scm_obj.repository_name) {
                                project_data.project_id = repo.scm_repo_id;
                                project_data.project_key = repo.scm_repo_id;
                                project_data.project_repo_url = project_detail.scm_project_self;
                            }
                            else {
                                project_data.project_repo_url = project_detail.scm_project_self;
                            }
                        }
                        scm_obj.project_data = project_data;
                        bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                        try {
                            // await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)
                            let sync_status = await gitlab_sync.gitlabCommitAggregation(scm_obj, tool_url, scm_auth_token);

                            if (sync_status == "success") {
                                try {
                                    let data_update_status = await module.exports.save_pipeline_gitlab_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)

                                    if (data_update_status == "success") {

                                        await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);

                                        return ("Project synchronized in gitlab");
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
                        break;
                    }
                case 'AZURE REPOS': {
                    let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                    try {
                        let sync_status = await azurerepos_sync_projects.azurereposCommitAggregation(scm_obj, tool_url, scm_auth_token)
                        if (sync_status == 'success') {
                            try {

                                let data_update_status = await module.exports.save_pipeline_scm_data(scm_obj, project_data.project_key, tool_details, project_data.project_repo_url, bb_tool_roles)
                                if (data_update_status == "success") {

                                    await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);
                                    return ("Project synchronized in AzureRepos");
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

                    break;

                }
            }
        }
        catch (error) {
            logger.error('sync_scm  switch (scm_tool_name)', error);
            throw new Error(error.message);
        }
    },


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

            for (repo of project_details) {
                if (repo.scm_repo_name == scm_obj.repository_name)
                    project_data.project_repo_url = repo.scm_repo_self;
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

                                    if (data_update_status == "success") {
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
                                err = new Error("Failed to synchronize in Bitbucket");
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
    existing_ci: async (continuous_integration_obj) => {
        try {
            let tool_details;

            update_creation_status.set_creation_status(continuous_integration_obj.pipeline_key, "continuous_integration", "IN PROGRESS");

            try {

                tool_details = await tool.findOne({ tool_instance_name: continuous_integration_obj.instance_name }).lean();
                let ci_datas = await existing_ci.findOneAndUpdate({ tool_id: tool_details._id, ci_project_name: continuous_integration_obj.project_name },
                    {
                        "$set": {
                            "ci_project_name": continuous_integration_obj.project_name,
                            "ci_project_url": (tool_details.tool_name == 'jenkins') ? `${tool_details.tool_url}/job/${continuous_integration_obj.project_name}` : continuous_integration_obj.projecturl,
                            "tool_id": tool_details._id,
                            "definition_id": continuous_integration_obj.projectid,
                            "ci_tool": tool_details.tool_name
                        }
                    },
                    { upsert: true, new: true }
                )

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

                        try {
                            let builds = await jenkins_sync.buildAggregation(continuous_integration_obj, tool_url, continuous_integration_auth_token, ci_proxy_flag)
                            let sync_status = await ci_sync_db_save.saveCiData(builds, continuous_integration_obj);


                            if (sync_status == "success") {
                                let jenkins_roles = ['ADMIN', 'DEVELOPER'];
                                try {
                                    let data_update_status = await module.exports.save_pipeline_continuous_integration_data(continuous_integration_obj, project_key, tool_details, jenkins_roles)
                                    await pipeline_dashboard_service.addKPIToDashboard("jenkins_onbording", continuous_integration_obj.pipeline_key);

                                    if (data_update_status == "success") {



                                        return ("Project synchronized in Jenkins");
                                    }
                                }
                                catch (error) {

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
                        break;

                    case 'AZURE DEVOPS':

                        try {
                            let pipeline_details = await existing_continuous_integration_jobs.findOne({ ci_project_name: continuous_integration_obj.project_name }).lean();

                            if (tool_details.webhook_enable) {

                                await azuredevops_sync.create_azure_devops_webhook(continuous_integration_obj, tool_url, continuous_integration_auth_token, ci_proxy_flag, tool_details.repository_data);
                            }

                            let builds = await jenkins_sync.azureBuildAggregation(continuous_integration_obj, pipeline_details, tool_url, continuous_integration_auth_token, ci_proxy_flag)
                            //let test_results = await jenkins_sync.azureTestResults(continuous_integration_obj, pipeline_details, tool_url, continuous_integration_auth_token, ci_proxy_flag)

                            let sync_status = await ci_sync_db_save.saveCiAzureData(builds, continuous_integration_obj);


                            if (sync_status == "success") {
                                let azure_roles = ['ADMIN', 'DEVELOPER'];
                                try {
                                    let data_update_status = await module.exports.save_pipeline_continuous_integration_data(continuous_integration_obj, project_key, tool_details, azure_roles)
                                    await pipeline_dashboard_service.addKPIToDashboard("azure_onbording", continuous_integration_obj.pipeline_key);

                                    if (data_update_status == "success") {



                                        return ("Project synchronized in Azure Devops");
                                    }
                                }
                                catch (error) {

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

                        break;
                }
            }
            catch (error) {

                throw new Error(error.message);
            }
        } catch (e) {
            console.log(e);
        }
    },



    /**
        *function fetches build data on successful onboarding of code analysis stage
        * @param {object} ca_obj
        */
    existing_code_analysis: async (ca_obj) => {
        try {
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
                throw new Error(error.message);
            }
            try {

                var tool_details = await tool.findOne({
                    tool_instance_name: ca_obj.instance_name,
                });

                let c_adata = await existing_code_quality.findOneAndUpdate({ tool_id: tool_details._id, code_analysis_project_key: ca_obj.project_key },
                    {
                        "$set": {
                            "code_analysis_project_name": ca_obj.project_name,
                            "code_analysis_project_key": ca_obj.project_key,
                            "tool_id": tool_details._id,
                            "code_analysis_tool": ca_obj.tool_name
                        }
                    },
                    { upsert: true, new: true }
                )

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

                            await pipeline_dashboard_service.addKPIToDashboard("sonarqube_onbording", ca_obj.pipeline_key);
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
    sync_planning: async (plan_obj) => {

        let project_key = plan_obj.projectKey;
        let pipeline_key = plan_obj.pipeline_key;
        update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "IN PROGRESS");

        try {
            let plan_data = await existing_planning.findOne({ planning_project_name: plan_obj.project_name }).lean();
            plan_obj.project_key = plan_data.planning_project_key;
            plan_obj.pipeline_key = pipeline_key;
            project_key = plan_data.planning_project_key;
        }
        catch (error) {
            throw new Error(error.message);
        }

        try {
            let tool_details = await tool.findOne({ tool_instance_name: plan_obj.instance_name })
        }
        catch (error) {
            throw new Error(error.message);
        }
        let jira_auth_token;
        let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            plan_obj.application_key
        );

        if (vault_config_status == true) {
            let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                plan_obj.application_key,
                tool_details.tool_category,
                plan_obj.tool_name,
                plan_obj.instance_name
            );
            if (vault_configuration.auth_type == "password") {

                jira_auth_token = new Buffer.from(
                    vault_configuration.auth_username + ':' +
                    vault_configuration.auth_password
                ).toString('base64');

            } else {
                jira_auth_token = vault_configuration.auth_token;
            }
        }
        else {
            if (tool_details.tool_auth.auth_type == 'password') {

                jira_auth_token = new Buffer.from(
                    tool_details.tool_auth.auth_username + ':' +
                    tool_details.tool_auth.auth_password
                ).toString('base64');

            } else {
                jira_auth_token = ToolData.tool_auth.auth_token;
            }
        }
        let plan_proxy_flag = tool_details.proxy_required

        let plan_tool_name = plan_obj.tool_name.toUpperCase();

        try {
            switch (plan_tool_name) {
                case 'JIRA':
                    if (plan_obj.is_sync == true) {
                        let jira_url = tool_details.tool_url;

                        let HTTPRequestOptions = {
                            proxyFlag: false,
                            urlSuffix: "",
                            requestMethod: "",
                            basicAuthToken: ''
                        }
                        HTTPRequestOptions.basicAuthToken = jira_auth_token;
                        HTTPRequestOptions.proxyFlag = plan_proxy_flag;
                        HTTPRequestOptions.requestMethod = "GET";


                        let boards = await jira_sync.getAllBoard(plan_obj.project_key, jira_url, HTTPRequestOptions);
                        //   await jira_sync.create_jira_project_webhook(plan_obj, jira_url, jira_auth_token);

                        if (boards.length === 0) {

                        } else {
                            for (let board of boards) {
                                if (board.name == (project_key + " board")) {
                                    let sprints = await jira_sync.getSprintsOfBoards(board, HTTPRequestOptions);


                                    if (sprints.length === 0) {

                                    } else {


                                        for (let sprint of sprints) {

                                            let epics = [], stories = [], bugs = [], tasks = [];
                                            let storyPointsCovered = 0;
                                            let storyPointsYetToCovered = 0;

                                            let sprintIssues = await jira_sync.getIssueOnSprint(project_key, HTTPRequestOptions, jira_url, sprint.id)

                                            if (sprintIssues.length === 0) {

                                            } else {


                                                for await (let sprintIssue of sprintIssues) {

                                                    if (sprintIssue.fields.issuetype.name === "Story")
                                                        stories.push(sprintIssue.key);
                                                    else if (sprintIssue.fields.issuetype.name === "Bug")
                                                        bugs.push(sprintIssue.key);
                                                    if (sprintIssue.fields.issuetype.name === "Epic")
                                                        epics.push(sprintIssue.key);
                                                    else if (sprintIssue.fields.issuetype.name === "Task")
                                                        tasks.push(sprintIssue.key);

                                                    if (sprintIssue.fields.status.name === "Done" && !(isNaN(sprintIssue.fields.customfield_10106)))
                                                        storyPointsCovered += sprintIssue.fields.customfield_10106;
                                                    if (sprintIssue.fields.status.name !== "Done" && !(isNaN(sprintIssue.fields.customfield_10106)))
                                                        storyPointsYetToCovered += sprintIssue.fields.customfield_10106;

                                                }
                                            }

                                            let current = false;
                                            if (sprint.state === "active") {
                                                current = true;
                                            }
                                            let new_sprint = ({
                                                tool_project_key: project_key,
                                                pipeline_key: pipeline_key,
                                                sprint_id: sprint.id,
                                                sprint_logical_name: sprint.name,
                                                start_date: sprint.startDate,
                                                end_date: sprint.endDate,
                                                sprint_active: current,
                                                self: sprint.self,
                                                story_points: {
                                                    points_committed: storyPointsYetToCovered,
                                                    points_completed: storyPointsCovered
                                                },
                                                epics: epics,
                                                stories: stories,
                                                bugs: bugs,
                                                tasks: tasks
                                            });
                                            await sprint_data.findOneAndUpdate(
                                                { self: new_sprint.self },
                                                new_sprint,
                                                { upsert: true }
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        let Issues = await jira_sync.jiraAggregation(plan_obj, tool_details, jira_auth_token, plan_proxy_flag);

                        if (Issues.length === 0) {

                            await planning_sync_db_save.save_pipeline_plan_data(plan_obj, plan_obj.project_key, tool_details, jira_roles)
                            await dashboard_service.calculateAvailableList(plan_obj.application_key, plan_obj.user_email);
                            return "Jira Project Sync Sucessful";
                        }
                        else {
                            try {

                                for await (let issue of Issues) {
                                    let sprint_name = await planning_sync_db_save.getSpritName(issue.fields.customfield_10100);
                                    await planning_sync_db_save.saveIssue(issue, plan_obj.pipeline_key, plan_obj.project_key, sprint_name, "")

                                }

                            } catch (error) {
                                update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "FAILED");
                                throw (error)
                            }
                        }

                        try {
                            let jira_roles = [];
                            await planning_sync_db_save.save_pipeline_plan_data(plan_obj, plan_obj.project_key, tool_details, jira_roles)
                            await dashboard_service.calculateAvailableList(plan_obj.application_key, plan_obj.user_email);
                            return "Jira Project Sync Sucessful";

                        } catch (error) {
                            update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "FAILED");
                            throw (error)
                        }
                    }
            }
        }
        catch (error) {
            throw new Error(error.message);
        }

    },
    get_allGroups_having_access: async (plan_obj) => {
        try {

        }
        catch (error) {
            console, log(error);
            throw error
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

    }
}


