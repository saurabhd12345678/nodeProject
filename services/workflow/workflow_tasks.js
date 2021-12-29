var logger = require('../..//configurations/logging/logger');
const nodemailer = require("nodemailer");
var path = require('path');

var fs = require('fs');
var XState = require('xstate');
var pipeline_workflow = require('../../models/pipeline_workflow');
var save_pipeline_info = require('../../service_helpers/common/save_pipeline_info');
var jira_create = require('../../connectors/jira/jira_create');
var create_bitbucket_project = require('../../connectors/bitbucket/bitbucket_create');
var create_sonarqube_project = require('../../connectors/sonarqube/sonarqube_create');
var create_jenkins_project = require('../../connectors/jenkins/jenkins_create');
var tools = require('../../models/tool');
var dast_qualys_data = require('../../models/dast_qualys_data');
var jenkins_build_trigger = require('../../connectors/jenkins/jenkins_build_trigger');
var existing_scm_projects = require('../../models/existing_scm_projects');
var existing_planning_projects = require('../../models/existing_planning_projects');
var service_now = require('../servicenow/servicenow_service');
var aws_ecs_task_definition_type_ec2 = require('../../connectors/aws/aws_ecs_task_definition_typeEC2');
var aws_ecs_cluster = require('../../connectors/aws/aws_ecs_cluster');
var aws_ecs_task_definition_type_fargate = require('../../connectors/aws/aws_ecs_task_definition_typeFargate');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var dotenv = require('dotenv');
var bitbucket_sync = require("../../connectors/bitbucket/bitbucket_sync")
dotenv.config();
var servicenow_connector = require('../../connectors/servicenow/servicenow_crud');

module.exports = {

    /**
     * This function saves current workflow progress and proceeds to next state
     * @param {String} pipeline_key
     * @param {String} machine_id
     * @param {String} task_field
     * */
    async saveStateAndProceed(pipeline_key, machine_id, task_field, status, task_api_response) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");

            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            let pipeline_data = await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: status,
                        "pipeline_workflow_ui_data.nodes.$.status": status
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();



            let saved_state = JSON.parse(pipeline_data.workflow_progress_data);
            saved_state.context = pipeline_data.pipeline_workflow_xstate_data.context;
            if (pipeline_data.pipeline_workflow_xstate_data.context.final_nodes.includes(task_field)) {
                let end_time = new Date();
                saved_state.context.end_time = end_time;

                await pipeline_workflow.findOneAndUpdate(
                    {
                        pipeline_key: pipeline_key,
                        machine_id: machine_id
                    },
                    {
                        $set: {
                            workflow_progress_data: JSON.stringify(saved_state),
                            end_time: end_time
                        }
                    },
                    {
                        upsert: false,
                        new: true
                    }).lean();
            }
            else {
                await pipeline_workflow.findOneAndUpdate(
                    {
                        pipeline_key: pipeline_key,
                        machine_id: machine_id
                    },
                    {
                        $set: {
                            workflow_progress_data: JSON.stringify(saved_state)
                        }
                    },
                    {
                        upsert: false,
                        new: true
                    }).lean();

                let actions = pipeline_data.actions;
                //let guards = ["pipelineCreated", "sonarCreationApproved", "onboardedOnAllTools"];
                let action_and_guards = {
                    /** Add functionality for the actions */
                    actions: {}
                };


                let i = 0;
                while (i < actions.length) {
                    action_and_guards.actions[actions[i]] = all_actions_guards.actions_list[actions[i]];
                    i++;
                }
                // i = 0;
                // while (i < guards.length) {
                //     action_and_guards.guards[guards[i]] = all_actions_guards.guards_list[guards[i]];
                //     i++;
                // }

                //************get next states and disable non reachable nodes/states**************
                let next_state_calls = [];
                next_state_calls = await get_next_state_calls(saved_state.context[task_field], task_api_response);
                let non_reachable_nodes = saved_state.context[task_field].target_nodes.filter(x => next_state_calls.indexOf(x) === -1);
                let context_and_nodes = {
                    context: saved_state.context,
                    nodes: []
                };
                for await (let non_reachable_node of non_reachable_nodes) {
                    context_and_nodes = await disable_non_reachable_nodes(context_and_nodes.context, non_reachable_node, context_and_nodes.nodes);
                }
                saved_state.context = context_and_nodes.context;
                let non_reachable_ids = context_and_nodes.nodes.map(node => {
                    let temp_arr = node.split("_");
                    return temp_arr[temp_arr.length - 1];
                });

                function remove_duplicates(arr) {
                    let s = new Set(arr);
                    let it = s.values();
                    return Array.from(it);
                }
                non_reachable_ids = remove_duplicates(non_reachable_ids);
                if (non_reachable_ids.length > 0) {
                    let nodes = pipeline_data.pipeline_workflow_ui_data.nodes.map(node => {
                        if (non_reachable_ids.includes(node.id.toString()))
                            node.status = "DISABLED";
                        return node;
                    });
                    await pipeline_workflow.findOneAndUpdate(
                        {
                            pipeline_key: pipeline_key,
                            machine_id: machine_id
                        },
                        {
                            $set: {
                                "pipeline_workflow_xstate_data.context": saved_state.context,
                                "pipeline_workflow_ui_data.nodes": nodes
                            }
                        },
                        {
                            upsert: false,
                            new: true
                        }).lean();
                }

                //**************************

                const machine = XState.Machine(pipeline_data.pipeline_workflow_xstate_data, action_and_guards);

                // Use State.create() to restore state from a plain object
                const previousState = XState.State.create(saved_state);

                // Use machine.resolveState() to resolve the state definition to a new State instance relative to the machine
                const resolvedState = machine.resolveState(previousState);
                // This will start the service at the specified State
                const service = XState.interpret(machine).onTransition(async (state) => {
                    if (next_state_calls.includes(state.value)) {
                        await pipeline_workflow.findOneAndUpdate(
                            {
                                pipeline_key: pipeline_key,
                                machine_id: machine_id
                            },
                            {
                                $set: {
                                    workflow_progress_data: JSON.stringify(state)
                                }
                            },
                            {
                                upsert: false,
                                new: true
                            }).lean();
                    }
                });
                service.start(resolvedState);
                // next_state_calls.forEach(next_step => {
                //     service.send(next_step);
                // });
                for (let next_step of next_state_calls) {
                    service.send(next_step);
                }
                service.stop();
            }
        } catch (error) {
            logger.error(error);
        }
    },

    /**
     * This function checkout bitbucket
     * @param {String} pipeline_key
     * @param {String} machine_id
     * @param {String} state
     * @param {String} task_field
     * @param {String} api_data
     */
    async bitbucket_checkout(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            try {
                //***bitbucket_checkout_task******
                //let repo_url = await getRepoUrl(api_data['Tool Instance Name'], api_data['Project Name'], api_data['Repository Name']);
                //Vivek method call jo rahul M bolega


                let job_parameters;
                let project_details = await getProjectDetails(api_data['Tool Instance Name'], api_data['Project Name']);
                //  api_data['agent_name']='windows-agent';
                if (api_data['agent_name'] == "new-jenkins" || api_data['agent_name'] == "canvasSlave") {


                    job_parameters = {
                        agent_name: api_data['agent_name'],
                        repo_url: project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + api_data['Repository Name'] + ".git",
                        branch_name: api_data['Branch Name'],  // later get branch name from ui
                        creds: "scm-creds",// "scm-creds", //always hard coded
                        folder_name: api_data['Checkout Directory Path'],
                        execution_number: execution_number,
                        pipeline_name_key: api_data['Project Name'].replace(/ /g, "_").concat("_").concat(pipeline_key),    //pipeline_name(remove space add_) + "_" + pipeline_key
                        pipeline_key: pipeline_key,
                        machine_id: machine_id,
                        task_field: task_field,
                        jenkins_post_url: process.env.JENKINS_POST_URL
                    };
                  
                    await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.BITBUCKET_CHECKOUT_WF_JOB, job_parameters);

                } else {
                    let repo_url = project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + api_data['Repository Name'] + ".git";



                    repo_url = repo_url.slice(repo_url.indexOf("://") + 3, repo_url.length);

                    // let start_index= api_data['Repository Url'].lastIndexOf("/");
                    // let repo_name=str.slice(start_index+1,start_index.length)
                    let tool_detail = await getToolDetails(api_data['Tool Instance Name']);

                    job_parameters = {
                        agent_name: api_data['agent_name'],
                        repo_url: repo_url,//project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + api_data['Repository Name'] + ".git",
                        branch_name: "master",  // later get branch name from ui
                        creds: "scm-creds",// "scm-creds", //always hard coded
                        folder_name: api_data['Checkout Directory Path'],
                        execution_number: execution_number,
                        pipeline_name_key: api_data['Project Name'].replace(/ /g, "_").concat("_").concat(pipeline_key),    //pipeline_name(remove space add_) + "_" + pipeline_key
                        pipeline_key: pipeline_key,
                        machine_id: machine_id,
                        repo_name: api_data["Repository Name"],

                        user_name: tool_detail.tool_auth.auth_username,
                        password: tool_detail.tool_auth.auth_password,
                        task_field: task_field,
                        jenkins_post_url: process.env.JENKINS_POST_URL
                    };

                 
                    await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.BITBUCKET_CHECKOUT_IIS_WF_JOB, job_parameters);

                }
                //    await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.BITBUCKET_CHECKOUT_WF_JOB, job_parameters);
                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    async gitlab_checkout(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            try {
                //***bitbucket_checkout_task******
                //let repo_url = await getRepoUrl(api_data['Tool Instance Name'], api_data['Project Name'], api_data['Repository Name']);
                //Vivek method call jo rahul M bolega


                let job_parameters;
                let project_details = await getProjectDetailsForGitLab(api_data['Tool Instance Name'], api_data['Project Name']);
                //  api_data['agent_name']='windows-agent';
                let path = project_details.scm_project_self;
                let path_split = path.split("/");
                let group_path = path_split[4];
                let retrived_tool = await tool.findOne({ tool_instance_name: api_data['Tool Instance Name'] });
                let pre_token_name = retrived_tool.tool_auth.auth_token;
                let p_tokenname = pre_token_name.split(":");
                let token_name = p_tokenname[0];
                let token_gitlab = p_tokenname[1];
                let url = "http://jenkins-" + pre_token_name + "@gitlab.com" + "/" + group_path.toLowerCase() + "/" + api_data['Repository Name'];
                if (api_data['agent_name'] == "new-jenkins" || api_data['agent_name'] == "canvasSlave") {


                    job_parameters = {
                        agent_name: api_data['agent_name'],
                        repo_url: url,
                        branch_name: api_data['Branch Name'],  // later get branch name from ui
                        creds: "gitlab_test_token_SS",// "scm-creds", //always hard coded
                        folder_name: api_data['Checkout Directory Path'],
                        execution_number: execution_number,
                        pipeline_name_key: api_data['Project Name'].replace(/ /g, "_").concat("_").concat(pipeline_key),    //pipeline_name(remove space add_) + "_" + pipeline_key
                        pipeline_key: pipeline_key,
                        machine_id: machine_id,
                        task_field: task_field,
                        jenkins_post_url: process.env.JENKINS_POST_URL
                    };

                    await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.GITLAB_CHECKOUT_WF_JOB, job_parameters);

                } else {
                    let repo_url = project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + api_data['Repository Name'] + ".git";



                    repo_url = repo_url.slice(repo_url.indexOf("://") + 3, repo_url.length);

                    // let start_index= api_data['Repository Url'].lastIndexOf("/");
                    // let repo_name=str.slice(start_index+1,start_index.length)
                    let tool_detail = await getToolDetails(api_data['Tool Instance Name']);

                    job_parameters = {
                        agent_name: api_data['agent_name'],
                        repo_url: repo_url,//project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + api_data['Repository Name'] + ".git",
                        branch_name: "master",  // later get branch name from ui
                        creds: "gitlab_test_token_SS",// "scm-creds", //always hard coded
                        folder_name: api_data['Checkout Directory Path'],
                        execution_number: execution_number,
                        pipeline_name_key: api_data['Project Name'].replace(/ /g, "_").concat("_").concat(pipeline_key),    //pipeline_name(remove space add_) + "_" + pipeline_key
                        pipeline_key: pipeline_key,
                        machine_id: machine_id,
                        repo_name: api_data["Repository Name"],

                        user_name: tool_detail.tool_auth.auth_username,
                        password: tool_detail.tool_auth.auth_password,
                        task_field: task_field,
                        jenkins_post_url: process.env.JENKINS_POST_URL
                    };


                    await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.BITBUCKET_CHECKOUT_IIS_WF_JOB, job_parameters);

                }
                //    await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.BITBUCKET_CHECKOUT_WF_JOB, job_parameters);
                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    /**
     * This function compiles code
     * @param {String} pipeline_key
     * @param {String} machine_id
     * @param {String} state
     * @param {String} task_field
     * @param {String} api_data
     */
    async compile_code(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {

            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            let compile_command;
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();


            try {
                //***compile_code_task******
                let job_parameters;
                switch (api_data['Language']) {
                    case 'node js':
                        compile_command = "npm install";


                        job_parameters = {
                            agent_name: api_data['agent_name'],
                            // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)


                            agent_home: await getAgentHome(api_data['agent_name']),


                            code_path: "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                            compile_command: compile_command,
                            pipeline_key: pipeline_key,
                            machine_id: machine_id,
                            task_field: task_field,
                            jenkins_post_url: process.env.JENKINS_POST_URL
                        };

                        await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.CODE_COMPILE_WF_JOB, job_parameters);

                        break;
                    case ".Net":
                        // let home = path.join('C:', 'Jenkins','workspace');

                        job_parameters = {
                            agent_name: api_data['agent_name'],// 'windows-agent',//api_data['agent_name'],
                            // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                            // agent_home:home,// "C:\Jenkins\workspace",
                            agent_home: "C:\\Jenkins\\workspace",
                            code_path: "workspace\\".concat(checkout_path),
                            // compile_command: compile_command,
                            pipeline_key: pipeline_key,
                            machine_id: machine_id,
                            task_field: task_field,
                            jenkins_post_url: process.env.JENKINS_POST_URL
                        };

                        await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.CODE_COMPILE_DOTNET_WF_JOB, job_parameters);


                        break;
                }

            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },/**
    * This function pushes artifact to JFrog
    * @param {String} pipeline_key
    * @param {String} machine_id
    * @param {String} state
    * @param {String} task_field
    * @param {String} api_data
    */
    async push_image_to_jfrog(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            let compile_command;
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();


            let instance_url;

            try {
                let jfrog_url = await tool.findOne({ application_key: api_data.application_key, tool_instance_name: api_data['Tool Instance Name'] }, { _id: 0, tool_url: 1 });

                if (jfrog_url.tool_url.includes("https://")) {
                    instance_url = jfrog_url.tool_url.slice(8, jfrog_url.tool_url.length);
                }
                else {
                    instance_url = jfrog_url.tool_url.slice(7, jfrog_url.tool_url.length);
                }
            } catch (error) {
                logger.error(error);
                throw error;
            }



            try {
                //***push_image_to_jfrog******

                let job_parameters = {
                    agent_name: api_data['agent_name'],
                    jfrog_instance: instance_url,
                    jfrog_repo: api_data['JFrog Repository'],
                    image_name: api_data['Image Name'].concat(":").concat(api_data['Image Tag']),
                    docker_repo: api_data['Docker Repository'],
                    docker_tag: api_data['Docker Tag'],
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };

                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.PUSH_TO_JFROG_WF_JOB, job_parameters);
                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            //    this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    /**
     * This function creates jira issue
     * @param {String} pipeline_key
     * @param {String} machine_id
     * @param {String} state
     * @param {String} task_field
     * @param {String} api_data
     */
    async create_jira_issue(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {

        try {

            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            try {
                //***create issue in jira******
                let tool_details, tool_project_key;
                var issue_response;
                try {
                    tool_details = await tools.findOne({ tool_instance_name: api_data['Tool Instance Name'] }).lean();
                }
                catch (error) {
                    throw error;
                }
                try {
                    let existing_project_details = await existing_planning_projects.findOne(
                        {
                            tool_id: tool_details._id,
                            planning_project_name: api_data['Project Name']
                        });
                    tool_project_key = existing_project_details.planning_project_key;
                }
                catch (error) {
                    throw error;
                }

                let tool_url = tool_details.tool_url;
                let auth_token;
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

                        auth_token = new Buffer.from(
                            vault_configuration.auth_username + ':' +
                            vault_configuration.auth_password
                        ).toString('base64');

                    } else {
                        auth_token = vault_configuration.auth_token;
                    }
                }
                else {
                    if (tool_details.tool_auth.auth_type == 'password') {
                        auth_token = new Buffer.from(
                            tool_details.tool_auth.auth_username + ':' +
                            tool_details.tool_auth.auth_password
                        ).toString('base64');
                    }
                    else {
                        auth_token = tool_details.tool_auth.auth_token;
                    }
                }
                let tool_obj = {
                    pipeline_key: tool_project_key,
                    summary: api_data['Issue Summary'],
                    issue_type: api_data['Issue Type']
                };
                issue_response = await jira_create.create_jira_project_issue(tool_obj, tool_url, auth_token);
                //**********************
            } catch (error) {
                throw error;
            }
            let task_status = issue_response.status_code == 201 ? "COMPLETE" : "FAILED";
            let task_status_code = issue_response.status_code == 201 ? 200 : 500;
            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            this.saveStateAndProceed(pipeline_key, machine_id, task_field, task_status, { status: task_status_code });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },

    /**
     * This function sonarqube_code_analysis
     * @param {String} pipeline_key
     * @param {String} machine_id
     * @param {String} state
     * @param {String} task_field
     * @param {String} api_data
     */
    async sonarqube_code_analysis(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();



            try {
                //***sonarqube_code_analysis_task******
                let job_parameters = {
                    agent_name: api_data['agent_name'],
                    // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                    // new instance agent_home - /ebs_30_081020/jenkins_home
                    agent_home: await getAgentHome(api_data['agent_name']),
                    sonar_file_path: "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };
                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.SONAR_WF_JOB, job_parameters);
                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },

    async qualys_analysis(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();



            try {
                //***sonarqube_code_analysis_task******
                let job_parameters = {
                    agent_name: api_data['agent_name'],
                    // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                    // new instance agent_home - /ebs_30_081020/jenkins_home
                    agent_home: await getAgentHome(api_data['agent_name']),
                    qualys_file_path: "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };
             
                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.QUALYS_ANALYSIS, job_parameters);
                //    let qualys_data = await dast_qualys_data.findOne({"pipeline_key":pipeline_key}).sort({"build_number":-1}).limit(1)
                //    let build_number;

                //    if( qualys_data == null){
                //        build_number = 1
                //    }
                //    else{
                //        build_number = qualys_data.build_number +1

                //    }

                //    let new_qualys_data = new dast_qualys_data({
                //        "pipeline_key": pipeline_key,
                //        "build_number":build_number
                //    });
                //    await dast_qualys_data.create( new_qualys_data)

                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    /**
     * This function build_docker_image
     * @param {String} pipeline_key
     * @param {String} machine_id
     * @param {String} state
     * @param {String} task_field
     * @param {String} api_data
     */
    async build_docker_image(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            try {
                //***build_docker_image******
                let job_parameters = {
                    agent_name: api_data['agent_name'],
                    // agent_home: "/home/ubuntu",
                    agent_home: await getAgentHome(api_data['agent_name']),
                    docker_file_path: "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                    image_name: api_data['Image Name'],
                    image_tag: api_data['Image Tag'],
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };


                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.DOCKER_BUILD_WF_JOB, job_parameters);
                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    async start_node(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async end_node(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    /**
 * This function creates pipeline and transitions pipeline workflow accordingly
 * @param {String} pipeline_key
 * @param {String} machine_id
 * @param {String} state
 * @param {String} task_field
 * @param {String} api_data
 */
    async create_pipeline(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            try {
                await save_pipeline_info.save_pipeline_details(api_data, pipeline_key);
            } catch (error) {
                throw error;
            }

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async create_jira_server_project(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            try {
                await jira_create.create_jira_project(api_data.body, api_data.jira_url, api_data.jira_auth_token);
            } catch (error) {
                throw error;
            }
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async create_bitbucket_server_project(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            try {
                await create_bitbucket_project.create_bitbucket_project(api_data.scm_obj, api_data.bitbucket_url, api_data.bitbucket_auth_token);
            } catch (error) {
                throw error;
            }
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async sonarqube_code_analysis_scan_email_approval(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********

            let sender_email = `${process.env.WORKFLOW_SENDER_EMAILID}`;
            // let sender_password = `${process.env.WORKFLOW_SENDER_PASSWORD}`;
            let transporter = nodemailer.createTransport({
                service: 'outlook',
                auth: {
                    user: sender_email,
                    pass: `${process.env.WORKFLOW_SENDER_PASSWORD}`
                }
            });
            let email_data = {
                pipeline_key,
                machine_id,
                pipeline_name: api_data.pipeline_name,
                application_key: api_data.application_key,
                tool_project_name: api_data['Project Name'],
                task_field: task_field,
                service_url: `${process.env.SERVICE_URL}`
            };
            let email_template = require('./email_template');
            let email_txt = email_template(email_data);
            let mailOptions = {
                from: sender_email,
                to: api_data["Approver's Email"],
                subject: 'Approval request for sonarqube code analysis scan on pipeline ' + api_data.pipeline_name,
                html: email_txt
            };

            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    throw error;
                }
            });
            //***********************************

            //this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }

    },
    async create_sonarqube_project(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            try {
                await create_sonarqube_project.create_sonarqube_project(api_data.code_quality_obj, api_datasonarqube_url, api_data.sonarqube_auth_token);
            } catch (error) {
                throw error;
            }
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async create_jenkins_job(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            try {
                await create_jenkins_project.createJenkinsProject(api_data.continuous_integration_obj, api_data.jenkins_url, api_data.jenkins_auth_token);
            } catch (error) {
                throw error;
            }
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async create_serviceNow_Ticket(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            let snow_data =
            {
                "short_description": api_data["Ticket Summary"],
                "u_pipeline_key": pipeline_key,
                "u_application_key": api_data.application_key


            };

            await servicenow_connector.create_new_incident(snow_data);
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }

    },
    async deploy_on_ECS_type_EC2(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            var created_task_definition = await aws_ecs_task_definition_type_ec2.create_task_definiton(api_data["Task Definiton Name"], api_data["Container Name"], api_data["Image"], api_data["Memory Limit(MiB)"], api_data["Container Port"], api_data["Host Port"]);
            await aws_ecs_cluster.run_task(api_data["Cluster"], created_task_definition.taskDefinition.family, created_task_definition.taskDefinition.revision);
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async deploy_on_ECS_type_Fargate(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********

            var created_task_definition = await aws_ecs_task_definition_type_fargate.create_task_definiton(
                api_data["Task Definiton Name"],
                api_data["CPU"],
                api_data["Container Name"],
                api_data["Image"],
                api_data["Memory Limit(MiB)"],
                api_data["Container Port"],
                api_data["Execution Role ARN"]);

            await aws_ecs_cluster.run_task(api_data["Cluster"], created_task_definition.taskDefinition.family, created_task_definition.taskDefinition.revision, api_data["Subnet"], api_data["Security Group"]);
            //***********************************

            this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async AWS_EKS_Deployment(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            //***********************************
            let job_parameters = {
                agent_name: api_data['agent_name'],
                deployment_name: api_data["Deployment Name"],
                replicas: api_data["Replica Count"],
                deployment_type: api_data["Deployment Type"],
                max_surge: api_data["Max Surge"],
                max_unavailable: api_data["Max Unavailable"],
                image: api_data["Image"],
                container_port: api_data["Container Port"],
                port: api_data["Port"],
                node_port: api_data["NodePort"],
                service_type: api_data["Service Type"],
                cluster_name: api_data["Cluster Name"],
                pipeline_key: pipeline_key,
                machine_id: machine_id,
                task_field: task_field,
                jenkins_post_url: process.env.JENKINS_POST_URL
            };
            await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.DEPLOY_ON_EKS, job_parameters);
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async push_image_to_ECR(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {

        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            //***build_docker_image******
            let job_parameters = {
                agent_name: api_data['agent_name'],
                image_name: api_data["Image Name"],
                image_tag: api_data["Image Tag"],
                repository_name: api_data["Repository Name"],
                pipeline_key: pipeline_key,
                machine_id: machine_id,
                task_field: task_field,
                jenkins_post_url: process.env.JENKINS_POST_URL
            };

            await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.PUSH_TO_ECR_WF_JOB, job_parameters);
            //**********************
            //***********************************

            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async sonarqube_SAST(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            let is_codeDx_enabled = api_data["Push code to CodeDX"];
            let codedx_tool = "";
            let codedx_url = "";
            let server_api_key = "";
            let codeDx_project_id = "";
            if (is_codeDx_enabled == true) {
                codedx_tool = await getCodeDxDetails(pipeline_key);
                codedx_url = codedx_tool.tool.tool_url
                server_api_key = codedx_tool.tool.tool_auth.auth_token
                codeDx_project_id = codedx_tool.project_id;
            }



            let job_parameters = {
                agent_name: api_data['agent_name'],
                // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                // new instance agent_home - /ebs_30_081020/jenkins_home

                agent_home: await getAgentHome(api_data['agent_name']),// agent_home_select,//"/ebs_30_081020/jenkins_home",
                sonar_file_path: "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                pipeline_key: pipeline_key,
                machine_id: machine_id,
                task_field: task_field,
                is_codeDx_enabled: is_codeDx_enabled,//api_data["Push code to CodeDX"],
                jenkins_post_url: process.env.JENKINS_POST_URL,
                codedx_url: codedx_url,//codedx_tool.tool.tool_url,//api_data.Url,
                server_api_key: server_api_key,//codedx_tool.tool.tool_auth.auth_token,//api_data['Api Key'],
                codedx_project_id: codeDx_project_id,//codedx_tool.project_id,//api_data['Project Id'],
                execution_number: execution_number,

            };

            await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.SONARQUBE_SAST_WF_JOB, job_parameters);





            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async ZAP_DAST(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {

        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********

            let is_codeDx_enabled = api_data["Push code to CodeDX"];
            let codedx_tool = "";
            let codedx_url = "";
            let server_api_key = "";
            let codeDx_project_id = "";
            if (is_codeDx_enabled == true) {
                codedx_tool = await getCodeDxDetails(pipeline_key);
                codedx_url = codedx_tool.tool.tool_url
                server_api_key = codedx_tool.tool.tool_auth.auth_token
                codeDx_project_id = codedx_tool.project_id;
            }


            let job_parameters = {
                agent_name: api_data['agent_name'],
                // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                // new instance agent_home - /ebs_30_081020/jenkins_home

                agent_home: await getAgentHome(api_data['agent_name']),//agent_home_select,
                deployed_url: api_data['Deployed Url'],// "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                pipeline_key: pipeline_key,
                machine_id: machine_id,
                task_field: task_field,

                is_codeDx_enabled: is_codeDx_enabled,//api_data["Push code to CodeDX"],
                jenkins_post_url: process.env.JENKINS_POST_URL,
                codedx_url: codedx_url,//codedx_tool.tool.tool_url,//api_data.Url,
                server_api_key: server_api_key,//codedx_tool.tool.tool_auth.auth_token,//api_data['Api Key'],
                codedx_project_id: codeDx_project_id,//codedx_tool.project_id,//api_data['Project Id'],
                context_name: api_data['Context Name'],
                execution_number: execution_number,

            };

            await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.ZAP_DAST_WF_JOB, job_parameters);





            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },



    async Arachni_SAST(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {

        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            //   cconso
            let is_codeDx_enabled = api_data["Push code to CodeDX"];
            let codedx_tool = "";
            let codedx_url = "";
            let server_api_key = "";
            let codeDx_project_id = "";
            if (is_codeDx_enabled == true) {
                codedx_tool = await getCodeDxDetails(pipeline_key);
                codedx_url = codedx_tool.tool.tool_url
                server_api_key = codedx_tool.tool.tool_auth.auth_token
                codeDx_project_id = codedx_tool.project_id;
            }

            let job_parameters = {
                agent_name: 'windows-agent',//api_data['agent_name'],
                // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                // new instance agent_home - /ebs_30_081020/jenkins_home

                agent_home: await getAgentHome(api_data['agent_name']),//"/ebs_30_081020/jenkins_home",
                website_url: api_data['Project Url'],// "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                pipeline_key: pipeline_key,
                machine_id: machine_id,
                task_field: task_field,
                jenkins_post_url: process.env.JENKINS_POST_URL,
                codedx_url: codedx_url,//codedx_tool.tool.tool_url,//api_data.Url,
                server_api_key: server_api_key,//codedx_tool.tool.tool_auth.auth_token,//api_data['Api Key'],
                codedx_project_id: codeDx_project_id,//codedx_tool.project_id,//api_data['Project Id'], // codedx_project_id:api_data['Project Id'],
                is_codeDx_enabled: is_codeDx_enabled,//api_data["Push code to CodeDX"],

                execution_number: execution_number,

                // context_name:api_data['Context Name']
            };

            await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.ARACHNI_SAST_WF_JOB, job_parameters);





            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async CodeDx_SAST(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {


        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            //*********write task here***********
            //   cconso

            let scm_detail = await getScmDetails(pipeline_key);

            let project_details = await getProjectDetails(scm_detail.tool_instance_name, scm_detail.project_name);


            let tool_data = await getToolDetails(api_data['Tool Instance Name'])//await tool.findOne({tool_instance_name: api_data['Tool Instance Name']})
            let api_key = tool_data.tool_auth.auth_token
            // let codeDx_url=

            let job_parameters = {
                agent_name: api_data['agent_name'],
                // agent_home: "/home/ubuntu", //get jenkins agent home through api(for now hard coded)
                // new instance agent_home - /ebs_30_081020/jenkins_home

                // agent_home: "/ebs_30_081020/jenkins_home",
                agent_home: await getAgentHome(api_data['agent_name']),
                // "/home/ubuntu",


                code_path: "workspace/".concat(checkout_path),
                // website_url :api_data['Project Url'],// "workspace/".concat(checkout_path),//"workspace/sonar_check_test_pipe/1/sonar-check",    //pipeline_name(remove space add_) + "_" + pipeline_key
                pipeline_key: pipeline_key,
                machine_id: machine_id,
                task_field: task_field,
                jenkins_post_url: process.env.JENKINS_POST_URL,
                codedx_url: tool_data.tool_url,
                server_api_key: api_key,//api_data['Api Key'],
                codedx_project_id: api_data['Project Id'],
                // context_name:api_data,
                // codedx_project_id:api_data['Project Id'],

                execution_number: execution_number,
                repo_url: project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + scm_detail.repository_name + ".git",
                branch_name: "master",  // later get branch name from ui
                creds: "scm-creds",// "scm-creds", //always hard coded

                // context_name:api_data['Context Name']
            };
            await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.CODE_DX_SAST_WF_JOB, job_parameters);





            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
        } catch (error) {
            logger.error(error);
        }
    },
    async azure_devops_checkout(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {

            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();

            try {
                let start_index = api_data['Repository Url'].lastIndexOf("/");
                let repo_name = api_data['Repository Url'].slice(start_index + 1, start_index.length)

                // let home = path.join('C:', 'Jenkins','workspace');
                let job_parameters = {
                    agent_name: api_data['agent_name'],//'windows-agent',
                    agent_home: "C:\\Jenkins\\workspace",
                    repo_url: api_data['Repository Url'],//project_details.tool_url + "/scm/" + project_details.project_key.toLowerCase() + "/" + api_data['Repository Name'] + ".git",
                    // branch_name: "master",  // later get branch name from ui
                    creds: api_data['Auth Token'],// "scm-creds", //always hard coded
                    folder_name: api_data['Checkout Directory Path'],//api_data['Checkout Directory Path'],
                    execution_number: execution_number,
                    pipeline_name_key: pipeline_key,    //pipeline_name(remove space add_) + "_" + pipeline_key
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    repo_name: repo_name,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };

                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.AZURE_CHECKOUT_WF_JOB, job_parameters);
                //**********************
            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {

            logger.error(error);
        }
    },
    async deploy_iis(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();


            try {
                //***compile_code_task******

                // let home = path.join('C:', 'Jenkins','workspace');

                let job_parameters = {
                    agent_name: api_data['agent_name'],//'windows-agent',
                    agent_home: "C:\\Jenkins\\workspace",
                    code_path: "workspace\\".concat(checkout_path),
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };

                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.DEPLOY_IIS_WF_JOB, job_parameters);


                // break;


            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    async Selenium_Testing(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();


            try {
                //***compile_code_task******

                // let home = path.join('C:', 'Jenkins','workspace');

                let job_parameters = {
                    agent_name: api_data['agent_name'],//'windows-agent',
                    agent_home: "/ebs_30_081020/jenkins_home",//home,// "C:\Jenkins\workspace",
                    code_path: "workspace/".concat(checkout_path),
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };

                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.SELENIUM_TESTING_WF_JOB, job_parameters);


                // break;


            } catch (error) {
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
    async Junit_testing(pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number) {
        try {
            let context_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".status");
            let task_name_id = task_field.split("_");
            let task_id = task_name_id[task_name_id.length - 1];    // node id at ui
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    "pipeline_workflow_ui_data.nodes.id": task_id
                },
                {
                    $set: {
                        [context_field]: "INITIALIZED",
                        "pipeline_workflow_ui_data.nodes.$.status": "INITIALIZED"
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();


            try {
              
                //***compile_code_task******
                // let home = path.join('C:', 'Jenkins','workspace');
                let job_parameters = {
                    agent_name: api_data['agent_name'],//'windows-agent',
                    agent_home: await getAgentHome(api_data['agent_name']),//home,// "C:\Jenkins\workspace",
                    code_path: "workspace/".concat(checkout_path),
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                    task_field: task_field,
                    jenkins_post_url: process.env.JENKINS_POST_URL
                };

                await trigger_job_with_parameters(pipeline_key, machine_id, task_field, api_data['ci_instance_name'], process.env.JUNIT_TESTING_WF_JOB, job_parameters);


                // break;


            } catch (error) {
               
                throw error;
            }

            //***********use this when no webhook calls are to be made for the above task(i.e. task gets completed and immediately progress is saved and moved to next state or node)**************
            // this.saveStateAndProceed(pipeline_key, machine_id, task_field, "COMPLETE", { status: 200 });
            //*****************************************************************************************
        } catch (error) {
            logger.error(error);
        }
    },
}

async function disable_non_reachable_nodes(context, potential_non_reachable_node, nodes) {
    let context_and_nodes = {
        context: context,
        nodes: nodes
    }
    if (context[potential_non_reachable_node].status == "READY") {
        let mark_node_disable = true;
        for (let source_node of context[potential_non_reachable_node].source_nodes) {
            if (["READY", "INITIALIZED"].includes(context[source_node].status)) {
                mark_node_disable = false;
                break;
            }
        };
        if (mark_node_disable) {
            context[potential_non_reachable_node].status = "DISABLED";
            nodes.push(potential_non_reachable_node);
            context_and_nodes = {
                context: context,
                nodes: nodes
            }
            for await (let non_reachable_node of context[potential_non_reachable_node].target_nodes) {
                context_and_nodes = await disable_non_reachable_nodes(context_and_nodes.context, non_reachable_node, context_and_nodes.nodes);
            }
        }
    }
    return context_and_nodes;
}


async function get_next_state_calls(current_state, task_api_response) {
    let next_states = [];
    if (current_state.links.length > 0) {
        // current_state.links.forEach(destination_state => {
        //     let any_conditions_matched = true;
        //     for (let condition of destination_state.conditions) {
        //         let paths = [], res_path_value;
        //         switch (condition.field_display_label) {// add different variety/types of conditional checks in this switch block
        //             case "Status Code":
        //                 //***********if in future field_key is taken from UI or changing**********
        //                 //paths = condition.field_key.split(".");
        //                 //res_path_value = traverseJson(task_api_response, paths);
        //                 //************************************************************************
        //                 if (task_api_response.status != condition.field_value) {
        //                     any_conditions_matched = false;
        //                 }
        //                 break;
        //             case "Approval Status":
        //                 //***********if in future field_key is taken from UI or changing**********
        //                 //paths = condition.field_key.split(".");
        //                 //res_path_value = traverseJson(task_api_response, paths);
        //                 //************************************************************************
        //                 if (task_api_response.approval_response.toUpperCase() != condition.field_value.toUpperCase()) {
        //                     any_conditions_matched = false;
        //                 }
        //                 break;
        //             case "Repository Path":
        //                 //***********if in future field_key is taken from UI or changing**********
        //                 //paths = condition.field_key.split(".");
        //                 //res_path_value = traverseJson(task_api_response, paths);
        //                 //************************************************************************
        //                 if (task_api_response.repo.url != condition.field_value) {
        //                     any_conditions_matched = false;
        //                 }
        //                 break;
        //             default:
        //                 any_conditions_matched = false;
        //                 break;
        //         }
        //         if (!any_conditions_matched) {
        //             break;
        //         }
        //     }
        //     if (any_conditions_matched) {
        //         next_states.push(destination_state.destination);
        //     }
        // });

        for (let destination_state of current_state.links) {
            let any_conditions_matched = true;
            for (let condition of destination_state.conditions) {
                let paths = [], res_path_value;
                switch (condition.field_display_label) {// add different variety/types of conditional checks in this switch block
                    case "Status Code":
                        //***********if in future field_key is taken from UI or changing**********
                        //paths = condition.field_key.split(".");
                        //res_path_value = traverseJson(task_api_response, paths);
                        //************************************************************************
                        if (task_api_response.status != condition.field_value) {
                            any_conditions_matched = false;
                        }
                        break;
                    case "Approval Status":
                        //***********if in future field_key is taken from UI or changing**********
                        //paths = condition.field_key.split(".");
                        //res_path_value = traverseJson(task_api_response, paths);
                        //************************************************************************
                        if (task_api_response.approval_response.toUpperCase() != condition.field_value.toUpperCase()) {
                            any_conditions_matched = false;
                        }
                        break;
                    case "Repository Path":
                        //***********if in future field_key is taken from UI or changing**********
                        //paths = condition.field_key.split(".");
                        //res_path_value = traverseJson(task_api_response, paths);
                        //************************************************************************
                        if (task_api_response.repo.url != condition.field_value) {
                            any_conditions_matched = false;
                        }
                        break;
                    default:
                        any_conditions_matched = false;
                        break;
                }
                if (!any_conditions_matched) {
                    break;
                }
            }
            if (any_conditions_matched) {
                next_states.push(destination_state.destination);
            }

        }
        if (next_states.length == 0) {
            next_states = ["fail_state"];
        }
    }
    return next_states;
}



async function getProjectDetails(tool_instance_name, project_name) {

    try {
        let tool_details = await tools.findOne({ tool_instance_name: tool_instance_name }).lean();
        let existing_project_details = await existing_scm_projects.findOne(
            {
                tool_id: tool_details._id,
                scm_project_name: project_name
            });
        return { project_key: existing_project_details.scm_project_key, tool_url: tool_details.tool_url };
    }
    catch (error) {
        throw error;
    }
}

async function getProjectDetailsForGitLab(tool_instance_name, project_name) {

    try {
        let tool_details = await tools.findOne({ tool_instance_name: tool_instance_name }).lean();
        let existing_project_details = await existing_scm_projects.findOne(
            {
                tool_id: tool_details._id,
                scm_project_name: project_name
            });
        return { project_key: existing_project_details.scm_project_key, tool_url: tool_details.tool_url, scm_project_self: existing_project_details.scm_project_self };
    }
    catch (error) {
        throw error;
    }
}

async function getRepoUrl(tool_instance_name, project_name, repo_name) {

    try {
        let tool_details = await tools.findOne({ tool_instance_name: tool_instance_name }).lean();
        let existing_project_details = await existing_scm_projects.aggregate([
            {
                $match: {
                    tool_id: tool_details._id,
                    scm_project_name: project_name
                }
            },
            {
                $addFields: {
                    repo_url: {
                        $map: {
                            input: "$repos",
                            as: "repo",
                            in:
                            {
                                $cond: {
                                    if: {
                                        $eq: ["$$repo.scm_repo_name", repo_name]
                                    },
                                    then: "$$repo.scm_repo_self",
                                    else: null
                                }
                            }
                        }
                    }
                }
            }
        ]);
        return existing_project_details[0].repo_url[0];
    }
    catch (error) {
        throw error;
    }
}

async function trigger_job_with_parameters(pipeline_key, machine_id, task_field, instance_name, job_name, job_parameters) {

    try {
        try {

            var tool_details = await tools.findOne({ 'tool_instance_name': instance_name }).lean();


        }
        catch (error) {

            throw error;
        }
        var tool_url = tool_details.tool_url;
        let continuous_integration_auth_token
        if (tool_details.tool_auth.auth_type == 'password') {
            continuous_integration_auth_token = Buffer.from(
                tool_details.tool_auth.auth_username + ':' +
                tool_details.tool_auth.auth_password
            ).toString("base64");
        }
        else {
            continuous_integration_auth_token = tool_details.tool_auth.auth_token;
        }
        try {
            var build_number = await jenkins_build_trigger.getLatestBuildNumber(tool_url, continuous_integration_auth_token, job_name);
            let build_number_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".build_number");
            let job_name_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".job_name");
            await pipeline_workflow.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                    machine_id: machine_id,
                },
                {
                    $set: {
                        [build_number_field]: build_number,
                        [job_name_field]: job_name
                    }
                },
                {
                    upsert: false,
                    new: true
                }).lean();
                
            var job_triggered = await jenkins_build_trigger.buildJobWithParameters(tool_url, continuous_integration_auth_token, job_name, job_parameters);
            if (job_triggered == "success") {
                // await setTimeout(async function(){

                return ('Jenkins job has been started');
                // }, 4000);
            }
        }

        catch (error) {
          
            throw error;
        }
    }
    catch (error) {
       
        throw error;
    }
}

async function getToolDetails(tool_instance_name) {
    let tool_data = await tool.findOne({ tool_instance_name: tool_instance_name })
    return tool_data;

}


async function getCodeDxDetails(pipeline_key) {

    let pipeline_detail = await pipeline.findOne({ "pipeline_key": pipeline_key });

    let nodes = pipeline_detail.pipeline_workflow_ui_data.nodes;
    let tool;
    let project_id;
    for await (var node of nodes) {
        if (node.task.task_key == "CodeDx_SAST") {
            project_id = node.task['Project Id'];
            tool = await getToolDetails(node.task['Tool Instance Name']);
            break;
        }
    }
    return { "tool": tool, "project_id": project_id };
}

async function getScmDetails(pipeline_key) {

    let pipeline_detail = await pipeline.findOne({ "pipeline_key": pipeline_key });

    let nodes = pipeline_detail.pipeline_workflow_ui_data.nodes;
    let project_name;
    let tool_instance_name;
    let repository_name;
    for await (var node of nodes) {
        if (node.task.task_key == "bitbucket_checkout") {
            project_name = node.task['Project Name'];
            tool_instance_name = node.task['Tool Instance Name'];
            repository_name = node.task['Repository Name'];
            break;
        }
    }
    return { "project_name": project_name, "tool_instance_name": tool_instance_name, "repository_name": repository_name };
}
async function getAgentHome(agent_name) {

    let agent_home_select;

    if (agent_name == "canvasSlave") {
        agent_home_select = "/ebsSlave";
    } else {
        agent_home_select = "/ebs_30_081020/jenkins_home";
    }

    return agent_home_select;
}



var all_actions_guards = require('./all_actions_guards');
const tool = require('../../models/tool'); const pipeline = require('../../models/pipeline');

