// const logger = require('logger/lib/logger/config');
var logger = require('../../../configurations/logging/logger');
var pipeline = require('../../../models/pipeline');
var tool = require('../../../models/tool');
var bitbucket_create = require('../../../connectors/bitbucket/bitbucket_create');
var jira_create = require('../../../connectors/jira/jira_create');
var sonarqube_create = require('../../../connectors/sonarqube/sonarqube_create');
var jenkins_ceate = require('../../../connectors/jenkins/jenkins_create');
var update_creation_status = require('../../../service_helpers/common/update_creation_status');
var save_pipeline_info = require('../../../service_helpers/common/save_pipeline_info');
//var generate_file = require('../../../service_helpers/common/generate_sonar_properties_file');
//var generate_jenkins_file = require('../../../service_helpers/common/generate_jenkins_file');
var generate_pipeline_key = require('../../../service_helpers/common/generate_pipeline_key');
var ServiceHelpers = require('../../../service_helpers/generate_key')
var pipeline_dashboard_service = require('../dashboard/pipeline_dashboard_service');

var jenkins_xml_update_helper = require('../../../service_helpers/common/jenkins_xml_update_helper')
var bitbucket_push = require('../../../service_helpers/bitbucket_push');
// var jenkins_xml_update_helper =require('../../../service_helpers/common/jenkins_xml_update_helper');
var dashboard_service = require('../../dashboard/dashboard_service');

var Application = require('../../../models/application')
var planning_data = require('../../../models/planning_data');
var hashicorp_vault_helper = require("../../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../../connectors/hashicorp-vault/read_secret");
//const { get_tool_categories } = require('../../settings/settings_service');
var existing_ci = require('../../../models/existing_continuous_integration_jobs');
var log_service = require('../../../configurations/logging/logger');
var logger = require('../../../configurations/logging/logger');




module.exports = {
    save_pipeline_data: async (pipeline_data) => {
        try {
            var pipeline_key;
            try {
                pipeline_key = await generate_pipeline_key.generatePipelineKey();

            }
            catch (error) {
                throw new Error(error.message);
            }
            pipeline_key = await save_pipeline_info.save_pipeline_details(pipeline_data, pipeline_key);
            // if(save_info_status == "success")
            if (pipeline_key != null || pipeline_key != undefined || pipeline_key != "") {
                
                logger.info("Pipeline Saved Successfully.");
                return (

                    {
                        "msg": "success",
                        "pipeline_key": pipeline_key
                    }

                );

            }
        }
        catch (error) {
            
            logger.error("Pipeline is not created.");
            logger.error('save_pipeline_data :', error.message);
            let err = new Error(`Failed to save PipelineInfo for ${pipeline_data.pipeline_name}`)
            throw err;
        }

    },
    get_onboarded_details: async (pipeline_key) => {
        try {
            let pipeline_info = await save_pipeline_info.getPipelineDetails(pipeline_key);
            // if(save_info_status == "success")
            try {
                if (pipeline_info.length != 0) {
                    return (pipeline_info);

                }
                else {
                    let err = new Error(` ${pipeline_key} does not exist`)
                    throw err;
                }
            } catch (error) {
                logger.error('get_onboarded_details :', error.message);
                throw error;
            }
        }
        catch (error) {
            logger.error('get_onboarded_details :', error.message);
            error = new Error(`Failed to fetch PipelineInfo for ${pipeline_key}`)
            throw error;
        }
    },
    save_pipeline_scm_data: async (scm_obj, project_key, tool_details, bitbucket_repo_url, bb_tool_roles) => {

        try {
            await pipeline.findOneAndUpdate({
                "pipeline_key": scm_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "scm": {
                        "creation_status": "SUCCESS",
                        "project_url": (`${tool_details.tool_url}/projects/${project_key}`).toLowerCase(),
                        "repo_url": bitbucket_repo_url,
                        "repo_name": scm_obj.repository_name,
                        "branch_name": "master",
                        "configured": true,//create=true
                        "tool_project_key": scm_obj.pipeline_key,
                        "tool_project_name": scm_obj.project_name,
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
        catch (err) {
            err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }

    },
    save_plan_azure_application: async (plan_obj) => {
        try {


            let applicationData = await Application.findOne({ "application_key": plan_obj.application_key })
            let tool_detail = await tool.findOne({ "tool_instance_name": plan_obj.instance_name, "application_key": plan_obj.application_key })
            let planArray = [];
            let checkFlag = true

            let planObject = {
                "creation_status": "SUCCESS",

                "project_url": (`${tool_detail.tool_url}/${plan_obj.project_name}`),

                // "project_url":" https://dev.azure.com/democanvasdevops/CanvasdevOpsxAzuredevOps",
                //.toLowerCase(),
                "configured": true,//create=true
                "tool_project_key": plan_obj.project_key,
                "tool_project_name": plan_obj.project_name,
                "instance_details": {
                    "tool_name": tool_detail.tool_name,
                    "instance_name": tool_detail.tool_instance_name,
                    "instance_id": tool_detail._id,
                    "tool_roles": []
                }
            }
            // if(applicationData.plan == null || applicationData.plan == undefined){

            planArray.push(planObject)

            // }else{


            //     planArray = applicationData.plan
            //     for await ( let plan_data of planArray){
            //         if(plan_data.instance_detail.instance_name == tool_detail.tool_instance_name ){
            //                 checkFlag = false
            //                 break
            //         }
            //     }
            //     if(checkFlag){
            //         planArray.push(planObject)
            //     }


            // }

            // if(checkFlag){
            let result = await Application.findOneAndUpdate({
                "application_key": plan_obj.application_key
            },
                {
                    $set: {
                        plan: planArray
                    }
                }, {
                upsert: true
            })

            // }
            // let application_data = await Application.findOne({"application_key" : plan_obj.application_key})


            return ("success");
            // await Application.findOneAndUpdate({
            //     "application_key": plan_obj.application_key
            // }, {
            //     "$set": {
            //         "onboarded": true,
            //         "plan": {
            //             "creation_status": "SUCCESS",
            //             "project_url": (`${tool_details.tool_url}/projects/${project_key}`),
            //             //.toLowerCase(),
            //             "configured": true,//create=true
            //             "tool_project_key": project_key,
            //             "tool_project_name": plan_obj.project_name,
            //             "instance_details": {
            //                 "tool_name": tool_details.tool_name,
            //                 "instance_name": tool_details.tool_instance_name,
            //                 "instance_id": tool_details._id,
            //                 "tool_roles": plan_tool_roles
            //             }
            //         }
            //     }
            // }, { upsert: true })
            // return ("success");
        }
        catch (err) {

            err = new Error(`Error Updating project ${project_key}`)
            throw err;

        }
    },
    save_pipeline_plan_data_application: async (plan_obj, project_key, tool_details, plan_tool_roles) => {
        try {

            // console.log("plan in onboard : ",plan_obj);
            // console.log("tool data in onboard : ",tool_details);


            let applicationData = await Application.findOne({ "application_key": plan_obj.application_key })
            // console.log("Application : ",applicationData)

            let planArray
            let checkFlag = true
            let planObject = {
                "creation_status": "SUCCESS",
                "project_url": (`${tool_details.tool_url}/projects/${project_key}`),
                // https://dev.azure.com/democanvasdevops/CanvasdevOpsxAzuredevOps
                //.toLowerCase(),
                "configured": true,//create=true
                "tool_project_key": project_key,
                "tool_project_name": plan_obj.project_name,
                "instance_details": {
                    "tool_name": tool_details.tool_name,
                    "tool_version": tool_details.tool_version,
                    "instance_name": tool_details.tool_instance_name,
                    "instance_id": tool_details._id,
                    "tool_roles": plan_tool_roles
                }
            }
            if (applicationData.plan == null || applicationData.plan == undefined) {

                planArray.push(planObject)

            } else {


                planArray = applicationData.plan
                for await (let plan_data of planArray) {
                    if (plan_data.instance_details.instance_name == tool_details.tool_instance_name) {
                        checkFlag = false
                        break
                    }
                }
                if (checkFlag) {
                    planArray.push(planObject)
                }


            }

            if (checkFlag) {
                await Application.findOneAndUpdate({
                    "application_key": plan_obj.application_key
                },
                    {
                        $set: {
                            plan: planArray
                        }
                    }, {
                    upsert: true
                })
            }
            // let application_data = await Application.findOne({ "application_key": plan_obj.application_key })


            return ("Planning Tool Saved Successfully And Sync Started");
            // return ("Planning Tool Saved And Sync Started");

            // await Application.findOneAndUpdate({
            //     "application_key": plan_obj.application_key
            // }, {
            //     "$set": {
            //         "onboarded": true,
            //         "plan": {
            //             "creation_status": "SUCCESS",
            //             "project_url": (`${tool_details.tool_url}/projects/${project_key}`),
            //             //.toLowerCase(),
            //             "configured": true,//create=true
            //             "tool_project_key": project_key,
            //             "tool_project_name": plan_obj.project_name,
            //             "instance_details": {
            //                 "tool_name": tool_details.tool_name,
            //                 "instance_name": tool_details.tool_instance_name,
            //                 "instance_id": tool_details._id,
            //                 "tool_roles": plan_tool_roles
            //             }
            //         }
            //     }
            // }, { upsert: true })
            // return ("success");
        }
        catch (err) {
            err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }
    },

    save_pipeline_plan_data: async (plan_obj, project_key, tool_details, plan_tool_roles) => {
        try {
            await pipeline.findOneAndUpdate({
                "pipeline_key": plan_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "plan": {
                        "creation_status": "SUCCESS",
                        "project_url": (`${tool_details.tool_url}/projects/${project_key}`),
                        //.toLowerCase(),
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": plan_obj.project_name,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": plan_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (err) {
            err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }
    },
    save_pipeline_code_quality_data: async (code_quality_obj, project_key, tool_details, code_quality_tool_roles) => {
        try {
            await pipeline.findOneAndUpdate({
                "pipeline_key": code_quality_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "code_quality": {
                        "creation_status": "SUCCESS",
                        "project_url": (`${tool_details.tool_url}/dashboard?id=${project_key}`),
                        "configured": true,//create=true
                        "tool_project_key": project_key,
                        "tool_project_name": code_quality_obj.project_name,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": code_quality_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");
        }
        catch (err) {
            err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }
    },
    save_pipeline_continuous_integration_data: async (continuous_integration_obj, project_key, tool_details, ci_tool_roles) => {
        try {
            await pipeline.findOneAndUpdate({
                "pipeline_key": continuous_integration_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "continuous_integration": {
                        "creation_status": "SUCCESS",
                        "job_url": (`${tool_details.tool_url}/job/${project_key}`),
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
        catch (err) {
            err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }
    },
    onboard_scm_project: async (scm_obj) => {

        let continuous_integration_auth_token


        update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "IN PROGRESS");
        var onboard_status;
        let scm_auth_token
        let tool_details
        try {
            tool_details = await tool.findOne({ tool_instance_name: scm_obj.instance_name })
        }
        catch (error) {
            throw new Error(error.message);
        }
        var tool_url = tool_details.tool_url;
        var project_key = scm_obj.pipeline_key.toUpperCase();

        let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            tool_details.application_key
        );


        if (vault_config_status == true) {
            let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                tool_details.application_key,
                tool_details.tool_category,
                tool_details.tool_name,
                tool_details.tool_instance_name
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
        var scm_tool_name = scm_obj.tool_name.toUpperCase();
        var bitbucket_repo_url;

        try {
            switch (scm_tool_name) {
                case 'BITBUCKET':
                    onboard_status = await bitbucket_create.create_bitbucket_project(scm_obj, tool_url, scm_auth_token)
                    try {
                        if (onboard_status == "success") {
                            try {
                                let code_quality_auth_token
                                bitbucket_repo_url = await bitbucket_create.create_bitbucket_repo(scm_obj, tool_url, scm_auth_token);
                                await bitbucket_create.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token);

                                if (bitbucket_repo_url != null || bitbucket_repo_url != undefined || bitbucket_repo_url != "") {
                                    try {
                                        var bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                                        var data_update_status = await module.exports.save_pipeline_scm_data(scm_obj, project_key, tool_details, bitbucket_repo_url, bb_tool_roles);
                                        if (data_update_status == "success") {
                                            try {

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

                                                        // var sonar_file_created = await generate_file.generate_sonar_properties_file(ca_project_key, scm_obj.code_analysis_data.project_name, ca_tool_url, code_quality_auth_token)
                                                        // if (sonar_file_created != "success") {

                                                        //         error = new Error('Could not generate sonar properties file');

                                                        // }
                                                    }

                                                    try {
                                                        await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_obj.pipeline_key);

                                                        // var jenkins_generated = await generate_jenkins_file.generate_jenkins(scm_obj.pipeline_key, scm_obj);
                                                        // if (jenkins_generated == "success") {
                                                        //      var push_status = await bitbucket_push.pushFilesToBitbucket(scm_obj.pipeline_key,scm_obj,tool_details);

                                                        //     if (push_status == 1) {

                                                        //         return ("Project created in Bitbucket");
                                                        //     }
                                                        //     else {
                                                        //         return ("Project not created in Bitbucket");
                                                        //     }

                                                        // }
                                                    }
                                                    catch (error) {

                                                        throw new Error(error.message);
                                                    }
                                                }


                                                catch (error) {

                                                    throw new Error(error.message);
                                                }
                                                //code_analysis_data
                                                // var jenkins_generated = await generate_jenkins_file.generate_jenkins(scm_obj.pipeline_key);
                                                // if (jenkins_generated == "success") {
                                                //     return ("Project created in Bitbucket");
                                                // }
                                            }
                                            catch (error) {
                                                throw new Error(error.message);
                                            }

                                        }

                                    }
                                    catch (error) {
                                        throw new Error(error.message);
                                    }
                                }

                            }
                            catch (error) {
                                throw new Error(error.message);
                            }


                        }
                        else {
                            update_creation_status.set_creation_status(scm_obj.pipeline_key, "scm", "FAILED");
                            let err = new Error("Failed to create project in Bitbucket");
                            throw err;
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


    },
    onboard_plan_project: async (plan_obj) => {
        try {
            update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "IN PROGRESS");
            var onboard_status;
            let plan_auth_token
            try {
                var tool_details = await tool.findOne({ tool_instance_name: plan_obj.instance_name })
            }
            catch (error) {

                throw new Error(error.message);
            }
            var tool_url = tool_details.tool_url;

            var project_key = plan_obj.pipeline_key.toUpperCase();
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                tool_details.application_key
            );

            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    tool_details.application_key,
                    tool_details.tool_category,
                    tool_details.tool_name,
                    tool_details.tool_instance_name
                );
                if (vault_configuration.auth_type == "password") {

                    plan_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                } else {
                    plan_auth_token = vault_configuration.auth_token;
                }
            }
            else {
                if (tool_details.tool_auth.auth_type == 'password') {
                    plan_auth_token = new Buffer.from(
                        tool_details.tool_auth.auth_username + ':' +
                        tool_details.tool_auth.auth_password
                    ).toString('base64');
                }
                else {
                    plan_auth_token = tool_details.tool_auth.auth_token;
                }
            }

            var plan_tool_name = plan_obj.tool_name.toUpperCase();
            try {
                switch (plan_tool_name) {
                    case 'JIRA':
                        let onboard_status = await jira_create.create_jira_project(plan_obj, tool_url, plan_auth_token)
                        await jira_create.create_jira_project_webhook(plan_obj, tool_url, plan_auth_token);
                        let jira_roles
                        try {
                            if (onboard_status == "success") {
                                try {
                                    var jira_tool_roles = [];
                                    jira_tool_roles = await jira_create.fetch_jira_roles(plan_obj, tool_url, plan_auth_token)
                                    if (jira_tool_roles.length != 0) {
                                        jira_roles = Object.keys(jira_tool_roles.body);
                                        try {
                                            var data_update_status = await module.exports.save_pipeline_plan_data(plan_obj, project_key, tool_details, jira_roles);
                                            if (data_update_status == "success") {
                                                await pipeline_dashboard_service.addKPIToDashboard("jira_onbording", plan_obj.pipeline_key);

                                                //      await dashboard_service.calculateAvailableList(plan_obj.application_key, plan_obj.user_email);
                                                return ("Project created in Jira");
                                            }
                                        }
                                        catch (error) {


                                            throw new Error(error.message);
                                        }
                                    }
                                }
                                catch (error) {

                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "FAILED");
                                let err = new Error("Failed to create project in Jira");
                                throw err;
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
        }
        catch (error) {

            throw new Error(error.message);

        }


    },


    onboard_plan_project_application: async (plan_obj) => {
        try {
            //update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "IN PROGRESS");
            var onboard_status;
            let plan_auth_token
            try {
                var tool_details = await tool.findOne({ tool_instance_name: plan_obj.instance_name })
            }
            catch (error) {

                throw new Error(error.message);
            }
            var tool_url = tool_details.tool_url;

            var project_key = await ServiceHelpers.generateKey(plan_obj.project_name.slice(0, 7).toUpperCase())
            //var project_key = plan_obj.application_key.toUpperCase();
            project_key = project_key.slice(0, 7)


            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                tool_details.application_key
            );



            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    tool_details.application_key,
                    tool_details.tool_category,
                    tool_details.tool_name,
                    tool_details.tool_instance_name
                );
                if (vault_configuration.auth_type == "password") {

                    plan_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                } else {
                    plan_auth_token = vault_configuration.auth_token;
                }
            }
            else {
                if (tool_details.tool_auth.auth_type == 'password') {
                    plan_auth_token = new Buffer.from(
                        tool_details.tool_auth.auth_username + ':' +
                        tool_details.tool_auth.auth_password
                    ).toString('base64');
                }
                else {
                    plan_auth_token = tool_details.tool_auth.auth_token;
                }
            }

            var plan_tool_name = plan_obj.tool_name.toUpperCase();

            try {
                switch (plan_tool_name) {
                    case 'JIRA':
                        // let onboard_status="success"
                        onboard_status = await jira_create.create_jira_project(plan_obj, tool_url, plan_auth_token, project_key)


                        await jira_create.create_jira_project_webhook(plan_obj, tool_url, plan_auth_token, project_key);
                        let jira_roles

                        try {
                            if (onboard_status == "success") {
                                try {

                                    var jira_tool_roles = [];
                                    jira_tool_roles = await jira_create.fetch_jira_roles(plan_obj, tool_url, plan_auth_token, project_key)
                                    if (jira_tool_roles.length != 0) {
                                        jira_roles = Object.keys(jira_tool_roles.body);
                                        try {
                                            var data_update_status = await module.exports.save_pipeline_plan_data_application(plan_obj, project_key, tool_details, jira_roles);
                                            if (data_update_status == "success") {
                                                //  await pipeline_dashboard_service.addKPIToDashboard("jira_onbording", plan_obj.pipeline_key);

                                                //      await dashboard_service.calculateAvailableList(plan_obj.application_key, plan_obj.user_email);
                                                return ("Project created in Jira");
                                            }
                                        }
                                        catch (error) {


                                            throw new Error(error.message);
                                        }
                                    }
                                }
                                catch (error) {

                                    throw new Error(error.message);
                                }
                            }
                            else {
                                update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "FAILED");
                                let err = new Error("Failed to create project in Jira");
                                throw err;
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
        }
        catch (error) {

            throw new Error(error.message);

        }


    },
    onboard_code_quality_project: async (code_quality_obj) => {
        try {
            let code_quality_auth_token
            update_creation_status.set_creation_status(code_quality_obj.pipeline_key, "code_quality", "IN PROGRESS");
            var onboard_code_quality_status;
            try {
                var tool_details = await tool.findOne({ tool_instance_name: code_quality_obj.instance_name })
            }
            catch (error) {
                throw new Error(error.message);
            }
            var tool_url = tool_details.tool_url;
            var project_key = code_quality_obj.pipeline_key.toUpperCase();

            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                tool_details.application_key
            );

            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    tool_details.application_key,
                    tool_details.tool_category,
                    tool_details.tool_name,
                    tool_details.tool_instance_name
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
                if (tool_details.tool_auth.auth_type == 'password') {
                    code_quality_auth_token = new Buffer.from(
                        tool_details.tool_auth.auth_username + ':' +
                        tool_details.tool_auth.auth_password
                    ).toString('base64');
                }
                else {
                    code_quality_auth_token = tool_details.tool_auth.auth_token;
                }
            }

            var code_quality_tool_name = code_quality_obj.tool_name.toUpperCase();//Sonarqube
            try {
                switch (code_quality_tool_name) {
                    case 'SONARQUBE':

                        onboard_code_quality_status = await sonarqube_create.create_sonarqube_project(code_quality_obj, tool_url, code_quality_auth_token)
                        await sonarqube_create.create_sonarqube_project_webhook(code_quality_obj, tool_url, code_quality_auth_token);

                        if (onboard_code_quality_status == "success") {

                            var sonar_roles = ['admin', 'codeviewer', 'issueadmin', 'scan', 'user'];
                            try {
                                var data_update_status = await module.exports.save_pipeline_code_quality_data(code_quality_obj, project_key, tool_details, sonar_roles);
                                if (data_update_status == "success") {
                                    try {

                                        var sonar_file_created = "success" //await generate_file.generate_sonar_properties_file(project_key, code_quality_obj.project_name, tool_url, code_quality_auth_token)
                                        if (sonar_file_created == "success") {
                                            try {
                                                var jenkins_generated = "success"//await generate_jenkins_file.generate_jenkins(code_quality_obj.pipeline_key);
                                                if (jenkins_generated == "success") {
                                                    await pipeline_dashboard_service.addKPIToDashboard("sonarqube_onbording", code_quality_obj.pipeline_key);

                                                    //   await dashboard_service.calculateAvailableList(code_quality_obj.application_key, code_quality_obj.user_email);
                                                    return ("Project created in Sonarqube");
                                                }
                                            }
                                            catch (error) {

                                                throw new Error(error.message);
                                            }

                                        }
                                        else {

                                            error = new Error('Could not generate sonar properties file');
                                        }

                                    } catch (error) {

                                        throw new Error(error.message);
                                    }

                                }
                            }
                            catch (error) {

                                throw new Error(error.message);
                            }
                        }
                        else {
                            update_creation_status.set_creation_status(code_quality_obj.pipeline_key, "code_quality", "FAILED");
                            let err = new Error("Failed to create project in Sonarqube");
                            throw err;
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
    },
    onboard_continuous_integration_project: async (continuous_integration_obj) => {
        try {
            let continuous_integration_auth_token
            let tool_details
            update_creation_status.set_creation_status(continuous_integration_obj.pipeline_key, "continuous_integration", "IN PROGRESS");
            var onboard_continuous_integration_status;
            try {
                tool_details = await tool.findOne({ tool_instance_name: continuous_integration_obj.instance_name })
                let ci_datas = await existing_ci.findOneAndUpdate({ tool_id: tool_details._id, ci_project_name: continuous_integration_obj.project_name },
                    {
                        "$set": {
                            "ci_project_name": continuous_integration_obj.project_name,
                            "ci_project_url": `${tool_details.tool_url}/job/${continuous_integration_obj.project_name}`,
                            "tool_id": tool_details._id,
                            "ci_tool": tool_details.tool_name
                        }
                    },
                    { upsert: true, new: true }
                )
            }
            catch (error) {
                throw new Error(error.message);
            }
            var tool_url = tool_details.tool_url;
            var project_key = continuous_integration_obj.pipeline_key.toUpperCase();

            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                tool_details.application_key
            );


            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    tool_details.application_key,
                    tool_details.tool_category,
                    tool_details.tool_name,
                    tool_details.tool_instance_name
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
            var continuous_integration_tool_name = continuous_integration_obj.tool_name.toUpperCase();//Jenkins
            try {
                switch (continuous_integration_tool_name) {
                    case 'JENKINS':

                        onboard_continuous_integration_status = await jenkins_ceate.createJenkinsProject(continuous_integration_obj, tool_url, continuous_integration_auth_token);

                        if (onboard_continuous_integration_status == "success") {


                            var jenkins_roles = ['ADMIN', 'DEVELOPER'];
                            try {
                                var data_update_status = await module.exports.save_pipeline_continuous_integration_data(continuous_integration_obj, project_key, tool_details, jenkins_roles)


                                await pipeline_dashboard_service.addKPIToDashboard("jenkins_onbording", continuous_integration_obj.pipeline_key);


                                setTimeout(async function () {

                                    await jenkins_xml_update_helper.updateJenkinsXml(continuous_integration_obj.pipeline_key);
                                    if (data_update_status == "success") {
                                        //  await dashboard_service.calculateAvailableList(continuous_integration_obj.application_key, continuous_integration_obj.user_email);
                                        
                                        logger.info("Onboarding done Successfully.");
                                        return ("Project created in Jenkins");
                                    }
                                }, 10000);
                            }
                            catch (error) {
                                
                                logger.error("Onboarding Failed.");
                                throw new Error(error.message);
                            }

                        }
                        else {
                            update_creation_status.set_creation_status(continuous_integration_obj.pipeline_key, "continuous_integration", "FAILED");
                            let err = new Error("Failed to create project in Jenkins");
                            throw err;
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

    },
    // generate_sonar_file: async (body_data) => {

    //     await generate_file.generate_sonar_properties_file(body_data.project_key, body_data.project_name, body_data.sonar_url, body_data.sonar_auth_token);
    // },
    getPipelineType: async (pipeline_key) => {
        return await save_pipeline_info.getPipelineType(pipeline_key);
    },

    getPipelineListData: async (application_key) => {
        try {

            //var pipelineData = await Application.findOne({'application_key' : application_key }).populate('pipelines').lean()
            // if(pipelineData[0].pipelines!=null){
            var pipelineData = await Application.aggregate([
                {
                    $match: {
                        'application_key': application_key
                    }
                },
                {
                    $lookup: {
                        from: "pipelines",
                        localField: "pipelines",
                        foreignField: "_id",
                        as: "pipelines"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        pipelines: 1
                    }
                }
            ])
            //console.log('pip data',pipelineData[0]);
            if (pipelineData[0] != undefined) {
                // console.log('displaying');
                return pipelineData[0].pipelines
            }
            else {
                // console.log('not displaying');
                return null
            }
        } catch (error) {
            //console.log('pip data err',error);
            // console.log('pipipi', pipelineData);
            throw new Error(error.message);
        }


    },
    updateDate: async (issue_sprint, issue_key, actual_start_date, actual_end_date, timespent) => {
        try {
            var actual_start_date = new Date(actual_start_date);
            var actual_end_date = new Date(actual_end_date);
            var resp = await planning_data.findOneAndUpdate({ "sprint_id": sprint_id, "issue_key": issue_key },
                {
                    "$set": {
                        "actual_start_date": actual_start_date,
                        "actual_end_date": actual_end_date,
                        "timespent": timespent
                    }
                }, { upsert: true, new: true });
            return resp;
        }
        catch (error) {
            throw error.message;
        }
    }


}
