let application_schema = require('../../models/application');
let hashicorp_create = require('../../connectors/hashicorp-vault/create_secret')
var pipelines = require('../../models/pipeline');
var sprint_data = require("../../models/sprint");
var jira_sync = require('../../connectors/jira/jira_sync');
var jenkins_sync = require('../../connectors/jenkins/jenkins_sync');
var tool = require('../../models/tool');
var Application = require('../../models/application')

var update_creation_status = require('../../service_helpers/common/update_creation_status');
var dashboard_service = require('../dashboard/dashboard_service');
var planning_sync_db_save = require('../../service_helpers/common/planning_sync_db_save');
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var existing_planning = require('../../models/existing_planning_projects');

var sprint_data = require("../../models/sprint");
var planning_data = require("../../models/planning_data");

const onboarding_create_service = require("../pipeline/onboarding_create/onboarding_create_service");
const application_list = require('../../service_helpers/application_list');
const setting_service = require('../settings/settings_service');



module.exports.getApplicationConfigurations = async (application_key) => {
    try {
        let app_configs = await application_schema.findOne({ "application_key": application_key }, { "application_configurations": 1 }).lean();
        return app_configs;
    } catch (err) {
        throw new Error(err.message);
    }
},
    module.exports.getProjectAreas = async (tool_info) => {
        try {
            var azure_areas = await application_list.getAzureProjectAreas(
                tool_info
            );
            return azure_areas;

        } catch (error) {
            throw new Error(error.message);

        }
    },

    // function helps in onboarding jira application configuration 

    module.exports.update_jira_planning = async (plan_obj) => {



        let tool_details = await tool.findOne({ application_key: plan_obj.application_key, tool_instance_name: plan_obj.instance_name });



        try {

            let jira_roles = [];
            let project_key = plan_obj.project_key;

            // var saveResult = await onboarding_create_service.save_pipeline_plan_data_application(plan_obj, project_key, tool_details, jira_roles);
            // console.log("saveResult : ", saveResult);

            // let project_key = plan_obj.project_Key;
            // let pipeline_key = plan_obj.pipeline_key;
            // update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "IN PROGRESS");

            // try {
            //     let plan_data = await existing_planning.findOne({ planning_project_name: plan_obj.project_name }).lean();
            //     var plan_project_key=plan_data.planning_project_key;
            //     plan_obj.project_key = plan_data.planning_project_key;
            //     plan_obj.pipeline_key = pipeline_key;
            //     project_key = plan_data.planning_project_key;
            // }
            // catch (error) {
            //     throw new Error(error.message);
            // }

            // try {
            //     var tool_details = await tool.findOne({ tool_instance_name: plan_obj.instance_name })

            // }
            // catch (error) {
            //     throw new Error(error.message);
            // }

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




            let plan_proxy_flag = tool_details.proxy_required;


            let plan_tool_name = plan_obj.tool_name.toUpperCase();

            let is_sync = true;


            try {
                switch (plan_tool_name) {
                    case 'JIRA':
                       
                        if (is_sync == true) {
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


                            let boards = await jira_sync.getAllBoard(project_key, jira_url, HTTPRequestOptions);
                            // await jira_sync.create_jira_project_webhook(plan_obj, jira_url, jira_auth_token);


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


                                                let new_sprint = new sprint_data({
                                                    tool_project_key: project_key,
                                                    // pipeline_key: pipeline_key,
                                                    sprint_id: sprint.id,
                                                    sprint_logical_name: sprint.name,
                                                    start_date: sprint.startDate,
                                                    end_date: sprint.endDate,
                                                    sprint_active: current,
                                                    self: sprint.self,
                                                    application_key: plan_obj.application_key,
                                                    story_points: {
                                                        points_committed: storyPointsYetToCovered,
                                                        points_completed: storyPointsCovered
                                                    },
                                                    epics: epics,
                                                    stories: stories,
                                                    bugs: bugs,
                                                    tasks: tasks
                                                });

                                                // await new_sprint.save();
                                                await sprint_data.findOneAndUpdate(
                                                    { application_key: plan_obj.application_key, sprint_id: sprint.id },
                                                    {
                                                        $set: {
                                                            'tool_project_key': project_key,
                                                            'sprint_id': sprint.id,
                                                            'sprint_logical_name': sprint.name,
                                                            'start_date': sprint.startDate,
                                                            'end_date': sprint.endDate,
                                                            'sprint_active': current,
                                                            'self': sprint.self,
                                                            'application_key': plan_obj.application_key,
                                                            'story_points': {
                                                                'points_committed': storyPointsYetToCovered,
                                                                'points_completed': storyPointsCovered
                                                            },
                                                            'epics': epics,
                                                            'stories': stories,
                                                            'bugs': bugs,
                                                            'tasks': tasks
                                                        }
                                                    },
                                                    { upsert: true }
                                                );
                                              

                                                //await sprint_data.create(new_sprint);

                                                // await sprint_data.findOneAndUpdate(
                                                //     { self: new_sprint.self },
                                                //     new_sprint,
                                                //     { upsert: true }

                                            }
                                        }
                                    }
                                }
                            }

                            let Issues = await jira_sync.jiraAggregation(plan_obj, tool_details, jira_auth_token, plan_proxy_flag);

                            if (Issues.length === 0) {

                                let jira_roles = [];
                                // await onboarding_create_service.save_pipeline_plan_data_application(plan_obj, plan_obj.project_key, tool_details, jira_roles)

                                // await dashboard_service.calculateAvailableList(plan_obj.application_key, plan_obj.user_email);
                             
                                return "Jira Project Sync Sucessfull";
                            }
                            else {
                                try {


                                    for await (let issue of Issues) {
                                        let sprintId = "";
                                        let sprint_name = await planning_sync_db_save.getSpritName(issue.fields.customfield_10100);
                                        let sprintDetails = await sprint_data.findOne({ "sprint_logical_name": sprint_name, "application_key": plan_obj.application_key })
                                        if (sprintDetails != null) {
                                            sprintId = sprintDetails.sprint_id;
                                        }

                                        await planning_sync_db_save.update_jira_Issue(issue, plan_obj.application_key, project_key, sprint_name, "", sprintId)

                                    }
                                  
                                    return "Jira Project Sync Sucessfull";

                                } catch (error) {

                                    // update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "FAILED");
                                    throw new Error(error.message);
                                }
                            }

                        }
                }

                // return "Jira Project Sync Sucessful 3";

            }
            catch (error) {
                throw new Error(error.message);
            }

            // return "Jira Project Sync Sucessful 4";

        }
        catch (error) {
            throw new Error(error.message);
        };

        // return "Jira Project Sync Sucessful 5";


    },


    module.exports.saveVaultApplicationConfiguration = async (config_body) => {
        try {

            let create_engine = await hashicorp_create.create_secret_engine(config_body);
            let app_config = {
                configuration_name: "Vault",
                configuration_required: true,
                is_configured: true,
                configuration_fields: config_body.configuration_details
            }
            if (create_engine == "done") {
                let update_app = await application_schema.findOneAndUpdate({ "application_key": config_body.application_key }, { "application_configurations": app_config });
                return "done";
            }
            else {
                throw new Error(err.message);
            }
            return "done";
        } catch (err) {

            throw new Error(err.message);
        }
    }

module.exports.save_jira_planning = async (plan_obj) => {
   

    let tool_details = await tool.findOne({ tool_instance_name: plan_obj.instance_name, application_key: plan_obj.application_key }).lean();
    let existing_planning_object = {
        planning_tool: plan_obj.tool_name,
        planning_project_id: plan_obj.project_id,
        planning_project_key: plan_obj.project_key,
        planning_project_name: plan_obj.project_name,
        planning_self: plan_obj.project_url,
        tool_id: tool_details._id
    }
  
    var plannnnnnnn = await existing_planning.create(existing_planning_object);

    try {

        let jira_roles = [];
        let project_key = plan_obj.project_key;

        var saveResult = await onboarding_create_service.save_pipeline_plan_data_application(plan_obj, project_key, tool_details, jira_roles);

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

        let plan_proxy_flag = tool_details.proxy_required;


        let plan_tool_name = plan_obj.tool_name.toUpperCase();


        let is_sync = true;


        try {
            switch (plan_tool_name) {
                case 'JIRA':

                    if (is_sync == true) {
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


                        let boards = await jira_sync.getAllBoard(project_key, jira_url, HTTPRequestOptions);
                        if (plan_obj.create_webhook) {
                            await jira_sync.create_jira_project_webhook(plan_obj, jira_url, jira_auth_token);
                        }
                        if (boards.length === 0) {


                        } else {
                            for (let board of boards) {

                                if (board.name == (project_key + " board")) {

                                    ; let sprints = await jira_sync.getSprintsOfBoards(board, HTTPRequestOptions);

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
                                            let new_sprint = new sprint_data({
                                                tool_project_key: project_key,
                                                // pipeline_key: pipeline_key,
                                                sprint_id: sprint.id,
                                                sprint_logical_name: sprint.name,
                                                start_date: sprint.startDate,
                                                end_date: sprint.endDate,
                                                sprint_active: current,
                                                self: sprint.self,
                                                application_key: plan_obj.application_key,
                                                story_points: {
                                                    points_committed: storyPointsYetToCovered,
                                                    points_completed: storyPointsCovered
                                                },
                                                epics: epics,
                                                stories: stories,
                                                bugs: bugs,
                                                tasks: tasks
                                            });

                                            await new_sprint.save();
                                            //await sprint_data.create(new_sprint);
                                            // await sprint_data.findOneAndUpdate(
                                            //     { self: new_sprint.self },
                                            //     new_sprint,
                                            //     { upsert: true }

                                        }
                                    }
                                }
                            }
                        }

                        let Issues = await jira_sync.jiraAggregation(plan_obj, tool_details, jira_auth_token, plan_proxy_flag);

                        if (Issues.length === 0) {

                            let jira_roles = [];
                            await onboarding_create_service.save_pipeline_plan_data_application(plan_obj, plan_obj.project_key, tool_details, jira_roles)

                            // await dashboard_service.calculateAvailableList(plan_obj.application_key, plan_obj.user_email);
                            return "Jira Project Sync Sucessful ";
                        }
                        else {
                            try {


                                for await (let issue of Issues) {
                                    let sprintId = "";
                                    let sprint_name = await planning_sync_db_save.getSpritName(issue.fields.customfield_10100);
                                    let sprintDetails = await sprint_data.findOne({ "sprint_logical_name": sprint_name, "application_key": plan_obj.application_key })
                                    if (sprintDetails != null) {
                                        sprintId = sprintDetails.sprint_id;
                                    }

                                    await planning_sync_db_save.saveIssue(issue, plan_obj.application_key, project_key, sprint_name, "", sprintId)

                                }
                                return "Jira Project Sync Sucessful ";

                            } catch (error) {
                             
                                update_creation_status.set_creation_status(plan_obj.pipeline_key, "plan", "FAILED");
                                throw new Error(error.message);
                            }
                        }

                    }
            }

            // return "Jira Project Sync Sucessful 3";

        }
        catch (error) {
            throw new Error(error.message);
        }

        // return "Jira Project Sync Sucessful 4";

    }
    catch (error) {
        throw new Error(error.message);
    };

    // return "Jira Project Sync Sucessful 5";


}


