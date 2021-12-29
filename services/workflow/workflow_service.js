var pipeline_workflow = require('../../models/pipeline_workflow');
var pipeline = require('../../models/pipeline');
var workflow_tasks = require('./workflow_tasks');
var all_actions_guards = require('./all_actions_guards');
var XState = require('xstate');
var generate_pipeline_key = require('../../service_helpers/common/generate_pipeline_key');
var generate_key = require('../../service_helpers/generate_key');
var logger = require('../..//configurations/logging/logger');
var bitbucket_create = require('../../connectors/bitbucket/bitbucket_create');
var qualys_create = require('../../connectors/qualys/qualys_create');
var azurerepos_create = require('../../connectors/azurerepos/azurerepos_create.js');
var gitlab_create = require('../../connectors/GitLab/gitlab_create')
var sonarqube_create = require('../../connectors/sonarqube/sonarqube_create');
var jira_create = require('../../connectors/jira/jira_create');
var tool = require("../../models/tool");
var existing_code_analysis_projects = require("../../models/existing_code_analysis_projects");
const bitbucket_sync_projects = require('../../connectors/bitbucket/bitbucket_sync_projects');
var gitlab_sync = require('../../connectors/GitLab/gitlab_sync_project');
var onboarding_sync = require('../pipeline/onboarding_sync/onboarding_sync_service');
var pipeline_dashboard_service = require('../pipeline/dashboard/pipeline_dashboard_service');
const jira_sync_projects = require('../../connectors/jira/jira_sync_projects');
const sonarqube_sync_projects = require('../../connectors/sonarqube/sonarqube_sync_projects');
const jenkins_sync_projects = require('../../connectors/jenkins/jenkins_sync_jobs');
const existing_continuous_integration_jobs = require('../../models/existing_continuous_integration_jobs');
const existing_scm_projects = require('../../models/existing_scm_projects');
var existing_dast_projects = require('../../models/existing_dast_projects')
const existing_planning_projects = require('../../models/existing_planning_projects');
var workflow_master_task = require('../../models/workflow_master_task');
var save_pipeline_info = require('../../service_helpers/common/save_pipeline_info');
var code_analysis = require('../../models/code_analysis');
var application = require('../../models/application');
var dashboard_component = require('../../models/dashboard_components');
var user = require('../../models/user');
var dashboard_service = require('../dashboard/dashboard_service');
var tool_master_datas = require('../../models/tool_master_datas')
var pipeline_dashboard_components = require('../../models/pipeline_dashboard_components');
var existing_artifactory_management_repo = require('../../models/existing_artifactory_management_repo');
var aws_ecs_cluster = require('../../connectors/aws/aws_ecs_cluster');
var aws_ecr_repositories = require('../../connectors/aws/aws_ecr_repositories');
var aws_iam = require('../../connectors/aws/aws_iam');
var aws_networking = require('../../connectors/aws/aws_networking');
var activity_logger = require('../../service_helpers/common/activity_logger');
const { link } = require('fs');
var jwt = require("jsonwebtoken");
var codeDX_get_project_list = require('../../connectors/codeDX/get_project_list');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var existing_codedx_projects = require('../../models/existing_codedx_projects');
var aws_eks_cluster = require('../../connectors/aws/aws_eks_cluster');
var dateFormat = require("dateformat");
var bitbucket_sync = require("../../connectors/bitbucket/bitbucket_sync");
var ci_sync_db_save = require("../../service_helpers/common/ci_sync_db_save");
var settings_service = require("../../services/settings/settings_service");
const mongoose = require('mongoose');
var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var existing_ci = require('../../models/existing_continuous_integration_jobs');
const qualys_sync_projects = require('../../connectors/qualys/qualys_sync_projects');
const plan_existing = require('../../models/existing_planning_projects');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {

  getAWSIAMRoles: async () => {
    let roles = await aws_iam.get_iam_roles();
    let role_ARNs = [];
    role_ARNs.push("Select Option");
    for await (let role of roles.Roles) {
      role_ARNs.push(role.Arn);
    }
    return role_ARNs;
  },
  getAWSECSClusters: async () => {
    let clusters = await aws_ecs_cluster.get_clusters();
    // clusters.unshift("Select Option");
    return clusters;
  },
  getAWSVPCs: async () => {
    let vpcs = await aws_networking.get_vpc();
    let vpc_ids = ["Select Option"];
    for await (let vpc of vpcs.Vpcs) {
      vpc_ids.push(vpc.VpcId);
    }
    return vpc_ids;
  },
  getAWSSubnets: async (vpc_id) => {
    let subnets = await aws_networking.get_subnets(vpc_id);
    let subnet_ids = ["Select Option"];
    for await (let subnet of subnets.Subnets) {
      subnet_ids.push(subnet.SubnetId);
    }
    return subnet_ids;
  },
  getAWSSecurityGroups: async (vpc_id) => {
    let sgs = await aws_networking.get_securityGroups(vpc_id);
    let sg_ids = ["Select Option"];
    for (let sg of sgs.SecurityGroups) {
      sg_ids.push(sg.GroupId);
    }
    return sg_ids;
  },
  getAWSECSECRRepositories: async () => {
    let repositories = await aws_ecr_repositories.get_repositories();

    let repo_names = [];
    repo_names.push("Select Option");
    for await (let repo of repositories.repositories) {
      repo_names.push(repo.repositoryName);
    }
    return repo_names;
  },
  /**
* This function returns the KPIs for workflow
* @param {String} pipeline_key
* @param {Number} execution_number
*/
  getWorkflowKPI: async (pipeline_key, execution_number) => {
    let pipeline_wf_data = await pipeline_workflow.findOne({ pipeline_key: pipeline_key, execution_number: execution_number }, { actions: 1, _id: 0 }).lean();
    let task_nodes = [];
    let KPI_data = [];
    task_nodes = pipeline_wf_data.actions;
    try {
      for await (let task of task_nodes) {
        let data = {
          task_name: "",
          task_kpi: {}
        };
        // Refer <task == "sonarqube_code_analysis"> for which KPIs are present
        if (task == "compile_code") {
          data.task_name = "Compile Code";
          data.task_kpi = ""; //Add the logic for getting data of kpi here(db calls or method calls)
          // In future when the kpis are added handle the case when there is no entry for that stage in db with this
          // if(data.task_kpi == null || data.task_kpi == undefined){
          //   data.task_kpi = {
          //      kpi fields to be initialized here for a null case scenario
          //   }
          KPI_data.push(data);
        }
        else if (task == "build_docker_image") {
          data.task_name = "Build Docker Image";
          data.task_kpi = ""; //Add the logic for getting data of kpi here(db calls or method calls)
          // In future when the kpis are added handle the case when there is no entry for that stage in db with this
          // if(data.task_kpi == null || data.task_kpi == undefined){
          //   data.task_kpi = {
          //      kpi fields to be initialized here for a null case scenario
          //   }
          KPI_data.push(data);
        }
        else if (task == "sonarqube_code_analysis_scan_email_approval") {
          data.task_name = "Sonarqube Scan Email Approval";
          data.task_kpi = ""; //Add the logic for getting data of kpi here(db calls or method calls)
          KPI_data.push(data);
        }
        else if (task == "create_jira_bug") {
          data.task_name = "Create Issue in Jira";
          data.task_kpi = ""; //Add the logic for getting data of kpi here(db calls or method calls)
          // In future when the kpis are added handle the case when there is no entry for that stage in db with this
          // if(data.task_kpi == null || data.task_kpi == undefined){
          //   data.task_kpi = {
          //      kpi fields to be initialized here for a null case scenario
          //   }
          KPI_data.push(data);
        }
        else if (task == "sonarqube_code_analysis") {
          data.task_name = "Sonarqube Code Analysis";
          data.task_kpi = await code_analysis.findOne({ pipeline_key: pipeline_key, workflow_execution_number: execution_number }, { technical_debt: 1, vulnerabilities: 1, line_coverage: 1, _id: 0 }).lean();
          if (data.task_kpi == null || data.task_kpi == undefined) {
            data.task_kpi = {
              "technical_debt": 0,
              "vulnerabilities": 0,
              "line_coverage": 0
            }
          }
          KPI_data.push(data);
        }
        else if (task == "bitbucket_checkout") {
          data.task_name = "Checkout Bitbucket Project";
          data.task_kpi = ""; //Add the logic for getting data of kpi here(db calls or method calls)
          // In future when the kpis are added handle the case when there is no entry for that stage in db with this
          // if(data.task_kpi == null || data.task_kpi == undefined){
          //   data.task_kpi = {
          //      kpi fields to be initialized here for a null case scenario
          //   }
          KPI_data.push(data);
        }
        else if (task == "push_image_to_jfrog") {
          data.task_name = "Push Image To JFrog";
          data.task_kpi = ""; //Add the logic for getting data of kpi here(db calls or method calls)
          // In future when the kpis are added handle the case when there is no entry for that stage in db with this
          // if(data.task_kpi == null || data.task_kpi == undefined){
          //   data.task_kpi = {
          //      kpi fields to be initialized here for a null case scenario
          //   }
          KPI_data.push(data);
        }
      }
      return KPI_data;
    }
    catch (error) {
      throw error
    }
  },
  /**
* This function saves the job name and build number(of a particular task after getting a webhook call to genius)
* @param {String} pipeline_key
* @param {String} machine_id
* @param {String} task_field
* @param {Number} build_number
* @param {String} job_name
* @param {Object} xstate_response
*/
  saveTaskBuildInfo: async (pipeline_key, machine_id, task_field, build_number, job_name, xstate_response) => {
    let build_number_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".build_number");
    let job_name_field = "pipeline_workflow_xstate_data.context.".concat(task_field).concat(".job_name");

    let temp_arr = task_field.split("_");
    let task_key = "";
    for (let i = 0; i < temp_arr.length - 1; i++) {
      task_key = task_key.concat(temp_arr[i]).concat("_");;
    };
    task_key = task_key.substring(0, task_key.length - 1);

    if ((["bitbucket_checkout"].includes(task_key) || ["azure_devops_checkout"].includes(task_key) || ["gitlab_checkout"].includes(task_key)) && xstate_response.status == 200) {

      await pipeline_workflow.findOneAndUpdate(
        {

          pipeline_key: pipeline_key,
          machine_id: machine_id
        },
        {
          $set: {
            "pipeline_workflow_xstate_data.context.checkout_path": xstate_response.checkout_path
          }
        },
        {
          upsert: false,
          new: true
        }).lean();
    }
    if ((["Junit_testing"].includes(task_key) && xstate_response.status == 200)) {

      await ci_sync_db_save.jenkins_save_build_data(pipeline_key, build_number, job_name);
    }
    if ((["Selenium_Testing"].includes(task_key) && xstate_response.status == 200)) {

      await ci_sync_db_save.jenkins_save_build_data(pipeline_key, build_number, job_name);
    }
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

  },
  /**
* This function saves the state and directs the xstate for next stage execution. Called as webhook in jenkins task jobs
* @param {Object} workflow_webhook_data
*/
  workflowWebhookJenkins: async (workflow_webhook_data) => {

    try {


      await module.exports.saveTaskBuildInfo(workflow_webhook_data.pipeline_key, workflow_webhook_data.machine_id, workflow_webhook_data.task_field, workflow_webhook_data.build_number, workflow_webhook_data.job_name, workflow_webhook_data.xstate_response);
      workflow_tasks.saveStateAndProceed(workflow_webhook_data.pipeline_key, workflow_webhook_data.machine_id, workflow_webhook_data.task_field, workflow_webhook_data.task_result, workflow_webhook_data.xstate_response);
    }
    catch (error) {
      throw error;
    }

  },
  /**
 * This function return category list
 *
 */
  getCategoryList: async () => {
    try {

      let categories = await tool_master_datas.aggregate([
        { $match: { is_active: true } },
        {
          $group: {
            _id: "$tool_category"
          }
        }
      ]);

      let category_list = await categories.map(tool_category => {
        return tool_category._id
      });
      category_list.unshift("Select Option");
      return category_list;


    }
    catch (error) {
      throw new Error(error);
    }
  },

  getTaskList: async (category) => {
    try {






      var tool_categories = await tool_master_datas.aggregate([
        { $match: { tool_category: category } },
        {
          $lookup:
          {
            from: "workflow_master_task",
            localField: "tool_tasks",
            foreignField: "_id",
            as: "task"
          }
        }, {
          $unwind: { path: "$task" }
        },
        {
          '$group': {
            '_id': '$task._id',
            'task': {
              '$addToSet': '$task'
            }
          }
        }, {
          '$unwind': {
            'path': '$task'
          }
        },
        {
          $project: {
            _id: 0, task_name: "$task.task_name", task_key: "$task.task_key", tool_name: "$task.tool_name", create_project_required: "$task.create_project_required"
          }

        }
      ]);


      // for await (project of task_list) {
      //   var temp_object = {
      //     task_name: project.tool_tasks.task_name,
      //     task_key: project.tool_tasks.task_key,
      //     create_project_required: project.tool_tasks.create_project_required,
      //     tool_name: project.tool_tasks.tool_name
      //   };
      //   tasks.push(temp_object);
      // }
      tool_categories.unshift({
        task_name: "Select Option",
        task_key: "Select Option",
        create_project_required: false,
        tool_name: ""
      });

      return tool_categories
    }
    catch (error) {
      throw error;
    }
  },



  /**
 * This function saves pipeline workflow for ui
 * @param {String} pipeline_key
 */
  getPipelineWorkflow: async (pipeline_key) => {
    try {
      let pipe = await pipeline.findOne(
        {
          pipeline_key: pipeline_key
        }
      ).lean();
      return {
        pipeline_name: pipe.pipeline_name,
        pipeline_description: pipe.pipeline_description,
        pipeline_type: pipe.pipeline_type,
        ci_instance_name: pipe.continuous_integration.instance_details.instance_name,
        agent_name: pipe.continuous_integration.instance_details.agent_name,
        pipeline_workflow_data: pipe.pipeline_workflow_ui_data
      };
    }
    catch (error) {
      throw new Error(error);
    }
  },
  /**
 * This function gets all executions details for particular pipeline workflow
 * @param {String} pipeline_key
 */
  getPipelineWorkflowExecutions: async (pipeline_key) => {
    try {
      let pre_duration = 0;
      let pipes = await pipeline_workflow.aggregate([
        {
          $match: {
            pipeline_key: pipeline_key
          }
        },
        {
          $sort: { "execution_number": -1 }
        },
        {
          $project: {
            _id: 0,
            pipeline_key: 1,
            start_time: { $dateToString: { format: "%G-%m-%d %H:%M:%S", date: "$start_time" } },
            execution_number: 1,
            pipeline_workflow_ui_data: 1
          }
        }
      ]);
      let detailedExecutions = [];

      for await (let pipe of pipes) {
        let execution_status = "";
        let executed_by = "";
        let formated_date = "";
        let formated_time = "";
        let time_completed = "-";
        let time_comparision = 0;
        let prev_temp_duration;
        let temp_prev_detailed_execution;
        let scm_repo_name = "-";
        let temp_scm_stage = pipe.pipeline_workflow_ui_data.nodes.find(node => node.task.task_key == 'bitbucket_checkout');
        if (temp_scm_stage != null || temp_scm_stage != undefined) {
          scm_repo_name = temp_scm_stage['task']["Repository Name"];
        }
        let temp_detailed_execution = await module.exports.getPipelineWorkflowExecutionDetails(pipe.pipeline_key, pipe.execution_number);

        if (temp_detailed_execution.start_time != undefined) {
          formated_date = await module.exports.formatDate(temp_detailed_execution.start_time);

          // formated_time=await module.exports.formatTime(temp_detailed_execution.start_time,"h:mm:ss");
          formated_time = await dateFormat(
            temp_detailed_execution.start_time,
            "hh:mm:ss"
          );

        }
        if (temp_detailed_execution.executed_by) {
          let temp_user = await user.findOne({ 'user_mail': temp_detailed_execution.executed_by }, { 'user_name': 1 }).lean();
          executed_by = temp_user.user_name;
        }
        let nodes = temp_detailed_execution.pipeline_workflow_ui_data.nodes;
        let links = temp_detailed_execution.pipeline_workflow_ui_data.links;
        let end_node = nodes.find(node => node.label == "End");
        if (end_node.status == "COMPLETE") {
          execution_status = "COMPLETE";
        }
        else if (end_node.status == "FAILED") {
          execution_status = "FAILED";
        }
        else if (end_node.staus == "INITIALIZED") {
          execution_status = "INITIALIZED";
        }
        else {
          let failed_nodes = nodes.filter(node => node.status == "FAILED");
          if (failed_nodes.length == 0) {
            execution_status = "INITIALIZED";
          }
          else {
            for await (let failed_node of failed_nodes) {
              let links_with_failed_node_as_source = links.filter(link => link.source == failed_node.id);
              let link_count = links_with_failed_node_as_source.length;

              let ready_link_count = 0;
              for await (let failed_link of links_with_failed_node_as_source) {
                let target_node = nodes.find(node => node.id == failed_link.target);
                if (target_node.status == "READY" || target_node.status == "DISABLED") {
                  ready_link_count++;
                }
              }

              if (ready_link_count == link_count) {
                execution_status = "FAILED";

                break;
              }
            }

            if (execution_status != "FAILED") {
              execution_status = "INITIALIZED";
            }
          }
        }
        if (execution_status == "COMPLETE" || execution_status == "FAILED") {
          time_completed = await module.exports.formatTime(temp_detailed_execution.updatedAt);
        }

        let temp_duration = (new Date(temp_detailed_execution.updatedAt) - new Date(temp_detailed_execution.start_time)) / (60 * 1000).toFixed(3);

        temp_duration = temp_duration.toFixed(3);
        if (pipe.execution_number >= 2) {

          let prev_execution_number = pipe.execution_number - 1;

          temp_prev_detailed_execution = await module.exports.getPipelineWorkflowExecutionDetails(pipe.pipeline_key, prev_execution_number);

          prev_temp_duration = (new Date(temp_prev_detailed_execution.updatedAt) - new Date(temp_prev_detailed_execution.start_time)) / (60 * 1000).toFixed(3);

          prev_temp_duration = prev_temp_duration.toFixed(3);

          time_comparision = (temp_duration - prev_temp_duration).toFixed(3);
        }
        else {
          time_comparision = time_comparision.toFixed(3);
        }
        let temp_execution_obj = {
          "execution_number": temp_detailed_execution.execution_number,
          "execution_state": execution_status,
          "started_by": executed_by,
          "date_started": formated_date,
          "time_started": formated_time,
          "time_completed": time_completed,
          "scm_details": scm_repo_name,
          "duration": temp_duration,
          "time_comparision": time_comparision
          // "previous_built_comparison": (temp_duration - pre_duration),
        }

        // pre_duration = temp_duration;
        detailedExecutions.push(temp_execution_obj);
      }
      let n = detailedExecutions.length;
      let i;

      for (let i = 0; i < n; i++) {
        if (i != (n - 1)) {
          detailedExecutions[i].previous_built_comparison = (detailedExecutions[i + 1].duration - detailedExecutions[i].duration);
        }
        else {
          detailedExecutions[i].previous_built_comparison = 0;
        }
      }


      return detailedExecutions;

    }
    catch (error) {
      throw new Error(error);
    }
  },
  /**
 * This function gets all executions details for particular pipeline workflow
 * @param {String} pipeline_key
 */
  formatDate: async (date) => {
    let d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  },
  formatTime: async (date) => {
    let d = new Date(date);
    let hours = '' + d.getHours();
    let minutes = '' + d.getMinutes();

    let seconds = '' + d.getSeconds();
    return [hours, minutes, seconds].join(':');
  },
  getPipelineWorkflowExecutionDetails: async (pipeline_key, execution_number) => {
    try {
      let pipe = await pipeline_workflow.aggregate([
        {
          $match: {
            pipeline_key: pipeline_key,
            execution_number: execution_number
          }
        },
        {
          $project: {
            _id: 0,
            pipeline_key: 1,
            pipeline_workflow_ui_data: 1,
            execution_number: 1,
            start_time: 1,
            executed_by: 1,
            updatedAt: 1
          }
        }
      ]);
      return pipe[0];
    }
    catch (error) {
      throw new Error(error);
    }
  },
  /**
 * This function saves pipeline workflow for ui
 * @param {String} pipeline_data
 * @param {String} workflow_data
 */
  savePipelineWorkflow: async (req, pipeline_data, workflow_data) => {
    try {
      let pipe = await savePipelineWorkflowUi(req, pipeline_data, workflow_data);

      let pipeline_key = pipe.pipeline_key;

      return pipeline_key;
    }
    catch (error) {
      throw error;
    }
  },
  /**
 * This function executes pipeline workflow
 * @param {String} pipeline_key
 */
  executePipelineWorkflow: async (pipeline_key, token) => {
    try {
      let pipe = await pipeline.findOneAndUpdate(
        {
          pipeline_key: pipeline_key
        },
        {
          $inc: {
            "execution_number": 1
          }
        },
        {
          upsert: false,
          new: true
        }
      ).lean();

      let converted_data = await convertToXStateWorkflow(pipe.pipeline_key, pipe.pipeline_name, pipe.application_key, pipe.pipeline_workflow_ui_data, pipe.execution_number, pipe.continuous_integration.instance_details.instance_name, pipe.continuous_integration.instance_details.agent_name, token);

      let msg = await startPipelineWorkflow(converted_data.pipeline_machine_workflow, converted_data.actions, pipe.execution_number);

      return {
        msg: msg,
        application_key: pipe.application_key,
        execution_number: pipe.execution_number
      };
    }
    catch (error) {
      throw error;
    }
  },
  /**
   * This function saves the data to workflow_master_task
   * @param {Object} master_data
   */
  saveMasterTaskData: async (master_data) => {
    try {
      await workflow_master_task.create(master_data);
      return "success";
    }
    catch (error) {
      throw error;
    }

  },
  /**
 * This function returns all the task names from workflow_master_task
 *
 */
  getAllTaskNames: async () => {
    try {
      //let task_list = await workflow_master_task.find({}).lean();
      let tasks = [];
      tasks.push({
        task_name: "Select Option",
        task_key: "Select Option",
        create_project_required: false,
        tool_name: ""
      })
      let task_list = await workflow_master_task.find({}, { task_name: 1, task_key: 1, _id: 0, tool_name: 1, create_project_required: 1 }).lean();
      for await (let project of task_list) {
        let temp_object = {
          task_name: project.task_name,
          task_key: project.task_key,
          create_project_required: project.create_project_required,
          tool_name: project.tool_name
        };
        tasks.push(temp_object);
      }
      return tasks;
    }
    catch (error) {
      throw error;
    }
  },
  /**
 * This function returns the list of all task conditions associated with the send task_key from workflow_master_task
 * @param {String} task_key
 * @param {String} application_key
 */
  getAllConditionList: async (task_name, application_key) => {
    try {
      let condition_list = [];
      condition_list.push({
        field_key: "Select Option",
        field_display_label: "Select Option",
        field_type: "select"
      })
      let condition = await workflow_master_task.find({ task_name: task_name }, {
        _id: 0,
        'task_conditions.field_key': 1, 'task_conditions.field_display_label': 1, 'task_conditions.field_type': 1
      }).lean();
      for await (let cond of condition[0].task_conditions) {
        let temp_object = {
          field_key: cond.field_key,
          field_display_label: cond.field_display_label,
          field_type: cond.field_type
        };
        condition_list.push(temp_object);
      }
      return condition_list;
    }
    catch (error) {
      throw error;
    }
  },
  get_eks_clusters: async () => {
    try {
      let eks_clusters = await aws_eks_cluster.get_clusters();
      return eks_clusters.clusters;
    }
    catch (err) {
      throw new Error(err.message)
    }
  },

  /**
 * This function creates and starts the pipeline workflow
 * @param {String} application_key
 */
  createProjectInTool: async (tool_obj) => {
    try {
      let auth_token
      let pipeline_key, tool_details, creation_status, project_details = [];
      try {
        pipeline_key = await generate_pipeline_key.generatePipelineKey();
      }
      catch (error) {
        throw error;
      }
      tool_obj['pipeline_key'] = pipeline_key;
      try {
        tool_details = await tool.findOne({ tool_instance_name: tool_obj.tool_instance_name, application_key: tool_obj.application_key }).lean();
      }
      catch (error) {
        throw error;
      }
      tool_obj['tool_name'] = tool_details.tool_name;
      let tool_url = tool_details.tool_url;

      let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
        tool_obj.application_key
      );


      if (vault_config_status == true) {
        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
          tool_obj.application_key,
          tool_details.tool_category,
          tool_obj.tool_name,
          tool_obj.instance_name
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

          if (tool_details.tool_name == "GitLab") {
            let token = tool_details.tool_auth.auth_token;
            let pretoken = token.split(":");
            auth_token = pretoken[1];

          }
          else {
            auth_token = tool_details.tool_auth.auth_token;
          }
        }
      }

      let tool_name = tool_details.tool_name.toUpperCase();

      switch (tool_name) {
        case 'QUALYS':

          creation_status = await qualys_create.create_qualys_project(tool_obj, tool_url, auth_token, tool_details);

          project_details = await existing_dast_projects.aggregate([
            {
              "$match": {
                tool_id: tool_details._id
              }
            },
            {
              $project: {
                _id: 0,
                project_name: "$dast_project_name",
                project_key: "$dast_project_name"
              }
            }
          ]);

          break;
        case 'BITBUCKET':
          creation_status = await bitbucket_create.create_bitbucket_project(tool_obj, tool_url, auth_token);
          let repo_url = await bitbucket_create.create_bitbucket_repo(tool_obj, tool_url, auth_token);
          await bitbucket_create.create_bitbucket_repo_webhook(tool_obj, tool_url, auth_token);

          // if (creation_status == "success") {
          //   try {
          //     //await sync_tool_projects(tool_obj.application_key, "Source Control", tool_obj.tool_instance_name);
          //     // let temp_obj = {
          //     //   "scm_tool": "Bitbucket",
          //     //   "scm_project_key": pipeline_key,
          //     //   "scm_project_type": "NORMAL",
          //     //   "scm_project_name": tool_obj.project_name,
          //     //   "scm_project_self": tool_url + "/projects/" + pipeline_key,
          //     //   "tool_id": tool_details._id,
          //     //   "repos": [{
          //     //     "scm_repo_name": tool_obj.repository_name,
          //     //     "scm_repo_self": repo_url,
          //     //     "branches": [{
          //     //       "scm_branch_id": "refs/heads/master",
          //     //       "scm_branch_display_id": "master"
          //     //     }]
          //     //   }]
          //     // };
          //     // await existing_scm_projects.create(temp_obj);
          //     // project_details = await existing_scm_projects.aggregate([
          //     //   {
          //     //     "$match": {
          //     //       tool_id: tool_details._id
          //     //     }
          //     //   },
          //     //   {
          //     //     $project: {
          //     //       _id: 0,
          //     //       project_name: "$scm_project_name",
          //     //       project_key: "$scm_project_key"
          //     //     }
          //     //   }
          //     // ]);
          //   }
          //   catch (error) {
          //     throw new Error(error);
          //   }
          // }
          break;

        case 'AZURE REPOS':
          creation_status = await azurerepos_create.create_azurerepos_project(tool_obj, tool_url, auth_token);
          // let azurerepo_url = await azurerepos_create.create_azurerepos_repo(tool_obj, tool_url, auth_token);
          // await azurerepos_create.create_b_repo_webhook(tool_obj, tool_url, auth_token);
          var tool_detailsa = await tool.findOne({ application_key: tool_obj.application_key, tool_name: "Azure Repos", tool_instance_name: tool_obj.tool_instance_name });
          scm_project = await existing_scm_projects.findOne({ scm_project_id: tool_obj.Organisation_name, tool_id: tool_detailsa._id })
          if (creation_status.statusCode == 201 || 200 || 202) {
            // 
            return "success"
          }
          break;


        case 'GITLAB':
          let updatedrepo;
          if (tool_obj.usernamespace == "yes") {
            creation_status = await gitlab_create.create_gitlab_project(tool_obj, tool_url, auth_token);
          }
          else {
            creation_status = await gitlab_create.create_gitlab_project_in_given_namespace(tool_obj, tool_url, auth_token);
            scm_project = await existing_scm_projects.findOne({ scm_project_id: tool_obj.groupname })
            var scm_project_name = scm_project.scm_project_name;
            updatedrepo = scm_project.repos;
          }

          var tool_detailsb = await tool.findOne({ application_key: tool_obj.application_key, tool_name: "GitLab" });
          var tool_idb = tool_detailsb._id;


          let final_updatedRepo = [];
          if (creation_status.statusCode == 201) {
            try {
              if (tool_obj.usernamespace == "no") {
                for await (let repo of updatedrepo) {
                  final_updatedRepo.push(repo);
                }
              }
              //await sync_tool_projects(tool_obj.application_key, "Source Control", tool_obj.tool_instance_name);

              // await existing_scm_projects.create(temp_obj);

              if (tool_obj.usernamespace == "yes") {
                // await existing_scm_projects.findOneAndUpdate(
                //   { scm_project_key: creation_status.body.namespace.id },
                //   {
                //     $push: {
                //       "repos": {
                //         "scm_repo_id": creation_status.body.id,
                //         "scm_repo_name": creation_status.body.name,
                //         "branches": {
                //           "scm_branch_id": "refs/heads/master",
                //           "scm_branch_display_id": "master"
                //         }
                //       }
                //     },
                //   }
                // );

                return "success"

              }
              else {
                // await existing_scm_projects.findOneAndUpdate(
                //   {
                //     tool_id: tool_idb,
                //     scm_project_key: tool_obj.groupname

                //   },
                //   {
                //     $push: {
                //       "repos": {
                //         "scm_repo_id": creation_status.body.id,
                //         "scm_repo_name": creation_status.body.name,
                //         "branches": {
                //           "scm_branch_id": "refs/heads/master",
                //           "scm_branch_display_id": "master"
                //         }
                //       }
                //     },
                //   }
                // );

                return "success"
              }
            }
            catch (error) {
              throw new Error(error);
            }
          }
          else {
            return "you are not allowed to create project in the selected group try to create in another group"
          }
          break;


        case 'SONARQUBE':
          creation_status = await sonarqube_create.create_sonarqube_project(tool_obj, tool_url, auth_token);
          await sonarqube_create.create_sonarqube_project_webhook(tool_obj, tool_url, auth_token);

          if (creation_status == "success") {
            try {
              //await sync_tool_projects(tool_obj.application_key, "Code Analysis", tool_obj.tool_instance_name);
              let temp_obj = {
                "code_analysis_project_key": pipeline_key,
                "code_analysis_project_name": tool_obj.project_name,
                "tool_id": tool_details._id,
                "code_analysis_tool": "Sonarqube",
                project_url: tool_details.tool_url.concat("/dashboard?id=").concat(pipeline_key)
              };
              await existing_code_analysis_projects.create(temp_obj);
              project_details = await existing_code_analysis_projects.aggregate([
                {
                  "$match": {
                    tool_id: tool_details._id
                  }
                },
                {
                  $project: {
                    _id: 0,
                    project_name: "$code_analysis_project_name",
                    project_key: "$code_analysis_project_key"
                  }
                }
              ]);
            }
            catch (error) {
              throw new Error(error);
            }
          }
          break;
        case 'JIRA':
          let project_data = await jira_create.create_jira_project_and_get_id(tool_obj, tool_url, auth_token);
          await jira_create.create_jira_project_webhook(tool_obj, tool_url, auth_token);
          if (project_data.status == "success") {
            try {

              //await sync_tool_projects(tool_obj.application_key, "Code Analysis", tool_obj.tool_instance_name);
              let temp_obj = {
                "planning_project_id": project_data.id,
                "planning_project_key": pipeline_key,
                "planning_project_name": tool_obj.project_name,
                "tool_id": tool_details._id,
                "planning_tool": "Jira",
                planning_self: tool_details.tool_url.concat("/rest/api/2/project/").concat(project_data.id)
              };
              await existing_planning_projects.create(temp_obj);
              project_details = await existing_planning_projects.aggregate([
                {
                  "$match": {
                    tool_id: tool_details._id
                  }
                },
                {
                  $project: {
                    _id: 0,
                    project_name: "$planning_project_name",
                    project_key: "$planning_project_key"
                  }
                }
              ]);
            }
            catch (error) {
              throw new Error(error);
            }
          }
          break;
      }
      project_details.unshift({
        project_name: "Select Option",
        project_key: "Select Option"
      });
      return project_details;
    }
    catch (error) {

      throw error;
    }
  },
  /**
 * This function creates and starts the pipeline workflow
 * @param {String} application_key
 */
  createWorkflow: async (workflow_data) => {
    try {
      let pipeline_key;
      try {
        pipeline_key = await generate_pipeline_key.generatePipelineKey();
      }
      catch (error) {
        throw error;
      }

      let machine_id;
      try {
        machine_id = await generate_key.generateKey(pipeline_key);
      }
      catch (error) {
        throw error;
      }

      let pipeline_machine_workflow = {
        id: machine_id,
        pipeline_key: pipeline_key,
        execution_number: 1,
        initial: "create_pipeline",
        context: {
          pipeline_key: pipeline_key,
          machine_id: machine_id,
          create_jira_server_project: {
            status: "READY",
            data: workflow_data.create_jira_server_project,
            links: []//if no links to another node keep empty
          },
          create_bitbucket_server_project: {
            status: "READY",
            data: workflow_data.create_bitbucket_server_project,
            links: [// if all conditions fail and no link gets executed & if no links to another node keep empty
              {
                destination: "OnboardPipeline",
                conditions: [{
                  field_key: "status",
                  field_display_label: "Status Code",
                  field_type: "textBox",
                  field_value: 200
                }]
              }
            ]
          },
          create_sonarqube_project: {
            status: "READY",
            data: workflow_data.create_sonarqube_project,
            links: []//if no links to another node keep empty
          },
          create_jenkins_job: {
            status: "READY",
            data: workflow_data.create_jenkins_job,
            links: []//if no links to another node keep empty
          },
          create_pipeline: {
            status: "READY",
            data: workflow_data.create_pipeline,
            links: [// if all conditions fail and no link gets executed
              {
                destination: "OnboardPipeline",
                conditions: [{
                  field_key: "status",
                  field_display_label: "Status Code",
                  field_type: "textBox",
                  field_value: 200
                }]
              }
            ]
          },
          sonarqube_code_analysis_scan_email_approval: {
            status: "READY",
            task_name: "sonarqube_code_analysis_scan_email_approval",
            data: workflow_data.sonarqube_code_analysis_scan_email_approval,
            links: [// if all conditions fail and no link gets executed
              {
                destination: "create_sonarqube_project",
                conditions: [{
                  field_key: "status",
                  field_display_label: "Status Code",
                  field_value: 200
                },
                {
                  field_key: "approval_response",
                  field_display_label: "Approval Response",
                  field_value: "true"
                }],
              },
              {
                destination: "create_sonar_2",
                conditions: [{
                  field_key: "status",
                  field_display_label: "Status Code",
                  field_type: "textBox",
                  field_value: 200
                }, {
                  field_key: "repo.url",
                  field_display_label: "Repository Path",
                  field_type: "textBox",
                  field_value: "/projects/PL/repos/paasify_springboot/browse"
                },
                {
                  field_key: "approval_response",
                  field_display_label: "Approval Response",
                  field_type: "textBox",
                  field_value: "false"
                }],
              },
              {
                destination: "stop",
                conditions: [{
                  field_key: "status",
                  field_display_label: "Status Code",
                  field_type: "textBox",
                  field_value: 500
                }],
              }
            ]
          }
        },
        states: {
          create_pipeline: {
            type: 'atomic',
            entry: ["create_pipeline"],
            id: "create_pipeline",
            on: {
              OnboardPipeline: {
                target: 'OnboardPipeline'
              },
              fail_state: {
                target: "#fail_state",
                internal: false
              }
            }
          },
          OnboardPipeline: {
            type: 'parallel',
            states: {
              create_jira_server_project: {
                type: "atomic",
                id: "create_jira_server_project",
                entry: ["create_jira_server_project"],
                on: {
                  fail_state: {
                    target: "#fail_state",
                    internal: false
                  }
                }
              },
              create_bitbucket_server_project: {
                type: "atomic",
                id: "create_bitbucket_server_project",
                entry: ["create_bitbucket_server_project"],
                on: {
                  fail_state: {
                    target: "#fail_state",
                    internal: false
                  }
                }
              },
              CodeAnalysis: {
                type: 'compound',
                initial: 'sonarqube_code_analysis_scan_email_approval',
                states: {
                  sonarqube_code_analysis_scan_email_approval: {
                    type: "atomic",
                    id: "sonarqube_code_analysis_scan_email_approval",
                    entry: ["sonarqube_code_analysis_scan_email_approval"],
                    on: {
                      create_sonarqube_project: {
                        target: "create_sonarqube_project"
                      },
                      fail_state: {
                        target: "#fail_state",
                        internal: false
                      }
                    }
                  },
                  create_sonarqube_project: {
                    id: "create_sonarqube_project",
                    entry: ["create_sonarqube_project"],
                    on: {
                      fail_state: {
                        target: "#fail_state",
                        internal: false
                      }
                    }
                  }
                },
                on: {
                  fail_state: {
                    target: "#fail_state",
                    internal: false
                  }
                }
              },
              create_jenkins_job: {
                type: "atomic",
                id: "create_jenkins_job",
                entry: ["create_jenkins_job"],
                on: {
                  fail_state: {
                    target: "#fail_state",
                    internal: false
                  }
                }
              }
            }
          },
          fail_state: {
            type: 'final',
            id: "fail_state",
            on: {}
          }
        }
      };

      let actions = ["create_pipeline", "create_jira_server_project", "create_bitbucket_server_project", "sonarqube_code_analysis_scan_email_approval", "create_sonarqube_project", "create_jenkins_job"];
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
      //   action_and_guards.guards[guards[i]] = all_actions_guards.guards_list[guards[i]];
      //   i++;
      // }



      await pipeline_workflow.create({
        pipeline_key: pipeline_key,
        machine_id: machine_id,
        pipeline_workflow_xstate_data: pipeline_machine_workflow
      });

      // Edit your machine(s) here
      const machine = XState.Machine(pipeline_machine_workflow,
        action_and_guards);

      // Edit your service(s) here
      const service = XState.interpret(machine).onTransition(async (state) => {
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
            upsert: true,
            new: true
          }).lean();
      });

      service.start();    // on Plan
      service.stop();
    }
    catch (error) {
      throw error;
    }

  },


  /**
 * This function updates workflow progress with sonar project approval
 * @param {String} pipeline_key
 * @param {String} machine_id
 * @param {String} response
 */
  sonarqubeScanApprovalResponse: async (pipeline_key, machine_id, task_field, task_api_response) => {
    try {
      let task_status = task_api_response.approval_response.toUpperCase() == "APPROVED" ? "COMPLETE" : "FAILED";
      workflow_tasks.saveStateAndProceed(pipeline_key, machine_id, task_field, task_status, task_api_response);
    }
    catch (error) {
      throw error;
    }
  },
  /**
* This function return a list of fields based on the given task_name and also sends the tool instances based on the task_name and application_key
* @param {String} application_key
*  @param {String} task_name
*/
  getToolInstance: async (task_name, application_key) => {

    let tool_name = "", tool_instance_name = ["Select Option"];

    try {

      let task_details = await workflow_master_task.aggregate([
        {
          $match:
          {
            task_name: task_name
          }
        },
        {
          $unwind: `$task_fields`
        }
        ,
        { $sort: { 'task_fields.id': 1 } }
        ,
        {
          $project: {
            '_id': 0,
            'options': '$task_fields.options',
            'type': '$task_fields.type',
            'label': '$task_fields.label',
            'id': '$task_fields.id'
          }
        }
      ]);


      // task_details.forEach(element => {
      //   if (element.label == "Tool Name") {
      //     tool_name = element.options[0];
      //   }
      // });
      for (let element of task_details) {
        if (element.label == "Tool Name") {
          tool_name = element.options[0];
        }
      }

      let tool_instance = await tool.find({ 'tool_name': tool_name, 'application_key': application_key }, { "_id": 0, "tool_instance_name": 1 }).lean();
      for await (let toold of tool_instance) {
        tool_instance_name.push(toold.tool_instance_name);
      }

      task_details.filter((element, index) => {
        if (element.label == "Tool Instance Name") {
          task_details[index].options = tool_instance_name;

        }
      })
      // for(let element of task_details){
      //      if (element.label == "Tool Instance Name") {
      //     task_details[index].options = tool_instance_name;

      //   }

      // }
      return task_details;

    }
    catch (error) {

      throw error;
    }
  },
  /**
* This function return a list of ci instance names based on application_key from tool table
* @param {String} application_key
*/
  getCiInstanceNames: async (application_key) => {
    let ci_tool_instance_name = ["Select Option"];
    let ci_tool_instance = await tool.find({ 'tool_name': "Jenkins", 'application_key': application_key }, { tool_instance_name: 1, _id: 0 }).lean();
    for await (let ci_tool of ci_tool_instance) {
      ci_tool_instance_name.push(ci_tool.tool_instance_name);
    }
    return ci_tool_instance_name;
  },
  /**
* This function return a list of agent names based on ci instance name
* @param {String} tool_instance_name
* @param {String} application_key
*/
  getCIAgentNames: async (tool_instance_name, application_key) => {
    try {
      var toolDetails = await tool.findOne({ tool_instance_name, application_key }, { tool_url: 1, tool_category: 1, tool_name: 1, tool_auth: 1, proxy_required: 1 });
      if (!toolDetails) {
        return null;
      }
      let jenkins_auth_token
      let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
        application_key
      );


      if (vault_config_status == true) {
        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
          application_key,
          toolDetails.tool_category,
          toolDetails.tool_name,
          tool_instance_name
        );
        if (vault_configuration.auth_type == "password") {

          jenkins_auth_token = new Buffer.from(
            vault_configuration.auth_username + ':' +
            vault_configuration.auth_password
          ).toString('base64');

        } else {
          jenkins_auth_token = vault_configuration.auth_token;
        }
      }
      else {
        if (toolDetails.tool_auth.auth_type == 'password') {

          jenkins_auth_token = new Buffer.from(
            toolDetails.tool_auth.auth_username + ':' +
            toolDetails.tool_auth.auth_password
          ).toString('base64');

        } else {
          jenkins_auth_token = toolDetails.tool_auth.auth_token;
        }
      }
      var HTTPRequestOptions = {
        requestMethod: 'GET',
        basicAuthToken: jenkins_auth_token,
        proxyFlag: toolDetails.proxy_required,
        reqToken: false,
        urlSuffix: ""
      }
      var jenkins_url = toolDetails.tool_url + "/computer/api/json";

      try {
        var fetched_results = await HTTPRequest.make_request(encodeURI(jenkins_url),
          HTTPRequestOptions.requestMethod,
          HTTPRequestOptions.basicAuthToken,
          HTTPRequestOptions.proxyFlag
        );
      }
      catch (error) {
        return null;
      }

      return (fetched_results.body.computer.map(m => m.displayName));
    }
    catch (error) {
      console.log(error);
    }

    // return ["Select Option", "sonar_agent", "jnjappnode", "node_139"];
    // return ["Select Option", "Clarios-Build-Agent-Windows", "new-jenkins", "windows-agent", "sonar", "canvasSlave"];//,"windows-agent"
  },
  /**
* This function return a list of projects based on the given tool_instance_name application_key from the existing_project of all tools
* @param {String} application_key
*  @param {String} tool_instance_name
*/
  getProjectList: async (tool_instance_name, application_key, tool_name) => {
    try {
      let tool_id = await tool.findOne({ tool_instance_name: tool_instance_name, application_key: application_key, tool_name: tool_name }, { _id: 1 }).lean();

      if (tool_name == 'Bitbucket') {
        // let fetched_projects = await existing_scm_projects.find({ 'tool_id': tool_id._id }, { 'scm_project_name': 1, '_id': 0, 'scm_project_key': 1 });
        let fetched_projects = await settings_service.getAllProjects(application_key, tool_name, tool_instance_name)
        let projects = [];
        projects.push({
          project_name: "Select Option",
          project_key: "Select Option",
          project_url: ""
        })
        for await (let project of fetched_projects) {
          let temp_object = {
            project_name: project.name,
            project_key: project.key,
            project_url: project.url
          };
          projects.push(temp_object);
        }
        return projects;
      }
      if (tool_name == 'GitLab') {
        let fetched_projects = await settings_service.getAllProjects(application_key, tool_name, tool_instance_name)
        // let fetched_projects = await existing_scm_projects.find({ 'tool_id': tool_id._id }, { 'scm_project_name': 1, '_id': 0, 'scm_project_key': 1 });
        let projects = [];
        projects.push({
          project_name: "Select Option",
          project_key: "Select Option",
          project_url: ""
        })
        for await (let project of fetched_projects) {
          let temp_object = {
            project_name: project.name,
            project_key: project.key,
            project_url: project.url
          };
          projects.push(temp_object);
        }
        return projects;
      }
      if (tool_name == 'Jira') {
        let fetched_projects = await existing_planning_projects.find({ 'tool_id': tool_id._id }, { 'planning_project_key': 1, 'planning_project_name': 1, 'planning_project_id': 1, '_id': 0 });
        let projects = [];
        projects.push({
          project_name: "Select Option",
          project_key: "Select Option"
        })
        for await (let project of fetched_projects) {
          let temp_object = {
            project_name: project.planning_project_name,
            project_key: project.planning_project_key
          }
          projects.push(temp_object);
        }
        return projects;
      }
      if (tool_name == 'Sonarqube') {
        // let fetched_projects = await existing_code_analysis_projects.find({ 'tool_id': tool_id._id }, { 'code_analysis_project_key': 1, 'code_analysis_project_name': 1, '_id': 0 });
        // let projects = [];
        // projects.push({
        //   project_name: "Select Option",
        //   project_key: "Select Option"
        // })
        // for await (let project of fetched_projects) {
        //   let temp_object = {
        //     project_name: project.code_analysis_project_name,
        //     project_key: project.code_analysis_project_key
        //   };
        //   projects.push(temp_object);
        // }
        // return projects;
        var fetched_tool = await tool
          .findOne({
            application_key: application_key,
            tool_name: tool_name,
            tool_instance_name: tool_instance_name,
          })
          .lean();
        let caprojects = await sonarqube_sync_projects.fetch_projects(fetched_tool);
        return caprojects.map(elem => {
          return { 'key': elem.key, 'name': elem.name };
        });
      }

      if (tool_name == 'Qualys') {
        // let fetched_projects = await existing_dast_projects.find({ 'tool_id': tool_id._id }, { 'dast_project_key': 1, 'dast_project_name': 1, '_id': 0 });
        // let projects = [];
        // projects.push({
        //   project_name: "Select Option",
        //   project_key: "Select Option"
        // })
        // for await (let project of fetched_projects) {
        //   let temp_object = {
        //     project_name: project.dast_project_name,
        //     project_key: project.dast_project_key
        //   };
        //   projects.push(temp_object);
        // }
        // return projects;
        var fetched_tool = await tool
          .findOne({
            application_key: application_key,
            tool_name: tool_name,
            tool_instance_name: tool_instance_name,
          })
          .lean();
        try {
          var qualys_projects = await qualys_sync_projects.fetch_projects(fetched_tool);
          return qualys_projects.map(elem => {
            return { 'name': elem.name };
          });
        } catch (error) {
          throw error;
        }
      }
      if (tool_name == 'Jenkins') {
        let fetched_projects = await existing_continuous_integration_jobs.find({ 'tool_id': tool_id._id }, { 'ci_project_name': 1, '_id': 0 });
        let projects = [];
        projects.push({
          project_name: "Select Option"
        })
        for await (let project of fetched_projects) {
          let temp_object = {
            project_name: project.ci_project_name
          };
          projects.push(temp_object);
        }
        return projects;
      }
      if (tool_name == 'CodeDx') {
        var fetched_projects = await existing_codedx_projects.find({ 'tool_id': tool_id._id });

        let projects = [];
        let project_id = [];
        projects.push("Select Option");
        project_id.push(-1)
        fetched_projects.filter(project => {

          projects.push(project.project_name);
          project_id.push(project.project_id)

        })
        return { "project_name": projects, "project_ids": project_id };

      }
      else {
        throw new Error("tool name not found");
      }
    }
    catch (error) {
      throw error;
    }
  },
  /**
* This function return a list of repos based on the given scm_project_key from the existing_project of all tools
* @param {String} scm_project_key
*/
  getRepo: async (scm_project_key, tool_instance_name, tool_name, scm_project_name, application_key) => {
    try {
      let repos = [];
      let rep_obj = {
        name: "Select Option",
        id: 0,
        url: ""
      }
      repos.push(rep_obj);
      let reposiories = await settings_service.getAllRepo(application_key, tool_name, tool_instance_name, scm_project_key, scm_project_name)
      var tooldetails = await tool.findOne({ tool_instance_name: tool_instance_name }, { _id: 1 }).lean();
      // let repo_names = await existing_scm_projects.aggregate([
      //   {
      //     $match:
      //     {
      //       scm_project_key: scm_project_key,
      //       tool_id: tooldetails._id
      //     }
      //   },
      //   {
      //     $unwind: `$repos`
      //   },
      //   {
      //     $project: {
      //       'repo_name': '$repos.scm_repo_name',
      //       '_id': 0
      //     }
      //   }
      // ])
      for await (let repod of reposiories) {
        let repo_obj = {
          name: repod.name,
          id: repod.id,
          url: repod.url
        }
        repos.push(repo_obj)
      }
      return repos;
    }
    catch (error) {
      throw error;
    }
  },
  getBranchs: async (repo_id,
    repo_name,
    tool_instance_name,
    tool_name,
    application_key,
    project_name,
    project_key) => {
    let branches = [];
    let br_obj = {
      name: "Select option",
      id: 0
    }
    branches.push(br_obj);
    let branches_received = await settings_service.getAllBranches(application_key,
      // tool_category,
      tool_name,
      tool_instance_name,
      project_key,
      repo_name,
      repo_id,
      project_name);
    // getAllRepo(application_key, tool_name, tool_instance_name, scm_project_key, scm_project_name)
    var tooldetails = await tool.findOne({ tool_instance_name: tool_instance_name }, { _id: 1 }).lean();
    // let repo_names = await existing_scm_projects.aggregate([
    //   {
    //     $match: {
    //       scm_project_key: scm_project_key,
    //       tool_id: tooldetails._id
    //     },
    //   },
    //   {
    //     $unwind: `$repos`,
    //   },
    //   {
    //     $project: {
    //       repo_name: "$repos",
    //       _id: 0,
    //     },
    //   },
    // ]);
    for await (let branch of branches_received) {
      // if (repod.repo_name.scm_repo_name == repo) {
      //   for await (let branch of repod.repo_name.branches) {
      //     branches.push(branch.scm_branch_display_id);
      //   }
      // }
      branches.push(branch);
    }
    return branches;
  },
  getGitlabBranchs: async (scm_project_key, repo) => {
    let branches = [];
    let project = await existing_scm_projects.findOne({ scm_project_name: repo })
    let project_key = project.scm_project_key;
    branches.push("Select Option");
    let repo_names = await existing_scm_projects.aggregate([
      {
        $match: {
          scm_project_key: project_key,
        },
      },
      {
        $unwind: `$repos`,
      },
      {
        $project: {
          repo_name: "$repos",
          _id: 0,
        },
      },
    ]);


    for await (let repod of repo_names) {
      if (repod.repo_name.scm_repo_name == repo) {
        for await (let branch of repod.repo_name.branches) {
          branches.push(branch.scm_branch_display_id);
        }
      }
    }


    return branches;


  },
  getJFrogRepo: async (application_key, tool_instance_name) => {
    try {
      let repos = [];
      repos.push("Select Option");
      let tool_detail = await tool.findOne({ tool_instance_name: tool_instance_name }, { _id: 1 });

      let repo_names = await existing_artifactory_management_repo.aggregate([
        {
          $match:
          {
            application_key: application_key,
            tool_id: tool_detail._id
          }
        },
        {
          $unwind: `$repo_name`
        },
        {
          $project: {
            'repo_name': '$repo_name',
            '_id': 0
          }
        }
      ])
      for await (let repod of repo_names) {
        repos.push(repod.repo_name)
      }
      return repos;
    }
    catch (error) {
      throw error;
    }
  },

  getCodeSecurityProjects: async (url, api_key) => {
    try {

      let project_list = await codeDX_get_project_list.getProjectList(url, api_key)

      project_list = JSON.parse(project_list)

      let projects = [];
      let project_id = [];
      //  projects.push({"id":-1,"name":"Select Option"});
      projects.push("Select Option");
      project_id.push(-1)

      project_list.projects.filter(project => {
        projects.push(project.name);
        project_id.push(project.id)

      })
      return { "project_name": projects, "project_ids": project_id };
    }
    catch (error) {
      throw error;
    }
  },
  getCurrrentPlanningProject: async (application_key, instance_name) => {
    try {
      console.log("app", application_key, instance_name)
      const tool_project = await tool.findOne({ 'application_key': application_key, 'tool_instance_name': instance_name });
      const plan_project = await plan_existing.findOne({ 'tool_id': ObjectId(tool_project._id) })
      return plan_project.planning_project_name;
    }
    catch (error) {
      console.log("error planning",error);
      throw error;
    }
  }
}
/**
    * This function fetches projects from the respective Tool
    * @param {String} application_key
    * @param {String} tool_category
    * @param {String} tool_instance_name
    */
// async function sync_tool_projects(application_key, tool_category, tool_instance_name) {
//   try {
//     let fetched_tool = await tool.findOne({ "application_key": application_key, "tool_category": tool_category, "tool_instance_name": tool_instance_name }).lean();
//     switch (fetched_tool.tool_category) {
//       case "Planning": {
//         switch (fetched_tool.tool_name) {
//           case "Jira": {
//             try {

//               let jira_projects = await jira_sync_projects.fetch_projects(fetched_tool);
//               await existing_planning_projects.deleteMany({ "tool_id": fetched_tool._id });
//               for await (let jira_project of jira_projects) {
//                 let jira_project_object = new existing_planning_projects({
//                   planning_tool: 'Jira',
//                   planning_project_id: jira_project.id,
//                   planning_project_key: jira_project.key,
//                   planning_project_name: jira_project.name,
//                   planning_self: jira_project.self,
//                   tool_id: fetched_tool._id
//                 });
//                 existing_planning_projects.create(jira_project_object);
//               }
//               return ("Projects data fetched successfully");
//             }
//             catch (error) {
//               throw error;
//             }
//             break;
//           }
//         }
//         break;
//       }
//       case "Source Control":
//         {
//           switch (fetched_tool.tool_name) {
//             case "Bitbucket": {
//               try {
//                 let scm_projects = await bitbucket_sync_projects.fetch_projects(fetched_tool);

//                 await existing_scm_projects.deleteMany({ "tool_id": fetched_tool._id });
//                 for await (let scm_project of scm_projects) {
//                   let scm_project_object =
//                     new existing_scm_projects({
//                       scm_tool: 'Bitbucket',
//                       scm_project_id: scm_project.id,
//                       scm_project_key: scm_project.key,
//                       scm_project_type: scm_project.type,
//                       scm_project_name: scm_project.name,
//                       scm_project_self: scm_project.links.self[0].href,
//                       tool_id: fetched_tool._id
//                     });
//                   await existing_scm_projects.create(scm_project_object);
//                   let scm_repos = await bitbucket_sync_projects.fetch_repositories(fetched_tool, scm_project.key);
//                   for await (let scm_repo of scm_repos) {
//                     let scm_repo_object = {
//                       'scm_repo_id': scm_repo.id,
//                       'scm_repo_name': scm_repo.name,
//                       'scm_repo_self': scm_repo.links.self[0].href
//                     };
//                     await existing_scm_projects.updateOne({ 'scm_project_key': scm_project.key },
//                       { $push: { 'repos': scm_repo_object } });
//                     let scm_branches = await bitbucket_sync_projects.fetch_branches(fetched_tool, scm_project.key, scm_repo.name);
//                     for await (let scm_branch of scm_branches) {
//                       let scm_branch_object = {
//                         scm_branch_id: scm_branch.id,
//                         scm_branch_display_id: scm_branch.displayId
//                       };
//                       await existing_scm_projects.updateOne(
//                         { 'scm_project_key': scm_project.key, 'repos.scm_repo_name': scm_repo.name },
//                         {
//                           $push: { "repos.$.branches": scm_branch_object }
//                         });
//                     }
//                   }
//                 }
//                 return ("Projects data fetched successfully");
//               }
//               catch (error) {

//                 throw error;
//               }

//               break;
//             }
//           }
//           break;
//         }

//       case "Continuous Integration": {
//         switch (fetched_tool.tool_name) {
//           case "Jenkins": {
//             try {
//               let jenkins_jobs = await jenkins_sync_projects.fetch_jobs(fetched_tool);
//               await existing_continuous_integration_jobs.deleteMany({ "tool_id": fetched_tool._id });
//               for await (let jenkins_job of jenkins_jobs) {
//                 let ci_job_object = new existing_continuous_integration_jobs({
//                   ci_project_name: jenkins_job.name,
//                   ci_project_url: jenkins_job.url,
//                   tool_id: fetched_tool._id,
//                   ci_tool: 'Jenkins'
//                 });
//                 await existing_continuous_integration_jobs.create(ci_job_object);
//               }
//               return ("Projects data fetched successfully");
//             }
//             catch (error) {
//               throw error;
//             }

//           }


//         }
//         break
//       }
//       case "Continuous Deployment":
//         break
//       case "Code Security":
//         break
//       case "Code Analysis": {
//         switch (fetched_tool.tool_name) {
//           case "Sonarqube": {
//             try {

//               let sonarqube_projects = await sonarqube_sync_projects.fetch_projects(fetched_tool);
//               await existing_code_analysis_projects.deleteMany({ "tool_id": fetched_tool._id });

//               for await (let sonarqube_project of sonarqube_projects) {

//                 let sonarqube_project_object = new existing_code_analysis_projects({
//                   code_analysis_project_id: sonarqube_project.id,
//                   code_analysis_project_key: sonarqube_project.key,
//                   code_analysis_project_name: sonarqube_project.name,
//                   tool_id: fetched_tool._id,
//                   code_analysis_tool: 'Sonarqube'
//                 });
//                 await existing_code_analysis_projects.create(sonarqube_project_object);
//               }
//               return ("Projects data fetched successfully");
//             }
//             catch (error) {

//               throw error;
//             }


//           }
//         }
//         break;
//       }
//       case "Binary Repository":
//         break
//       default:
//         return "Tool Category Not Found";
//     }
//   }
//   catch (error) {
//     throw error;
//   }

// }
async function getPipelineWorkflow(pipeline_key) {
  try {
    let pipe = await pipeline.findOne(
      {
        pipeline_key: pipeline_key
      }
    ).lean();
    return {
      pipeline_name: pipe.pipeline_name,
      pipeline_description: pipe.pipeline_description,
      pipeline_type: pipe.pipeline_type,
      ci_instance_name: pipe.continuous_integration.instance_details.instance_name,
      agent_name: pipe.continuous_integration.instance_details.agent_name,
      pipeline_workflow_data: pipe.pipeline_workflow_ui_data
    };
  }
  catch (error) {
    throw new Error(error);
  }
}
async function savePipelineWorkflowUi(req, pipeline_data, workflow_data) {

  let flag = 0;

  try {

    let pipeline_key = pipeline_data.pipeline_key;
    if (pipeline_key == undefined || pipeline_key == null) {

      flag = 1;
      try {
        pipeline_key = await generate_pipeline_key.generatePipelineKey();
        await save_pipeline_info.save_pipeline_details(pipeline_data, pipeline_key);
      }
      catch (error) {

        throw error;
      }
    }
    let ci_tool_details = await tool.findOne({ tool_instance_name: pipeline_data.ci_instance_name }).lean();
    var id_of_ci = ci_tool_details._id;
    for (let node of workflow_data.nodes) {
      if (node.task.task_key != 'start_node' && node.task.task_key != 'end_node') {
        //var taskkey = node.task.task_key;
        var worktname = await workflow_master_task.findOne({ task_key: node.task.task_key }).lean();
      }
    }
    var toolname = worktname.tool_name;
    var fetched_tool = await tool
      .findOne({
        application_key: pipeline_data.application_key,
        tool_name: "Jenkins",
        tool_instance_name: pipeline_data.ci_instance_name,
      })
      .lean();
    var jenkinsdata = await jenkins_sync_projects.fetch_jobs(fetched_tool);
    if (toolname == 'Sonarqube') {
      var sonardata = process.env.SONAR_WF_JOB;
      for (let project of jenkinsdata) {
        if (project.name == sonardata) {
          let cidatas = await existing_ci.findOneAndUpdate({ tool_id: id_of_ci, ci_project_name: project.name },
            {
              "$set": {
                "ci_project_name": project.name,
                "ci_project_url": project.url,
                "tool_id": ci_tool_details._id,
                "ci_tool": ci_tool_details.tool_name
              }
            },
            { upsert: true, new: true }
          );
        }
      }
    }
    else if (toolname == 'Bitbucket') {
      var bitbuctetdata = process.env.BITBUCKET_CHECKOUT_WF_JOB;
      for (let project of jenkinsdata) {
        if (project.name == bitbuctetdata) {
          let cidatas = await existing_ci.findOneAndUpdate({ tool_id: id_of_ci, ci_project_name: project.name },
            {
              "$set": {
                "ci_project_name": project.name,
                "ci_project_url": project.url,
                "tool_id": ci_tool_details._id,
                "ci_tool": ci_tool_details.tool_name
              }
            },
            { upsert: true, new: true }
          );
        }
      }
    }
    else if (toolname == 'GitLab') {
      var gitlabdata = process.env.GITLAB_CHECKOUT_WF_JOB;
      for (let project of jenkinsdata) {
        if (project.name == gitlabdata) {
          console.log("project.name", project.name);
          let cidatas = await existing_ci.findOneAndUpdate({ tool_id: id_of_ci, ci_project_name: project.name },
            {
              "$set": {
                "ci_project_name": project.name,
                "ci_project_url": project.url,
                "tool_id": ci_tool_details._id,
                "ci_tool": ci_tool_details.tool_name
              }
            },
            { upsert: true, new: true }
          );
          console.log("cidatas", cidatas);
        }
      }
    }
    else if (toolname == 'Qualys') {
      var qualysdata = process.env.QUALYS_ANALYSIS;
      for (let project of jenkinsdata) {
        if (project.name == qualysdata) {
          let cidatas = await existing_ci.findOneAndUpdate({ tool_id: id_of_ci, ci_project_name: project.name },
            {
              "$set": {
                "ci_project_name": project.name,
                "ci_project_url": project.url,
                "tool_id": ci_tool_details._id,
                "ci_tool": ci_tool_details.tool_name
              }
            },
            { upsert: true, new: true }
          );
        }
      }
    }
    let pipeline_details = {
      plan: {
        creation_status: "TO DO",
        configured: false,
        project_url: "",
        tool_project_key: "",
        tool_project_name: "",
        instance_details: {
          tool_name: "",
          instance_name: "",
          instance_id: ""
        }
      },
      scm: {
        creation_status: "TO DO",
        configured: false,
        project_url: "",
        repo_url: "",
        branch_name: "master",
        tool_project_key: "",
        tool_project_name: "",
        scm_type: "git",
        instance_details: {
          tool_name: "",
          instance_name: "",
          instance_id: ""
        }
      },
      code_quality: {
        creation_status: "TO DO",
        configured: false,
        project_url: "",
        tool_project_key: "",
        tool_project_name: "",
        instance_details: {
          tool_name: "",
          instance_name: "",
          instance_id: ""
        }
      }, continuous_integration: {
        creation_status: "SUCCESS",
        configured: true,
        instance_details: {
          tool_name: ci_tool_details.tool_name,
          instance_name: ci_tool_details.tool_instance_name,
          instance_id: ci_tool_details._id,
          agent_name: pipeline_data.agent_name,
          ci_instance_name: pipeline_data.ci_instance_name
        }
      }
    };
    let task_keys = [];
    if (workflow_data.nodes.length > 0) {

      for (let node of workflow_data.nodes) {

        if (node.task['Tool Instance Name'] != undefined || node.task['Tool Instance Name'] != null) {
          let tool_details = await tool.findOne({ tool_instance_name: node.task['Tool Instance Name'] }).lean();

          let existing_project_details;
          switch (tool_details.tool_category.toUpperCase()) {
            case "PLANNING":

              existing_project_details = await existing_planning_projects.findOne({
                tool_id: tool_details._id,
                planning_project_name: node.task['Project Name']
              });

              pipeline_details['plan'] = {
                creation_status: "SUCCESS",
                configured: true,
                project_url: existing_project_details.planning_self,
                tool_project_key: existing_project_details.planning_project_key,
                tool_project_name: existing_project_details.planning_project_name,
                instance_details: {
                  tool_name: tool_details.tool_name,
                  instance_name: tool_details.tool_instance_name,
                  instance_id: tool_details._id
                }
              };
              break;
            case "SOURCE CONTROL":
              let scm_auth_token;
              let repo_url;
              let vault_configuration;
              let vault_config_status;
              let scm_object;
              let projectId;
              try {
                switch (tool_details.tool_name.toUpperCase()) {
                  case "BITBUCKET":
                    try {

                      let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];

                      let tool_request_url = tool_details.tool_url;
                      let project_bitbucket = await settings_service.getAllProjects(
                        tool_details.application_key,
                        // tool_category,
                        tool_details.tool_name,
                        tool_details.tool_instance_name);
                      for await (let proj of project_bitbucket) {
                        if (proj.name == node.task['Project Name']) {
                          var bitbucket_project_id = proj.key;
                          var bitbucket_project_url = proj.url;
                          var bitbucket_project_name = proj.name;

                          let repos_bitbucket = await settings_service.getAllRepo(
                            tool_details.application_key,
                            tool_details.tool_name,
                            tool_details.tool_instance_name,
                            bitbucket_project_id,
                            bitbucket_project_name);

                          for await (let repo of repos_bitbucket) {
                            if (repo.name == node.task['Repository Name']) {
                              var bitbucket_repo_id = repo.id;
                              var bitbucket_reponame = repo.name;
                              var bitbucket_repo_url = repo.url;

                              let branches_bitbucket = await settings_service.getAllBranches(
                                tool_details.application_key,
                                tool_details.tool_name,
                                tool_details.tool_instance_name,
                                bitbucket_project_id,
                                bitbucket_reponame,
                                bitbucket_repo_id,
                                bitbucket_project_name
                              );

                              for await (let branch of branches_bitbucket) {
                                if (branch.name == node.task['Branch Name']) {
                                  var bitbucket_branch_id = branch.id;
                                  var bitbucket_branch_name = branch.name;
                                }
                              }

                            }
                          }
                        }
                      }
                      let repos_object = {
                        scm_repo_id: bitbucket_repo_id,
                        scm_repo_name: bitbucket_reponame,
                        scm_repo_self: bitbucket_repo_url,
                      }
                      let branches_object = {
                        scm_branch_id: bitbucket_branch_id,
                        scm_branch_display_id: bitbucket_branch_name
                      }

                      try {
                        let a = await existing_scm_projects.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: bitbucket_project_id },
                          {
                            "$set": {
                              "scm_tool": tool_details.tool_name,
                              "scm_project_key": bitbucket_project_id,
                              "scm_project_type": "NORMAL",
                              "scm_project_name": bitbucket_project_name,
                              "scm_project_self": bitbucket_project_url,
                              "tool_id": tool_details._id,
                            }
                          },
                          { upsert: true, new: true }
                        );


                        let try1 = await existing_scm_projects.findOne({ tool_id: tool_details._id, scm_project_key: bitbucket_project_id, "repos.scm_repo_name": bitbucket_reponame }).lean();

                        let resp = await existing_scm_projects.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: bitbucket_project_id, "repos.scm_repo_name": { $ne: bitbucket_reponame } },
                          {
                            $push: {
                              repos: repos_object

                            }
                          }

                        );

                        let resp3 = await existing_scm_projects.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: bitbucket_project_id, "repos.scm_repo_name": bitbucket_reponame, "repos.branches.scm_branch_id": { $ne: bitbucket_branch_id } },
                          {
                            $push: {
                              "repos.$.branches": branches_object
                            }
                          }
                        );


                      }
                      catch (error) {

                        throw error;
                      }


                      existing_project_details = await existing_scm_projects.findOne({
                        tool_id: tool_details._id,
                        scm_project_name: node.task['Project Name']
                      });

                      repo_url = await getRepoUrl(node.task['Tool Instance Name'], node.task['Project Name'], node.task['Repository Name']);
                      pipeline_details['scm'] = {
                        creation_status: "SUCCESS",
                        configured: true,
                        project_url: existing_project_details.scm_project_self,
                        repo_url: repo_url,
                        tool_project_key: existing_project_details.scm_project_key,
                        tool_project_name: existing_project_details.scm_project_name,
                        instance_details: {
                          tool_name: tool_details.tool_name,
                          instance_name: tool_details.tool_instance_name,
                          instance_id: tool_details._id
                        }
                      };

                      vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                        tool_details.application_key
                      );


                      if (vault_config_status == true) {
                        vault_configuration = await hashicorp_vault_config.read_tool_secret(
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

                      scm_object = {
                        "repository_name": node.task['Repository Name'],
                        "project_key": existing_project_details.scm_project_key,
                        "branch_name": "master",
                        "project_name": existing_project_details.scm_project_name,
                        "pipeline_key": pipeline_key
                      }

                      let resp = await bitbucket_sync.bitbucketCommitAggregationWorkFlow(scm_object,
                        tool_details.tool_url,
                        scm_auth_token,
                        tool_details.proxy_required,
                        tool_details._id
                      )

                      if (resp == "success") {
                        await onboarding_sync.save_pipeline_scm_data(scm_object, scm_object.project_key, tool_details, bitbucket_repo_url, bb_tool_roles);
                      }
                    }
                    catch (error) {
                      throw error;
                    }

                    break;
                  case "GITLAB":
                    try {
                      let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];

                      let tool_request_url = tool_details.tool_url;
                      let project_gitlab = await settings_service.getAllProjects(
                        tool_details.application_key,
                        // tool_category,
                        tool_details.tool_name,
                        tool_details.tool_instance_name);
                      for await (let proj of project_gitlab) {
                        if (proj.name == node.task['Project Name']) {
                          var gitlab_project_id = proj.key;
                          var gitlab_project_url = proj.url;
                          var gitlab_project_name = proj.name;

                          let repos_gitlab = await settings_service.getAllRepo(
                            tool_details.application_key,
                            tool_details.tool_name,
                            tool_details.tool_instance_name,
                            gitlab_project_id,
                            gitlab_project_name);

                          for await (let repo of repos_gitlab) {
                            if (repo.name == node.task['Repository Name']) {
                              var gitlab_repo_id = repo.id;
                              var gitlab_reponame = repo.name;
                              var gitlab_repo_url = repo.url;

                              let branches_gitlab = await settings_service.getAllBranches(
                                tool_details.application_key,
                                tool_details.tool_name,
                                tool_details.tool_instance_name,
                                gitlab_project_id,
                                gitlab_reponame,
                                gitlab_repo_id,
                                gitlab_project_name
                              );

                              for await (let branch of branches_gitlab) {
                                if (branch.name == node.task['Branch Name']) {
                                  var gitlab_branch_id = branch.id;
                                  var gitlab_branch_name = branch.name;
                                }
                              }

                            }
                          }
                        }
                      }
                      let repos_object = {
                        scm_repo_id: gitlab_repo_id,
                        scm_repo_name: gitlab_reponame,
                        scm_repo_self: gitlab_repo_url,
                      }
                      let branches_object = {
                        scm_branch_id: gitlab_branch_id,
                        scm_branch_display_id: gitlab_branch_name
                      }

                      try {
                        let a = await existing_scm_projects.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: gitlab_project_id },
                          {
                            "$set": {
                              "scm_tool": tool_details.tool_name,
                              "scm_project_key": gitlab_project_id,
                              "scm_project_type": "NORMAL",
                              "scm_project_name": gitlab_project_name,
                              "scm_project_self": gitlab_project_url,
                              "tool_id": tool_details._id,
                            }
                          },
                          { upsert: true, new: true }
                        );


                        let try1 = await existing_scm_projects.findOne({ tool_id: tool_details._id, scm_project_key: gitlab_project_id, "repos.scm_repo_name": gitlab_reponame }).lean();

                        let resp = await existing_scm_projects.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: gitlab_project_id, "repos.scm_repo_name": { $ne: gitlab_reponame } },
                          {
                            $push: {
                              repos: repos_object

                            }
                          }

                        );

                        let resp3 = await existing_scm_projects.findOneAndUpdate({ tool_id: tool_details._id, scm_project_key: gitlab_project_id, "repos.scm_repo_name": gitlab_reponame, "repos.branches.scm_branch_id": { $ne: gitlab_branch_id } },
                          {
                            $push: {
                              "repos.$.branches": branches_object
                            }
                          }
                        );



                      }
                      catch (error) {

                        throw error;
                      }
                      console.log('start2 updates and adding finished ', new Date());

                      existing_project_details = await existing_scm_projects.findOne({
                        tool_id: tool_details._id,
                        scm_project_name: node.task['Project Name']
                      });
                      for (repo of existing_project_details.repos) {
                        if (repo.scm_repo_name == node.task['Repository Name']) {
                          projectId = repo.scm_repo_id;
                        }
                      }
                      repo_url = await getRepoUrl(node.task['Tool Instance Name'], node.task['Project Name'], node.task['Repository Name']);
                      pipeline_details['scm'] = {
                        creation_status: "SUCCESS",
                        configured: true,
                        project_url: existing_project_details.scm_project_self,
                        repo_url: repo_url,
                        tool_project_key: existing_project_details.scm_project_key,
                        tool_project_name: existing_project_details.scm_project_name,
                        instance_details: {
                          tool_name: tool_details.tool_name,
                          instance_name: tool_details.tool_instance_name,
                          instance_id: tool_details._id
                        }
                      };


                      vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                        tool_details.application_key
                      );


                      if (vault_config_status == true) {
                        vault_configuration = await hashicorp_vault_config.read_tool_secret(
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


                      scm_object = {
                        "repository_name": node.task['Repository Name'],
                        "project_key": projectId,
                        "branch_name": node.task['Branch Name'],
                        "project_name": existing_project_details.scm_project_name,
                        "pipeline_key": pipeline_key,
                        "project_repo_url": existing_project_details.scm_project_self
                      }

                      // try {
                      //   var project_data = {
                      //     "project_repo_url": "",
                      //     "project_id": "",
                      //     "project_key": ""
                      //   }
                      //   let project_details = await existing_scm.findOne({ scm_project_name: scm_obj.project_name })
                      //   project_data.project_id = project_details.scm_project_id;
                      //   project_data.project_key = project_details.scm_project_key;

                      //   for (let repo of project_details.repos) {
                      //     if (repo.scm_repo_name == scm_obj.repository_name)
                      //       project_data.project_repo_url = project_details.scm_project_self;
                      //   }
                      //   scm_obj.project_data = project_data;
                      // }
                      // catch (error) {
                      //   logger.error('sync_scm project_details', error);
                      //   throw new Error(error.message);
                      // }
                      // vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                      //   tool_details.application_key
                      // );


                      // if (vault_config_status == true) {
                      //   vault_configuration = await hashicorp_vault_config.read_tool_secret(
                      //     tool_details.application_key,
                      //     tool_details.tool_category,
                      //     tool_details.tool_name,
                      //     tool_details.tool_instance_name
                      //   );
                      //   if (vault_configuration.auth_type == "password") {

                      //     scm_auth_token = new Buffer.from(
                      //       vault_configuration.auth_username + ':' +
                      //       vault_configuration.auth_password
                      //     ).toString('base64');

                      //   } else {
                      //     scm_auth_token = vault_configuration.auth_token;
                      //   }
                      // }
                      // else {
                      //   if (tool_details.tool_auth.auth_type == 'password') {
                      //     scm_auth_token = new Buffer.from(
                      //       tool_details.tool_auth.auth_username + ':' +
                      //       tool_details.tool_auth.auth_password
                      //     ).toString('base64');
                      //   }
                      //   else {
                      //     scm_auth_token = tool_details.tool_auth.auth_token;
                      //   }
                      // }

                      // scm_object = {
                      //   "repository_name": node.task['Repository Name'],
                      //   "project_key": existing_project_details.scm_project_key,
                      //   "branch_name": "master",
                      //   "project_name": existing_project_details.scm_project_name,
                      //   "pipeline_key": pipeline_key
                      // }
                      // let tool_url = tool_details.tool_url;
                      // let scm_proxy_flag = tool_details.proxy_required;
                      // if (scm_obj.is_sync == true) {
                      //   let bb_tool_roles = ['PROJECT_READ', 'PROJECT_WRITE', 'PROJECT_ADMIN'];
                      //   try {
                      //     // await bitbucket_sync.create_bitbucket_repo_webhook(scm_obj, tool_url, scm_auth_token, scm_proxy_flag)

                      let sync_status = await gitlab_sync.gitlabworklowCommitAggregation(scm_object, tool_details.tool_url, scm_auth_token);
                      if (sync_status == "success") {
                        try {

                          let data_update_status = await onboarding_sync.save_pipeline_gitlab_workflow_data(scm_object, scm_object.project_key, tool_details, scm_object.project_repo_url, bb_tool_roles)
                          if (data_update_status == "success") {

                            // await pipeline_dashboard_service.addKPIToDashboard("scm_onbording", scm_object.pipeline_key);
                            // return (scm_object);
                          }


                        }
                        catch (error) {

                          logger.error('sync_scm data_update_status', error);
                          throw new Error(error.message);
                        }
                      }
                      else {

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
              catch (error) {
                logger.error('sync_scm  switch (scm_tool_name)', error);
                throw new Error(error.message);
              }
              break;

            case "CODE ANALYSIS":
              let tool_name = tool_details.tool_name.toUpperCase();
              switch (tool_name) {
                case "SONARQUBE":
                  // existing_project_details = await existing_code_analysis_projects.findOne({
                  //   tool_id: tool_details._id,
                  //   code_analysis_project_name: node.task['Project Name']
                  // });
                  var fetched_tool = await tool
                    .findOne({
                      application_key: tool_details.application_key,
                      tool_name: tool_details.tool_name,
                      tool_instance_name: tool_details.tool_instance_name,
                    })
                    .lean();
                  let caprojects = await sonarqube_sync_projects.fetch_projects(fetched_tool);
                  for (let project of caprojects) {
                    if (project.name == node.task['Project Name']) {
                      var project_name = project.name;
                      var project_key = project.key;
                    }
                  }
                  let ca_obj = {
                    code_analysis_project_name: project_name,
                    code_analysis_project_key: project_key
                  }
                  let custom_ca_data = await existing_code_analysis_projects.findOneAndUpdate({ tool_id: tool_details._id, code_analysis_project_key: ca_obj.code_analysis_project_key },
                    {
                      "$set": {
                        "code_analysis_project_name": ca_obj.code_analysis_project_name,
                        "code_analysis_project_key": ca_obj.code_analysis_project_key,
                        "tool_id": tool_details._id,
                        "code_analysis_tool": tool_details.tool_name
                      }
                    },
                    { upsert: true, new: true }
                  )


                  pipeline_details['code_quality'] = {
                    creation_status: "SUCCESS",
                    configured: true,
                    project_url: tool_details.tool_url.concat("/dashboard?id=").concat(ca_obj.code_analysis_project_key),
                    tool_project_key: ca_obj.code_analysis_project_key,
                    tool_project_name: ca_obj.code_analysis_project_name,
                    instance_details: {
                      tool_name: tool_details.tool_name,
                      instance_name: tool_details.tool_instance_name,
                      instance_id: tool_details._id
                    }
                  };
              }

              break;
            case "DAST":
              let toolName = tool_details.tool_name.toUpperCase();
              switch (toolName) {
                case "QUALYS":
                  // existing_project_details = await existing_dast_projects.findOne({
                  //   tool_id: tool_details._id,
                  //   dast_project_name: node.task['Project Name']
                  // });

                  var fetched_tool = await tool
                    .findOne({
                      application_key: tool_details.application_key,
                      tool_name: tool_details.tool_name,
                      tool_instance_name: tool_details.tool_instance_name,
                    })
                    .lean();

                  var qualys_projects = await qualys_sync_projects.fetch_projects(fetched_tool);

                  for (let project of qualys_projects) {
                    if (project.name == node.task['Project Name']) {
                      var project_name = project.name[0];
                      var project_key = project.id[0];

                    }
                  }
                  let qualys_obj = {
                    qualys_project_name: project_name,
                    qualys_project_key: project_key
                  }
                  let custom_qualys_data = await existing_dast_projects.findOneAndUpdate(
                    {
                      dast_tool: tool_details.tool_name,
                      dast_project_key: qualys_obj.qualys_project_key,
                      dast_project_name: qualys_obj.qualys_project_name
                    },
                    {
                      "$set": {
                        "dast_project_id": qualys_obj.qualys_project_key,
                        "dast_project_key": qualys_obj.qualys_project_key,
                        "dast_project_name": qualys_obj.qualys_project_name,
                        "tool_id": tool_details._id,
                        "dast_tool": tool_details.tool_name
                      }
                    },
                    { upsert: true, new: true }
                  )

                  pipeline_details['code_quality'] = {
                    creation_status: "SUCCESS",
                    configured: true,
                    project_url: tool_details.tool_url.concat("/dashboard?id=").concat(qualys_obj.qualys_project_key),
                    tool_project_key: qualys_obj.qualys_project_key,
                    tool_project_name: qualys_obj.qualys_project_name,
                    instance_details: {
                      tool_name: tool_details.tool_name,
                      instance_name: tool_details.tool_instance_name,
                      instance_id: tool_details._id
                    }
                  };
                  if (true) {

                  }
              }

              break;

            case "ITSM":



              break;
          }
        }


        task_keys.push(node.task.task_key)

      }

    }
    let pipe = await pipeline.findOneAndUpdate(
      {
        pipeline_key: pipeline_key
      },
      {
        $set: {
          pipeline_workflow_ui_data: workflow_data,
          plan: pipeline_details.plan,
          scm: pipeline_details.scm,
          code_quality: pipeline_details.code_quality,
          continuous_integration: pipeline_details.continuous_integration
        }
      },
      {
        upsert: true,
        new: true
      }
    ).lean();
    await pipeline.findOneAndUpdate(
      { pipeline_key: pipeline_key },
      {
        $set: {
          "dashboard_available_component": []
        }
      }
    )
    let pipeline_dashboard_ids = await workflow_master_task.find({ task_key: task_keys }, { "_id": 0, "task_dashboard_components": 1 })

    pipeline_dashboard_ids = pipeline_dashboard_ids.map(x => {
      return x.task_dashboard_components;
    })


    pipeline_dashboard_ids = Array.prototype.concat(...pipeline_dashboard_ids);
    await pipeline.findOneAndUpdate(
      { pipeline_key: pipeline_key },
      {
        $addToSet: {
          "dashboard_available_component": pipeline_dashboard_ids
        }
      }
    )
    if (flag == 1) {
      await activity_logger.logActivity(
        pipeline_data.application_key,
        pipeline_key,
        "Pipeline workflow saved",
        req.headers["authorization"]
      );
    }
    else {
      await activity_logger.logActivity(
        pipeline_data.application_key,
        pipeline_key,
        "Pipeline workflow edited successfully",
        req.headers["authorization"]
      );
    }
    console.log("after all tasks complete returning key ", new Date());

    return { pipeline_key: pipeline_key, execution_number: pipe.execution_number };

  }
  catch (error) {

    throw error;
  }

}

async function getRepoUrl(tool_instance_name, project_name, repo_name) {

  try {
    let tool_details = await tool.findOne({ tool_instance_name: tool_instance_name }).lean();
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

async function startPipelineWorkflow(pipeline_machine_workflow, actions, execution_number) {

  try {
    let action_and_guards = {
      actions: actions
    };


    let i = 0;
    while (i < actions.length) {
      action_and_guards.actions[actions[i]] = all_actions_guards.actions_list[actions[i]];
      i++;
    }

    // Edit your machine(s) here
    const machine = XState.Machine(pipeline_machine_workflow,
      action_and_guards);

    // Edit your service(s) here
    const service = XState.interpret(machine).onTransition(async (state) => {

      await pipeline_workflow.findOneAndUpdate(
        {
          pipeline_key: pipeline_machine_workflow.pipeline_key,
          machine_id: pipeline_machine_workflow.id,
        },
        {
          $set: {
            workflow_progress_data: JSON.stringify(state),
            execution_number: execution_number,

          }
        },
        {
          upsert: true
        }).lean();
    });

    service.start();

    await pipeline_workflow.findOneAndUpdate(
      {
        pipeline_key: pipeline_machine_workflow.pipeline_key,
        machine_id: pipeline_machine_workflow.id
      },
      {
        $set: {
          start_time: new Date()
        }
      },
      {
        upsert: true
      }).lean();
    service.stop();

    return "SUCCESS";
  } catch (error) {
    throw error;
  }
}

async function convertToXStateWorkflow(pipeline_key, pipeline_name, application_key, workflow_data, execution_number, ci_instance_name, agent_name, token) {
  try {

    let machine_id;
    try {
      machine_id = await generate_key.generateKey(pipeline_key);
    }
    catch (error) {
      throw error;
    }

    //**************get start nodes and final nodes*******************
    function getNodeIdsAndTaskName(node) {
      return { id: node.id, task_key: node.task.task_key };
    }

    function getTargetNodeIdsFromLinks(link) {
      return link.target;
    }

    function getSourceNodeIdsFromLinks(link) {
      return link.source;
    }

    function generateXstateNames(node) {
      return node.task_key.concat("_").concat(node.id);
    }
    let node_ids_task_names = workflow_data.nodes.map(getNodeIdsAndTaskName);

    let target_node_ids = workflow_data.links.map(getTargetNodeIdsFromLinks);

    let source_node_ids = workflow_data.links.map(getSourceNodeIdsFromLinks);

    let start_nodes = node_ids_task_names.filter(node => !target_node_ids.includes(node.id));// assuming only one start node is there(but kept it as array for future)
    let initial_node = start_nodes[0].task_key.concat("_").concat(start_nodes[0].id);

    let final_nodes = node_ids_task_names.filter(node => !source_node_ids.includes(node.id));// assuming only one start node is there(but kept it as array for future)
    let final_nodes_xstate = final_nodes.map(generateXstateNames);

    let pipeline_machine_workflow = {
      id: machine_id,
      pipeline_key: pipeline_key,
      execution_number: execution_number,
      initial: initial_node,
      context: {
        pipeline_key: pipeline_key,
        machine_id: machine_id,
        execution_number: execution_number,
        checkout_path: "",
        start_node: initial_node,
        final_nodes: final_nodes_xstate
      },
      states: {
        fail_state: {
          type: 'atomic',
          id: "fail_state",
          on: {}
        }
      }
    };
    //*********************************

    //************generate context of Xstate so every task can get necessary data to do their tasks*************

    if (workflow_data.nodes.length > 0) {
      workflow_data.nodes.filter((node, index) => {
        let source_node_name = node.task.task_key.concat("_").concat(node.id);
        workflow_data.nodes[index]['status'] = "READY";
        pipeline_machine_workflow.context[source_node_name] = {
          status: "READY",
          data: node.task,
          task_name: node.task.task_key,
          links: [],
          source_nodes: [],  //array of nodes that have this node as target
          target_nodes: []  //array of nodes that this node can reach
        };
        pipeline_machine_workflow.context[source_node_name]['data']['ci_instance_name'] = ci_instance_name;
        pipeline_machine_workflow.context[source_node_name]['data']['agent_name'] = agent_name;
        pipeline_machine_workflow.context[source_node_name]['data']['application_key'] = application_key;
        pipeline_machine_workflow.context[source_node_name]['data']['pipeline_name'] = pipeline_name;

        pipeline_machine_workflow.states[source_node_name] = {
          type: 'atomic',
          entry: [node.task.task_key], //task_name
          id: node.task.task_key,  //task_name
          on: {
            fail_state: { //add default fail_state node to every node/task
              target: "#fail_state",
              internal: false
            }
          }  //links to next nodes
        };
      });
    }

    if (workflow_data.links.length > 0) {
      workflow_data.links.filter(link => {
        let destination_node_name, source_node_name, conditions = [];
        let destination_node = node_ids_task_names.filter(node => node.id == link.target);
        destination_node_name = destination_node[0].task_key.concat("_").concat(destination_node[0].id);
        let source_node = node_ids_task_names.filter(node => node.id == link.source);
        source_node_name = source_node[0].task_key.concat("_").concat(source_node[0].id);
        pipeline_machine_workflow.states[source_node_name].on[destination_node_name] = {
          target: destination_node_name
        };
        if (link.conditions.length > 0) {
          // link.conditions.forEach(condition => {
          //   let condition_label = Object.keys(condition)[0];
          //   conditions.push({
          //     field_display_label: condition_label,
          //     field_value: condition[condition_label]
          //   });
          // });
          for (let condition of link.conditions) {
            let condition_label = Object.keys(condition)[0];
            conditions.push({
              field_display_label: condition_label,
              field_value: condition[condition_label]
            });

          }
        }
        pipeline_machine_workflow.context[source_node_name].target_nodes.push(destination_node_name);
        pipeline_machine_workflow.context[destination_node_name].source_nodes.push(source_node_name);
        pipeline_machine_workflow.context[source_node_name].links.push({
          destination: destination_node_name,
          conditions: conditions
        });
      });
    }

    function getActions(node) {
      return node.task.task_key;
    }
    let actions = workflow_data.nodes.map(getActions);

    //******************************
    let decoded = jwt.verify(token, process.env.SECRET_KEY);

    await pipeline_workflow.findOneAndUpdate(
      {
        pipeline_key: pipeline_key,
        execution_number: execution_number
      },
      {
        $set: {
          pipeline_workflow_xstate_data: pipeline_machine_workflow,
          pipeline_workflow_ui_data: workflow_data,
          machine_id: machine_id,
          actions: actions,
          executed_by: decoded.User
        }
      },
      {
        upsert: true
      }
    ).lean();

    return {
      pipeline_machine_workflow,
      actions
    };
  }
  catch (error) {

    throw error;
  }

  


}








