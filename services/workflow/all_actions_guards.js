

module.exports = {

    actions_list: {
        //***************always create new tasks here and always pass pipeline_key, machine_id, state, task_data(any data that is required to complete the task), field_name(name of field to update for that task status i.e. tasks will be executed only if they are in READY state) */

        start_node: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.start_node(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        end_node: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.end_node(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        bitbucket_checkout: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.bitbucket_checkout(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        gitlab_checkout: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.gitlab_checkout(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        sonarqube_code_analysis: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.sonarqube_code_analysis(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },

        qualys_code_analysis: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks. qualys_analysis(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },

        build_docker_image: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.build_docker_image(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        compile_code: async (context, event, { state }) => {
            
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.compile_code(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        push_image_to_jfrog: async (context, event, { state }) => {
            
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.push_image_to_jfrog(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_jira_issue: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_jira_issue(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_pipeline: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_pipeline(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_jira_server_project: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_jira_server_project(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_bitbucket_server_project: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_bitbucket_server_project(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        sonarqube_code_analysis_scan_email_approval: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.sonarqube_code_analysis_scan_email_approval(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_sonarqube_project: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_sonarqube_project(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_jenkins_job: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_jenkins_job(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        create_serviceNow_Ticket: async (context, event, { state }) => {
            if (context[state.value].status.toUpperCase() == "READY") {
                workflow_tasks.create_serviceNow_Ticket(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        deploy_on_ECS_type_EC2:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                workflow_tasks.deploy_on_ECS_type_EC2(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        deploy_on_ECS_type_Fargate:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                workflow_tasks.deploy_on_ECS_type_Fargate(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        push_image_to_ECR:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                workflow_tasks.push_image_to_ECR(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },sonarqube_SAST:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.sonarqube_SAST(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        ZAP_DAST:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.ZAP_DAST(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        Arachni_SAST:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.Arachni_SAST(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        CodeDx_SAST:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.CodeDx_SAST(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },azure_devops_checkout:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.azure_devops_checkout(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },deploy_iis:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.deploy_iis(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },Selenium_Testing:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.Selenium_Testing(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },
        AWS_EKS_Deployment:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.AWS_EKS_Deployment(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        },Junit_testing:async(context,event,{state})=>{
            if(context[state.value].status.toUpperCase()=="READY"){
                 workflow_tasks.Junit_testing(context.pipeline_key, context.machine_id, context.checkout_path, state.value, context[state.value].data, context.execution_number);
            }
        }
    },

    guards_list: {
        pipelineCreated: async (context, event) => {
            let proceed_check = await workflow_transition_checks.pipelineCreated(context.pipeline_key, context.machine_id);
            return proceed_check;
        },
        sonarCreationApproved: async (context, event) => {
            //Add functionality for getSuccess
            return false;
        },
        onboardedOnAllTools: async (context, event) => {
            //Check if all project onboarded on all tools i.e. check individually for all tools
            return false;
        }
    }
}

var workflow_tasks = require('./workflow_tasks');
var workflow_transition_checks = require('./workflow_transition_checks');