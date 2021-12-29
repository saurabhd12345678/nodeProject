var planning_data = require('../../models/planning_data');
var sprintModel = require('../../models/sprint');
var toolModel = require('../../models/tool');
var token_method = require("../../service_helpers/verify_token");
var activity_logger = require("../../service_helpers/common/activity_logger")
var generate_pipeline_key = require('../../service_helpers/common/generate_pipeline_key');
var save_pipeline_info = require('../../service_helpers/common/save_pipeline_info');
var pipeline = require('../../models/pipeline');
var application = require('../../models/application');
var code_analysis = require('../../models/code_analysis');
var update_creation_status = require("../../service_helpers/common/update_creation_status");
var ci_data = require('../../models/ci_data');
var scm_data = require('../../models/scm_data');
var dast_qualys_model = require('../../models/dast_qualys_data');
var toolModel = require('../../models/tool');
var snowModel = require('../../models/itsm_incidents');
var slaconfig = require('../../models/sla_config')
var sladatas = require('../../models/sla_data');
// var snowModel = require('../../models/snow_vsm_data');
var logger = require('../../configurations/logging/logger');
const test_data_db = require('../../models/azure_test_data');
const utility_service = {};


// var pipeline_key;
// try {
//     pipeline_key = generate_pipeline_key.generatePipelineKey();
// }
// catch (error) {
//     throw new Error(error.message);
// }

utility_service.seed_app_data = async (application_key, pipeline_name) => {
    var pipeline_key;
    try {
        pipeline_key = generate_pipeline_key.generatePipelineKey();
    }
    catch (error) {
        throw new Error(error.message);
    }
    //console.log("Utility app key : ", application_key);
    // console.log("Utility pipeline name : ", pipeline_name);

    // try {
    //     var sprintCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // 2 week sprint for 6 months
    //     // for(i=1;i<=sprintCount_value;i++){
    //     //     sprintCount.push(i);
    //     // }
    //     var sprintItems = ['EPIC', 'STORY', 'BUG', 'TASK'];
    //     var issueStatus = ['TO DO', 'IN PROGRESS', 'DONE'];
    //     var phase = ['Development', 'Testing', 'Deployment'];
    //     var creation_status_pip = ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"];
    //     // startDate = // 6 months before
    //     var currentDate = new Date();
    //     var firstDate = new Date(currentDate);
    //     firstDate.setMonth(firstDate.getMonth() - 5);
    //     // var currentMonth = currentDate.getMonth() + 1;
    //     // var firstYear = currentMonth - 5;
    //     var startDate = new Date((firstDate.getMonth() + 1) + '/01/' + firstDate.getFullYear());
    //     // console.log(startDate);

    //     var endDate = new Date(startDate);
    //     endDate.setDate(endDate.getDate() + 14);//sprint duration 
    //     // console.log(endDate);

    //     // startDate.setMonth(firstMonth - 1);
    //     var response = [];

    //     var sprintID = Math.random().toString(36).slice(2);



    //     let tool_obj = {
    //         status_category: {
    //             New: {},
    //             In_Progress: {},
    //             Closed: {}

    //         },
    //         webhook_enable: false,
    //         proxy_required: false,
    //         application_key: application_key,
    //         tool_url: "http://54.87.195.230:8081",
    //         tool_instance_name: "jiraInstanceForSeeder",
    //         tool_category: "Planning",
    //         tool_name: "Jira",
    //         tool_version: "v5",
    //         tool_auth: {
    //             auth_type: "password",
    //             auth_username: "admin",
    //             auth_password: "admin",
    //         },
    //         tool_users: {}
    //     }

    //     var z = await toolModel.create(tool_obj);

    //     // console.log("after saving tool");
    //     try {
    //         var instance_planning = await toolModel.findOne({ application_key: application_key, tool_category: "Planning" }).lean();
    //     }
    //     catch (error) {
    //         throw error
    //     }
    //     // console.log("instance planning", instance_planning);

    //     await application.findOneAndUpdate(
    //         { application_key: application_key },
    //         {
    //             $set: {
    //                 'plan': {
    //                     creation_status: "SUCCESS",
    //                     configured: true,
    //                     is_sync: false,
    //                     project_url: "http://54.87.195.230:8081/projects/CDVSM",
    //                     tool_project_key: "CDVSM",
    //                     tool_project_name: "CDVSM",
    //                     create_webhook: true,
    //                     instance_details: {
    //                         tool_name: "Jira",
    //                         tool_version: "v5",
    //                         instance_name: "jiraInstanceForSeeder",
    //                         instance_id: instance_planning._id,
    //                         tool_roles: {}
    //                     }
    //                 },

    //             }
    //         },
    //         { upsert: true, new: true }
    //     );
    //     // console.log("after saving application plan");
    //     let issue_sprint_names = [];
    //     for (const i of sprintCount.keys()) {
    //         // for (let i = 1; i <= sprintCount.length; i++) {
    //         let backL = (Math.random() < 0.5);
    //         var sprint = {
    //             tool_project_key: 'CDVSM',
    //             // pipeline_key: pipeline_key,
    //             sprint_id: sprintID,
    //             sprint_logical_name: 'Demo-Sprint-' + (i + 1),
    //             start_date: startDate,
    //             end_date: endDate,
    //             sprint_active: i == 11 ? true : false,
    //             self: 'https://temp.jira.com/demoapp/test',
    //             story_points: {
    //                 points_committed: 43 + (i + 1),
    //                 points_completed: 40 + (i + 1)
    //             },
    //             application_key: application_key,
    //             epics: [],
    //             stories: [],
    //             bugs: [],
    //             tasks: [],
    //         };

    //         for (const j of sprintCount.keys()) {
    //             var item = sprintItems[Math.floor(Math.random() * sprintItems.length)];
    //             var item_phase = phase[Math.floor(Math.random() * phase.length)];

    //             var dateObj = calculatePdDate(startDate, endDate);

    //             var pdStartDate = dateObj.pdStartdate;
    //             var pdEndDate = dateObj.pdEndDate;
    //             var pd = {
    //                 isDelete: false,
    //                 issue_story_points: Math.floor(Math.random() * 7) == 0 ? 1 : Math.floor(Math.random() * 7),
    //                 issue_sprint: (backL == true) ? "" : sprint.sprint_logical_name,
    //                 // issue_sprint: sprint.sprint_logical_name,
    //                 timeoriginalestimate: Math.floor(Math.random() * (400000 - 150000 + 1)) + 150000,
    //                 timespent: Math.floor(Math.random() * (400000 - 150000 + 1)) + 150000,
    //                 issue_wastage_days: 0,
    //                 issue_type: item,
    //                 issue_name: `Temp ${item.toLocaleLowerCase()} - ${(j + 1)}`,
    //                 issue_desc: `Temp Desc for issue - ${item.toLocaleLowerCase()} - ${(j + 1)}`,
    //                 application_key: application_key,
    //                 sprint_id: sprintID,
    //                 issue_id: (j + 1),
    //                 issue_key: (j + 1),
    //                 actual_start_date: pdStartDate,
    //                 actual_end_date: pdEndDate,
    //                 assigned_to: 'Temp',
    //                 reporter: 'System',
    //                 issue_status: j < 11 ? 'DONE' : issueStatus[Math.floor(Math.random() * issueStatus.length)],
    //                 phase: item_phase,
    //                 isSpillOver: (Math.random() < 0.5),
    //                 isBacklog: backL,
    //                 completionTime: Math.floor(Math.random() * (25 - 2 + 1)) + 2,
    //                 lT: Math.floor(Math.random() * (9 - 1 + 1)) + 1,
    //                 pT: Math.floor(Math.random() * (11 - 2 + 1)) + 2,
    //             }
    //             switch (pd.issue_type) {
    //                 case 'TASK':
    //                     sprint.tasks.push(pd.issue_id);
    //                     break;
    //                 case 'EPIC':
    //                     sprint.epics.push(pd.issue_id);
    //                     break;
    //                 case 'STORY':
    //                     sprint.stories.push(pd.issue_id);
    //                     break;
    //                 case 'BUG':
    //                     sprint.bugs.push(pd.issue_id);
    //                     break;
    //             }
    //             // console.log("pd---->", pd)
    //             var pdata = await planning_data.create(pd);

    //         }

    //         var s = await sprintModel.create(sprint);

    //         response.push(s);



    //         startDate = new Date(endDate);
    //         startDate.setDate(startDate.getDate() + 1);

    //         endDate = new Date(startDate);
    //         endDate.setDate(endDate.getDate() + 14);

    //     }

    //     var sprintOfApplication = await sprintModel.find({ application_key: application_key, sprint_active: true }).lean();
    //     try {

    //         for (let i = 0; i < 10; i++) {

    //             let sprint_start_d = sprintOfApplication[0].start_date;
    //             let sprint_end = sprintOfApplication[0].end_date;
    //             // var startDate = new Date((firstDate.getMonth() + 1) + '/01/' + firstDate.getFullYear());
    //             let incident_opened1 = new Date(sprint_start_d);
    //             incident_opened1.setDate(sprint_start_d.getDate() + 2);
    //             let incident_opened2 = new Date(sprint_start_d);
    //             incident_opened2.setDate(sprint_start_d.getDate() + 4);
    //             let incident_opened3 = new Date(sprint_start_d);
    //             incident_opened3.setDate(sprint_start_d.getDate() + 6);
    //             // let incident_opened4 = new Date( sprint_start_d);
    //             // incident_opened4.setDate(sprint_start_d.getDate() + 16);
    //             let incident_opened_dates = [incident_opened1, incident_opened2, incident_opened3];
    //             var stc_dt = [1500000, 390000, 270000, 500000, 240000];
    //             var cal_stc = stc_dt[Math.floor(Math.random() * stc_dt.length)];
    //             let incident_opened = incident_opened_dates[Math.floor(Math.random() * incident_opened_dates.length)];
    //             // console.log("sprindate l1",sprintOfApplication[0].start_date);
    //             // console.log("sprindate",sprint_start_d);
    //             // console.log("incidentopened",incident_opened);

    //             // incident_opened.setDate((sprint_start_d.getDate() + Math.floor(Math.random() * (3 - 1 + 1)) + 1))
    //             let incident_closed1 = new Date(incident_opened1);
    //             incident_closed1.setDate(incident_opened1.getDate() + 7);
    //             // let incident_closed2 = new Date(incident_opened2);
    //             // incident_closed2.setDate(incident_opened2.getDate() + 6);
    //             // let incident_closed3 = new Date(incident_opened3);
    //             // incident_closed3.setDate(incident_opened3.getDate() + 3);
    //             // let incident_closed4 = new Date(incident_opened4);
    //             // incident_closed4.setDate(incident_opened4.getDate() + 4);
    //             let incident_closing = ["", incident_closed1];

    //             let incident_closing_date = incident_closing[Math.floor(Math.random() * incident_closing.length)];
    //             // let incident_state = ["Closed"];
    //             let vsm_snow_obj = {
    //                 application_key: application_key,
    //                 incident_number: "INC001001" + (i + 1),
    //                 calendar_stc: (incident_closing_date == "") ? "" : cal_stc,
    //                 opened_at: incident_opened,
    //                 closed_at: incident_closing_date,
    //                 incident_state: (incident_closing_date == "") ? "New" : "Closed"
    //             }

    //             await snowModel.create(vsm_snow_obj);
    //         }
    //         let jlength = 9
    //         for (let j = 0; j < 6; j++) {
    //             let graph_mttr_date = sprintOfApplication[0].start_date;
    //             let difference = (jlength - j);
    //             var stc_d = [1500000, 390000, 270000, 500000, 240000];
    //             var cal_stcd = stc_d[Math.floor(Math.random() * stc_d.length)];
    //             let incident_opened_mttr = new Date(graph_mttr_date);
    //             incident_opened_mttr.setMonth(incident_opened_mttr.getMonth() - difference);
    //             let incident_closed_mttr = incident_opened_mttr;
    //             incident_closed_mttr.setDate(incident_opened_mttr.getDate() + 2);
    //             let vsm_snow_obj_mttr = {
    //                 application_key: application_key,
    //                 incident_number: "INC001002" + (j + 1),
    //                 calendar_stc: cal_stcd,
    //                 opened_at: incident_opened_mttr,
    //                 closed_at: incident_closed_mttr,
    //                 incident_state: "Closed"
    //             }

    //             let rn = Math.random() * (16 - 3) + 3;
    //             for (let i = 0; i < rn; i++) {
    //                 await snowModel.create(vsm_snow_obj_mttr);
    //             }

    //             // await snowModel.create(vsm_snow_obj_mttr);
    //             // if (difference == 8 || difference == 6) {
    //             //     vsm_snow_obj_mttr.incident_number = "INC001002" + (j + 4);

    //             //     await snowModel.create(vsm_snow_obj_mttr);
    //             // }
    //             // if (difference == 4) {
    //             //     vsm_snow_obj_mttr.incident_number = "INC001002" + (j + 4);

    //             //     await snowModel.create(vsm_snow_obj_mttr);
    //             // }

    //         }

    //     }
    //     catch (error) {

    //         throw error;
    //     }

    //     try {
    //         let gitlab_tool_obj = {
    //             status_category: {
    //                 New: {},
    //                 In_Progress: {},
    //                 Closed: {}

    //             },
    //             webhook_enable: false,
    //             proxy_required: false,
    //             application_key: application_key,
    //             tool_url: "https://gitlab.com",
    //             tool_instance_name: "GitlabInstanceForSeeder",
    //             tool_category: "Source Control",
    //             tool_name: "GitLab",
    //             tool_version: "v1",
    //             tool_auth: {
    //                 auth_type: "Token",
    //                 auth_token: "tSS3dQ3c2zepLr5Wv_-C"
    //             },
    //             tool_users: {}
    //         }
    //         var gitlabcr = await toolModel.create(gitlab_tool_obj);
    //         console.log("gittt", gitlabcr);


    //         let bitb_tool_obj = {
    //             status_category: {
    //                 New: {},
    //                 In_Progress: {},
    //                 Closed: {}

    //             },
    //             webhook_enable: false,
    //             proxy_required: false,
    //             application_key: application_key,
    //             tool_url: "http://54.87.195.230:7990",
    //             tool_instance_name: "BitbucketInstanceForSeeder",
    //             tool_category: "Source Control",
    //             tool_name: "Bitbucket",
    //             tool_version: "v1",
    //             tool_auth: {
    //                 auth_type: "password",
    //                 auth_username: "admin",
    //                 auth_password: "admin",
    //             },
    //             tool_users: {}
    //         }
    //         var bbcr = await toolModel.create(bitb_tool_obj);
    //         console.log("bitbuckett", bbcr);


    //         let azurep_tool_obj = {
    //             status_category: {
    //                 New: {},
    //                 In_Progress: {},
    //                 Closed: {}

    //             },
    //             webhook_enable: false,
    //             proxy_required: false,
    //             application_key: application_key,
    //             tool_url: "https://dev.azure.com",
    //             tool_instance_name: "AzurerepoInstanceForSeeder",
    //             tool_category: "Source Control",
    //             tool_name: "Azure Repos",
    //             tool_version: "v5",
    //             tool_auth: {
    //                 auth_type: "Token",
    //                 auth_token: "4jqty3je3rikr2njoujr3ldw7rz27xhk5vehdksfqy62tltyjiea"
    //             },
    //             tool_users: {}
    //         }
    //         var azrcr = await toolModel.create(azurep_tool_obj);


    //         let jenkins_tool_obj = {
    //             status_category: {
    //                 New: {},
    //                 In_Progress: {},
    //                 Closed: {}

    //             },
    //             webhook_enable: false,
    //             proxy_required: false,
    //             application_key: application_key,
    //             tool_url: "http://54.87.195.230:8080",
    //             tool_instance_name: "JenkinsInstanceForSeeder",
    //             tool_category: "Continuous Integration",
    //             tool_name: "Jenkins",
    //             tool_version: "v1",
    //             tool_auth: {
    //                 auth_type: "password",
    //                 auth_username: "cldadmin",
    //                 auth_password: "admin",
    //             },
    //             tool_users: {}
    //         }
    //         var jenkincr = await toolModel.create(jenkins_tool_obj);


    //         let sonar_obj = {
    //             status_category: {
    //                 New: {},
    //                 In_Progress: {},
    //                 Closed: {}

    //             },
    //             webhook_enable: false,
    //             proxy_required: false,
    //             application_key: application_key,
    //             tool_url: "http://54.87.195.230:8085",
    //             tool_instance_name: "SonarInstanceForSeeder",
    //             tool_category: "Code Analysis",
    //             tool_name: "Sonarqube",
    //             tool_version: "v1",
    //             tool_auth: {
    //                 auth_type: "password",
    //                 auth_username: "admin",
    //                 auth_password: "admin",
    //             },
    //             tool_users: {}

    //         }
    //         var sonar_create = await toolModel.create(sonar_obj);
    //     } catch (error) {
    //         throw error;
    //     }

    //     let itsm_tool_obj = {
    //         status_category: {
    //             New: {},
    //             In_Progress: {},
    //             Closed: {}

    //         },
    //         webhook_enable: false,
    //         proxy_required: false,
    //         application_key: application_key,
    //         tool_url: "https://dev109540.service-now.com",
    //         tool_instance_name: "serviceNowInstanceForSeeder",
    //         tool_category: "ITSM",
    //         tool_name: "ServiceNow",
    //         tool_version: "v5",
    //         tool_auth: {
    //             auth_type: "password",
    //             auth_username: "admin",
    //             auth_password: "aFi5SHVSw4mq",
    //         },
    //         tool_users: {}
    //     }
    //     var l = await toolModel.create(itsm_tool_obj);

    //     // try {




    //     //     var pipe_data, pipeline_id;
    //     //     let pipeline_type = "PIPELINE_STANDARD";
    //     //     let i = 0;
    //     //     try {
    //     //         let stat = creation_status_pip[Math.floor(Math.random() * creation_status_pip.length)];
    //     //         pipe_data = await pipeline.findOneAndUpdate({
    //     //             "pipeline_key": pipeline_key
    //     //         }, {
    //     //             "$set": {
    //     //                 "pipeline_name": pipeline_name,
    //     //                 "pipeline_key": pipeline_key,
    //     //                 "application_key": application_key,
    //     //                 "pipeline_description": "seedData_demo_pipeline",
    //     //                 "pipeline_type": pipeline_type,
    //     //                 "pipeline_workflow_ui_data": {
    //     //                     "nodes": [{
    //     //                         "id": i + 1,
    //     //                         "label": "Start",
    //     //                         "task": {
    //     //                             "task_name": "This is start node",
    //     //                             "task_key": "start_node"
    //     //                         }
    //     //                     }, {
    //     //                         "id": i + 2,
    //     //                         "label": "End",
    //     //                         "task": {
    //     //                             "task_name": "This is end node",
    //     //                             "task_key": "end_node"
    //     //                         }
    //     //                     }, {
    //     //                         "id": i + 3,
    //     //                         "label": "security",
    //     //                         "category": "Security",
    //     //                         "task": {
    //     //                             "task_name": "CodeDx SAST",
    //     //                             "task_key": "CodeDx_SAST",
    //     //                             "Tool Instance Name": "ftdytr",
    //     //                             "Project Name": "Canvas DevOps Demo",
    //     //                             "Context Name": "Security",
    //     //                             "Project Id": "demoId",
    //     //                         }
    //     //                     }],
    //     //                 },
    //     //             },
    //     //         }, { upsert: true, setDefaultsOnInsert: true, new: true })
    //     //         pipeline_id = pipe_data._id;
    //     //         try {
    //     //             let application_name = await save_pipeline_info.save_pipeline_in_application(application_key, pipeline_id);
    //     //             //console.log("Utility app name : ", application_name);

    //     //         }
    //     //         catch (error) {

    //     //             throw new Error(error.message);
    //     //         }
    //     //     }
    //     //     catch (error) {
    //     //         logger.error('error.message save info = ', error.message);
    //     //         let err = new Error(error.message);
    //     //         throw err;
    //     //     }
    //     //     var ca_analysis_id = Math.random().toString(36).slice(2);
    //     //     // console.log("ca_analysis_id ", ca_analysis_id)
    //     //     var ca_project_key = Math.random().toString(36).substr(2, 8);
    //     //     // console.log("ca_project_key ", ca_project_key)

    //     //     let newCodeAnalysis = {
    //     //         analysis_id: ca_analysis_id,
    //     //         pipeline_key: pipeline_key,
    //     //         tool_project_key: ca_project_key,
    //     //         nloc: Math.floor(Math.random() * (1900 - 1300) + 1300),
    //     //         line_coverage: Math.floor(Math.random() * (80 - 30) + 30),
    //     //         violations: Math.floor(Math.random() * (2 - 0) + 0),
    //     //         vulnerabilities: Math.floor(Math.random() * (5 - 1) + 1),
    //     //         technical_debt: Math.floor(Math.random() * (4000 - 1200) + 1200),
    //     //         bugs: Math.floor(Math.random() * (45 - 10) + 10),
    //     //         code_smells: Math.floor(Math.random() * (400 - 130) + 130),
    //     //         duplication: Math.floor(Math.random() * (100 - 30) + 30),

    //     //     };


    //     //     try {
    //     //         await code_analysis.findOneAndUpdate(
    //     //             { analysis_id: ca_analysis_id },
    //     //             newCodeAnalysis,
    //     //             { upsert: true }
    //     //         );

    //     //         let sonar_roles = ["admin", "codeviewer", "issueadmin", "scan", "user"];
    //     //         let temp = {
    //     //             onboarded: true,
    //     //             code_quality: {
    //     //                 creation_status: "SUCCESS",
    //     //                 tool_project_key: ca_project_key,
    //     //                 tool_project_name: "test sonar",
    //     //                 is_sync: false,
    //     //                 project_url: "http://54.87.195.230:8085/projects/" + ca_project_key,
    //     //                 configured: true,
    //     //                 instance_details: {
    //     //                     tool_name: "Sonarqube",
    //     //                     instance_name: "fytc",
    //     //                     instance_id: "",
    //     //                     //instance_id: "ObjectId('60e8399bca879c3d1046a674')",
    //     //                     tool_roles: sonar_roles,
    //     //                 },
    //     //             },
    //     //         };

    //     //         await pipeline.findOneAndUpdate(
    //     //             {
    //     //                 pipeline_key: pipeline_key,
    //     //             },
    //     //             temp,
    //     //             {
    //     //                 upsert: true,
    //     //             }
    //     //         );
    //     //         update_creation_status.set_creation_status(
    //     //             pipeline_key,
    //     //             "code_quality",
    //     //             "SUCCESS"
    //     //         );
    //     //     }
    //     //     catch (err) {
    //     //         update_creation_status.set_creation_status(
    //     //             pipeline_key,
    //     //             "code_quality",
    //     //             "FAILED"
    //     //         );

    //     //     }

    //     //     var qd = {
    //     //         pipeline_key: pipeline_key,
    //     //         build_number: '' + Math.floor(Math.random() * (40 - 35 + 1)),
    //     //         crawling_time: '' + Math.floor(Math.random() * (561 - 536 + 1)),
    //     //         Assesment_Time: '' + Math.floor(Math.random() * (15 - 13 + 1)),
    //     //         Requests_Performed: '' + Math.floor(Math.random() * (244 - 243 + 1)),
    //     //         Links_Crawled: '' + Math.floor(Math.random() * (12 - 10 + 1)),
    //     //         vulnerabilities: '' + Math.floor(Math.random() * 10),
    //     //         sensitive_contents: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Information_Gathered: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Level_5: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Level_4: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Level_3: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Level_2: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Level_1: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Cross_Site: '' + Math.floor(Math.random() * 100) / 100,
    //     //         SQL_Injection: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Information_Disclosure: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Path_Disclosure: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Injection: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Broken_Authentication: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Sensitive_Data: '' + Math.floor(Math.random() * 100) / 100,
    //     //         XML_XXE: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Broken_Access: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Security_Misconfiguration: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Cross_XSS: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Insecure: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Using_Vulnerabilities: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Insufficient_Logging: '' + Math.floor(Math.random() * 100) / 100,
    //     //         Links_Collected: '' + Math.floor(Math.random() * 53),
    //     //         Ajax_Links_Crawled: '' + Math.floor(Math.random() * 28),
    //     //         Requests_Crawled: '' + Math.floor(Math.random() * 55),
    //     //         Unexpected_Errors: '' + Math.floor(Math.random() * 6),
    //     //         Avg_Response_Time: '' + Math.floor(Math.random() * 100) / 100,
    //     //     }

    //     //     var d = await dast_qualys_model.create(qd);

    //     //     response.push(d);

    //     // } catch (err) {
    //     //     res.status(500).send({ data: err.message });
    //     // }



    //     // try {

    //     //     var randomBuildStateCount = Math.floor(Math.random() * (15 - 10) + 10);

    //     //     for (i = 0; i < randomBuildStateCount; i++) {
    //     //         var buildResult = ['SUCCESS', 'FAILURE', 'ABORTED', 'IN PROGRESS'];

    //     //         var build_result_value = buildResult[Math.floor(Math.random() * buildResult.length)];

    //     //         // console.log("build result value: ", build_result_value);

    //     //         var currentDate = new Date();
    //     //         var buildDate = currentDate.setMonth(currentDate.getMonth() - 1);


    //     //         var total_Count = Math.floor(Math.random() * (7 - 3) + 3);
    //     //         var fail_Count = Math.floor(Math.random() * (2 - 0) + 0);
    //     //         var tests_Result;

    //     //         if (fail_Count == 0) {
    //     //             tests_Result = 'PASS';
    //     //         } else {
    //     //             tests_Result = 'FAIL';
    //     //         };

    //     //         var total_Count2 = Math.floor(Math.random() * (7 - 3) + 3);
    //     //         var fail_Count2 = Math.floor(Math.random() * (2 - 0) + 0);
    //     //         var tests_Result2;

    //     //         if (fail_Count2 == 0) {
    //     //             tests_Result2 = 'PASS';
    //     //         } else {
    //     //             tests_Result2 = 'FAIL';
    //     //         };

    //     //         let ci_data_value = {
    //     //             build_number: i + 1,
    //     //             build_cause: "Started by user for demo",
    //     //             build_result: build_result_value,
    //     //             build_fullDisplayName: "demo build - " + i + 1,
    //     //             build_url: "//http://demo.com/job/test",
    //     //             job_name: "demo job - " + i + 1,
    //     //             pipeline_key: pipeline_key,
    //     //             build_duration: Math.floor(Math.random() * (160 - 70) + 70),
    //     //             job_url: "demo url",
    //     //             build_timestamp: buildDate,
    //     //             code_analysis_id: ca_analysis_id,
    //     //             build_commit_set: [], //number of commits in the build
    //     //             build_test: {
    //     //                 unit_test: {
    //     //                     totalCount: total_Count,
    //     //                     failCount: fail_Count,
    //     //                     skipCount: 0,
    //     //                     testsResult: tests_Result
    //     //                 },

    //     //                 functional_test: {
    //     //                     totalCount: total_Count2,
    //     //                     failCount: fail_Count2,
    //     //                     skipCount: 0,
    //     //                     testsResult: tests_Result2
    //     //                 }
    //     //             }
    //     //         };


    //     //         let pass_test = Math.floor(Math.random() * (8 - 4) + 4)
    //     //         let fail_count = Math.floor(Math.random() * (3 - 0) + 0)
    //     //         let total_count_test = pass_test + fail_count;
    //     //         let test_data_set = {
    //     //             pipeline_key: pipeline_key,
    //     //             build_number: i + 1, //build no
    //     //             test_result: fail_count > 0 ? 'FAILED' : 'PASSED', //test_data.result 
    //     //             test_pass_count: pass_test,
    //     //             test_duration: Math.floor(Math.random() * (20 - 10) + 10), //"duration": 31713,
    //     //             test_fail_count: fail_count,
    //     //             total_test: total_count_test
    //     //         }


    //     //         await test_data_db.findOneAndUpdate(
    //     //             { 'pipeline_key': pipeline_key, 'build_number': test_data_set.build_number },
    //     //             test_data_set,
    //     //             { upsert: true }
    //     //         );

    //     //         // console.log(ci_data_value);
    //     //         await ci_data.create(ci_data_value, { upsert: true, new: true });
    //     //     }

    //     //     try {
    //     //         await pipeline.findOneAndUpdate({
    //     //             "pipeline_key": pipeline_key
    //     //         }, {
    //     //             "$set": {
    //     //                 "onboarded": true,
    //     //                 "continuous_integration": {
    //     //                     "creation_status": "SUCCESS",
    //     //                     "job_url": "http://54.87.195.230:8080/job/",
    //     //                     "job_name": "demo job",
    //     //                     "configured": true,
    //     //                     "is_sync": false,
    //     //                     "tool_project_key": "",
    //     //                     "tool_project_name": "test jenkins",
    //     //                     "instance_details": {
    //     //                         "tool_name": "Jenkins",
    //     //                         "instance_name": "gfxht",
    //     //                         "instance_id": "",
    //     //                         // "instance_id": "ObjectId('60e83973ca879c3d1046a5b9')",
    //     //                         "tool_roles": ""
    //     //                     }
    //     //                 },
    //     //                 "scm": {

    //     //                     "creation_status": "SUCCESS",

    //     //                     "configured": true,

    //     //                     "is_sync": false,

    //     //                     "project_url": "https://gitlab.com/groups/lti_cldpractice",

    //     //                     "repo_url": "https://gitlab.com/projects/25576305",

    //     //                     "repo_name": "dummy project",

    //     //                     "branch_name": "master",

    //     //                     "tool_project_key": "",

    //     //                     "tool_project_name": "LTI",

    //     //                     "scm_type": "git",

    //     //                     "instance_details": {

    //     //                         "tool_name": "GitLab",

    //     //                         "instance_name": "shgfsaja",

    //     //                         "instance_id": "",

    //     //                         "tool_roles": []

    //     //                     }
    //     //                 }
    //     //             }
    //     //         }, { upsert: true })
    //     //     }
    //     //     catch (err) {
    //     //         err = new Error(`Error Updating project ${project_key}`)
    //     //         throw err;
    //     //     }

    //     //     try {

    //     //         for (j = 0; j < 40; j++) {

    //     //             let additionsValue = Math.floor(Math.random() * (8 - 4) + 4);
    //     //             let deletionsValue = Math.floor(Math.random() * (3 - 1) + 1);
    //     //             let editsValue = Math.floor(Math.random() * (6 - 2) + 2);
    //     //             let totalValue = additionsValue + deletionsValue + editsValue;
    //     //             var today = new Date();
    //     //             var userSet = ['Goutham', 'Manoj', 'Ryan', 'Saurabh', 'Yash', 'Vivek', 'Soumya'];
    //     //             var user_set_value = userSet[Math.floor(Math.random() * userSet.length)];

    //     //             try {
    //     //                 var commit_ = await sprintModel.findOne({ application_key: application_key, sprint_active: true });
    //     //                 var commit_sd = new Date(commit_.start_date);
    //     //                 var commit_time1 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (3 - 2) + 2));
    //     //                 // console.log("commit times", commit_times);
    //     //                 var commit_time2 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (5 - 4) + 4));
    //     //                 var commit_time3 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (7 - 6) + 6));
    //     //                 var commit_time4 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (9 - 8) + 8));

    //     //                 var nowDate = new Date();
    //     //                 var commitDateNew = new Date(nowDate);
    //     //                 commitDateNew.setMonth(commitDateNew.getMonth() - 1);

    //     //                 var commit_time5 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (6 - 4) + 4));
    //     //                 var commit_time6 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (9 - 7) + 7));
    //     //                 var commit_time7 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (12 - 10) + 10));
    //     //                 var commit_time8 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (15 - 13) + 13));

    //     //             }
    //     //             catch (error) {
    //     //                 // console.log("errr--->", error);
    //     //                 throw error;
    //     //             }
    //     //             // console.log("ct---", commit_time1);
    //     //             // console.log("t---", today);
    //     //             var commit_d = [commit_time1, commit_time2, commit_time3, commit_time4, commit_time5, commit_time6, commit_time7, commit_time8, today];
    //     //             var commit_date = commit_d[Math.floor(Math.random() * commit_d.length)]
    //     //             var commitID = Math.floor(Math.random() * (500 - 100) + 100);

    //     //             let commit_data_set = {
    //     //                 type: "COMMIT",
    //     //                 commit_id: Math.random().toString(36).slice(2),
    //     //                 commit_msg: "demo commit - " + commitID,
    //     //                 commit_author: user_set_value,
    //     //                 commit_timestamp: commit_date,
    //     //                 commit_branch: "refs/heads/demoCommit",
    //     //                 commit_project_key: pipeline_key,
    //     //                 commit_project_id: commitID,
    //     //                 commit_for_build_id: "",
    //     //                 commit_plan_issues: [],
    //     //                 pipeline_key: pipeline_key,
    //     //                 is_pr_deleted: false,
    //     //                 stats: {
    //     //                     additions: additionsValue,
    //     //                     deletions: deletionsValue,
    //     //                     edits: editsValue,
    //     //                     total: totalValue
    //     //                 }
    //     //             };
    //     //             // console.log(commit_data_set);
    //     //             await scm_data.create(commit_data_set, { upsert: true, new: true });

    //     //             // console.log(ci_data_value.build_commit_set[j]);
    //     //         }

    //     //     }
    //     //     catch (error) {
    //     //         throw error;

    //     //     }

    //     //     try {

    //     //         var authorSet = ['Ryan', 'Saurabh', 'Yash'];

    //     //         for (k = 0; k < 20; k++) {

    //     //             var author_set_value = authorSet[Math.floor(Math.random() * authorSet.length)];

    //     //             var pullnowDate = new Date();
    //     //             var pullDateNew = new Date(pullnowDate);
    //     //             pullDateNew.setMonth(pullDateNew.getMonth() - 1);

    //     //             var pull_time1 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (6 - 4) + 4));
    //     //             var pull_time2 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (9 - 7) + 7));
    //     //             var pull_time3 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (12 - 10) + 10));
    //     //             var pull_time4 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (15 - 13) + 13));
    //     //             var pull_time5 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (18 - 16) + 16));

    //     //             var pull_d = [pull_time1, pull_time2, pull_time3, pull_time4, pull_time5];
    //     //             var pullDate = pull_d[Math.floor(Math.random() * pull_d.length)]

    //     //             var pullId = k + 1;

    //     //             let pull_data_set = {
    //     //                 type: "PULL",
    //     //                 pull_id: pullId,
    //     //                 pull_project_key: "PR-" + pullId,
    //     //                 pipeline_key: pipeline_key,
    //     //                 pull_source: "refs/heads/feature/featureName" + pullId,
    //     //                 pull_destination: "refs/heads/master",
    //     //                 pull_author: author_set_value,
    //     //                 createdAt: pullDate,
    //     //                 updatedAt: pullDate,
    //     //                 closedAt: pullDate,
    //     //                 commit_plan_issues: [],
    //     //                 pull_reviewers: [],
    //     //                 is_pr_deleted: false,
    //     //                 pull_title: "/feature/featureName" + pullId,
    //     //                 pull_desc: "demo seeder data simulation task",
    //     //                 pull_state: "MERGED"

    //     //             };
    //     //             // console.log(pull_data_set);
    //     //             await scm_data.create(pull_data_set, { upsert: true, new: true });

    //     //         }


    //     //     }
    //     //     catch (error) {
    //     //         throw error;

    //     //     }


    //     // } catch (error) {
    //     //     throw error;
    //     // }

    //     // try {
    //     //     let randnum = Math.round(Math.random() * (16 - 3) + 3);
    //     //     let randnum1 = Math.round(Math.random() * (16 - 3) + 3);
    //     //     let randnum2 = Math.round(Math.random() * (16 - 3) + 3);
    //     //     var slaarray = ["GT", "GTE", "LT", "LTE", "EQ", "BTWN"];
    //     //     var slaarraydata = slaarray[Math.floor(Math.random() * slaarray.length)]
    //     //     var slaarray_one = ["GT", "GTE", "LT", "LTE", "EQ", "BTWN"];
    //     //     var slaarraydata_one = slaarray_one[Math.floor(Math.random() * slaarray_one.length)]
    //     //     var slaarray_two = ["GT", "GTE", "LT", "LTE", "EQ", "BTWN"];
    //     //     var slaarraydata_two = slaarray_two[Math.floor(Math.random() * slaarray_two.length)]
    //     //     var tyarray = ["COUNT", "PERCENTAGE"];
    //     //     var tyarraydata = tyarray[Math.floor(Math.random() * tyarray.length)]
    //     //     for (let i = 0; i < 3; i++) {
    //     //         console.log("ivalue--->", i);
    //     //         if (i == 0) {
    //     //             console.log("inside0--->", i);
    //     //             let slaobj = {
    //     //                 last_run: null,
    //     //                 pipeline_key: pipeline_key,
    //     //                 tool: "SCM",
    //     //                 entity: "Commits",
    //     //                 type: tyarraydata,
    //     //                 success: {
    //     //                     criteria: slaarraydata_one,
    //     //                     value: randnum
    //     //                 },
    //     //                 warning: {
    //     //                     criteria: slaarraydata,
    //     //                     value: randnum1
    //     //                 },
    //     //                 error: {
    //     //                     criteria: slaarraydata_two,
    //     //                     value: randnum2
    //     //                 },
    //     //                 scope: "PIPELINE",
    //     //                 status: true
    //     //             }
    //     //             await slaconfig.create(slaobj);
    //     //         }
    //     //         else if (i == 1) {
    //     //             console.log("inside1--->", i);
    //     //             var ciarray = ["Builds", "Successfull Builds", "Failed Builds"];
    //     //             var ciarraydata = ciarray[Math.floor(Math.random() * ciarray.length)]
    //     //             let slaobj1 = {
    //     //                 last_run: null,
    //     //                 pipeline_key: pipeline_key,
    //     //                 tool: "CI",
    //     //                 entity: ciarraydata,
    //     //                 type: tyarraydata,
    //     //                 success: {
    //     //                     criteria: slaarraydata_one,
    //     //                     value: randnum1
    //     //                 },
    //     //                 warning: {
    //     //                     criteria: slaarraydata_two,
    //     //                     value: randnum2
    //     //                 },
    //     //                 error: {
    //     //                     criteria: slaarraydata,
    //     //                     value: randnum
    //     //                 },
    //     //                 scope: "PIPELINE",
    //     //                 status: true
    //     //             }
    //     //             await slaconfig.create(slaobj1);
    //     //         }
    //     //         else {
    //     //             console.log("inside2--->", i);
    //     //             var codeaarray = ["Lines of Code", "Bugs", "Code Smells", "Duplication %", "Vulnerabilities"];
    //     //             var codeaarraydata = codeaarray[Math.floor(Math.random() * codeaarray.length)]
    //     //             let slaobj2 = {
    //     //                 last_run: null,
    //     //                 pipeline_key: pipeline_key,
    //     //                 tool: "CODE ANALYSIS",
    //     //                 entity: codeaarraydata,
    //     //                 type: tyarraydata,
    //     //                 success: {
    //     //                     criteria: slaarraydata,
    //     //                     value: randnum2
    //     //                 },
    //     //                 warning: {
    //     //                     criteria: slaarraydata_one,
    //     //                     value: randnum
    //     //                 },
    //     //                 error: {
    //     //                     criteria: slaarraydata_two,
    //     //                     value: randnum1
    //     //                 },
    //     //                 scope: "PIPELINE",
    //     //                 status: true
    //     //             }
    //     //             await slaconfig.create(slaobj2);
    //     //         }
    //     //     }
    //     //     var apparray = ["Sprints-Running Sprints", "Sprint-Pending Issues", "Backlog-Pending Issues", "Sprint-Story Points", "Estimated vs Actual"];
    //     //     var apparraydata = apparray[Math.floor(Math.random() * apparray.length)]
    //     //     let slaappobj = {
    //     //         last_run: null,
    //     //         pipeline_key: pipeline_key,
    //     //         tool: "PLANNING",
    //     //         entity: apparraydata,
    //     //         type: tyarraydata,
    //     //         success: {
    //     //             criteria: slaarraydata_one,
    //     //             value: randnum1
    //     //         },
    //     //         warning: {
    //     //             criteria: slaarraydata_two,
    //     //             value: randnum2
    //     //         },
    //     //         error: {
    //     //             criteria: slaarraydata,
    //     //             value: randnum
    //     //         },
    //     //         scope: "APPLICATION",
    //     //         status: true
    //     //     }
    //     //     await slaconfig.create(slaappobj);

    //     //     var clrarray = ["R", "G"];
    //     //     var clrarraydata = clrarray[Math.floor(Math.random() * clrarray.length)]
    //     //     var sldata = await slaconfig.find({ pipeline_key: pipeline_key });
    //     //     for (let k = 0; k < sldata.length; k++) {
    //     //         let sladashobj = {
    //     //             config_id: sldata[k]._id,
    //     //             pipeline_key: sldata[k].pipeline_key,
    //     //             timeline: {
    //     //                 value: 1,
    //     //                 indicator: clrarraydata,
    //     //                 type: sldata[k].type
    //     //             },
    //     //         }
    //     //         await sladatas.create(sladashobj);
    //     //     }
    //     // }
    //     // catch (error) {
    //     //     throw error;
    //     // }
    try {
        await seed_dashboard(application_key, pipeline_name);
        await seed_pipelines(application_key, pipeline_name, pipeline_key);
        await seed_sla(pipeline_key);
        logger.info("Data Seeder Completed.");
        return response = "success";
    }
    catch (error) {
        logger.error("Data Sedder Failed.");
        throw error;
    }

}

const calculatePdDate = (sprint_sd, sprint_ed) => {
    sprint_sd = new Date(sprint_sd);
    sprint_ed = new Date(sprint_ed);

    var pdStartdate = new Date(sprint_sd);
    pdStartdate.setDate(pdStartdate.getDate() + (Math.floor(Math.random() * (3 - 1 + 1)) + 1));
    var pdEndDate = new Date(pdStartdate);
    pdEndDate.setDate(pdEndDate.getDate() + (Math.floor(Math.random() * (4 - 2 + 2)) + 2));
    return { pdStartdate, pdEndDate };
}

utility_service.deletedata = async (application_key) => {

    try {
        // console.log("---deleting", application_key);
        await planning_data.deleteMany({ "application_key": application_key })
        await sprintModel.deleteMany({ "application_key": application_key })
        let pipelined = await pipeline.find({ "application_key": application_key }).lean();
        // console.log("pipdetails", pipelined);
        await code_analysis.deleteMany({ "pipeline_key": pipelined.pipeline_key })
        await ci_data.deleteMany({ "pipeline_key": pipelined.pipeline_key })
        await scm_data.deleteMany({ "pipeline_key": pipelined.pipeline_key })
        await pipeline.deleteMany({ "application_key": application_key })
        // await application.deleteOne({ "application_key": application_key })
        await toolModel.deleteMany({ "application_key": application_key })

        return "success";
    }
    catch (error) {

        return error
    }

}

// utility_service.seed_app_data2 = async (application_key) => {

//     var sprintOfApplication = await sprintModel.find({ application_key: application_key, sprint_active: true }).lean();
//     try {
//         await snowModel.deleteMany({ application_key: application_key });
//         console.log("start");
//         for (let i = 0; i < 10; i++) {

//             let sprint_start_d = sprintOfApplication[0].start_date;
//             let sprint_end = sprintOfApplication[0].end_date;
//             // var startDate = new Date((firstDate.getMonth() + 1) + '/01/' + firstDate.getFullYear());
//             let incident_opened1 = new Date(sprint_start_d);
//             incident_opened1.setDate(sprint_start_d.getDate() + 2);
//             let incident_opened2 = new Date(sprint_start_d);
//             incident_opened2.setDate(sprint_start_d.getDate() + 4);
//             let incident_opened3 = new Date(sprint_start_d);
//             incident_opened3.setDate(sprint_start_d.getDate() + 6);
//             // let incident_opened4 = new Date( sprint_start_d);
//             // incident_opened4.setDate(sprint_start_d.getDate() + 16);
//             let incident_opened_dates = [incident_opened1, incident_opened2, incident_opened3];

//             let incident_opened = incident_opened_dates[Math.floor(Math.random() * incident_opened_dates.length)];

//             var stc_d = [1500000, 390000, 270000, 500000, 240000];
//             var cal_stc = stc_d[Math.floor(Math.random() * stc_d.length)];

//             // console.log("sprindate l1",sprintOfApplication[0].start_date);
//             // console.log("sprindate",sprint_start_d);
//             // console.log("incidentopened",incident_opened);

//             // incident_opened.setDate((sprint_start_d.getDate() + Math.floor(Math.random() * (3 - 1 + 1)) + 1))
//             let incident_closed1 = new Date(incident_opened1);
//             incident_closed1.setDate(incident_opened1.getDate() + 7);
//             // let incident_closed2 = new Date(incident_opened2);
//             // incident_closed2.setDate(incident_opened2.getDate() + 6);
//             // let incident_closed3 = new Date(incident_opened3);
//             // incident_closed3.setDate(incident_opened3.getDate() + 3);
//             // let incident_closed4 = new Date(incident_opened4);
//             // incident_closed4.setDate(incident_opened4.getDate() + 4);
//             let incident_closing = ["", incident_closed1];

//             let incident_closing_date = incident_closing[Math.floor(Math.random() * incident_closing.length)];
//             // let incident_state = ["Closed"];
//             if (incident_closing_date == "") {
//                 test = 1;
//             }
//             let vsm_snow_obj = {
//                 application_key: application_key,
//                 incident_number: "INC001001" + (i + 1),
//                 calendar_stc: (incident_closing_date == "") ? "" : cal_stc,
//                 opened_at: incident_opened,
//                 closed_at: incident_closing_date,
//                 incident_state: (incident_closing_date == "") ? "New" : "Closed"
//             }
//             console.log("before create", vsm_snow_obj);
//             await snowModel.create(vsm_snow_obj);
//             console.log("after create");

//         }
//         let jlength = 9
//         for (let j = 0; j < 6; j++) {
//             var stc_d = [1500000, 390000, 270000, 500000, 240000];
//             // var stc_dt = [15, 39, 27, 500, 240];
//             var cal_stcd = stc_dt[Math.floor(Math.random() * stc_dt.length)];
//             let graph_mttr_date = sprintOfApplication[0].start_date;
//             let difference = (jlength - j);
//             let incident_opened_mttr = new Date(graph_mttr_date);
//             incident_opened_mttr.setMonth(incident_opened_mttr.getMonth() - difference);
//             let incident_closed_mttr = incident_opened_mttr;
//             incident_closed_mttr.setDate(incident_opened_mttr.getDate() + 2);
//             let vsm_snow_obj_mttr = {
//                 application_key: application_key,
//                 incident_number: "INC001002" + (j + 1),
//                 calendar_stc: cal_stcd,
//                 opened_at: incident_opened_mttr,
//                 closed_at: incident_closed_mttr,
//                 incident_state: "Closed"
//             }
//             console.log("before create", vsm_snow_obj_mttr);
//             await snowModel.create(vsm_snow_obj_mttr);
//             console.log("after create");

//             if (difference == 8 || difference == 6) {
//                 vsm_snow_obj_mttr.incident_number = "INC001002" + (j + 4);

//                 await snowModel.create(vsm_snow_obj_mttr);
//             }
//             if (difference == 4) {
//                 vsm_snow_obj_mttr.incident_number = "INC001002" + (j + 4);

//                 await snowModel.create(vsm_snow_obj_mttr);
//             }

//         }

//     }
//     catch (error) {
//         console.log(error);
//         throw error;
//     }

//     let itsm_tool_obj = {
//         status_category: {
//             New: {},
//             In_Progress: {},
//             Closed: {}

//         },
//         webhook_enable: false,
//         proxy_required: false,
//         application_key: application_key,
//         tool_url: "https://dev109540.service-now.com",
//         tool_instance_name: "serviceNowInstanceForSeeder",
//         tool_category: "ITSM",
//         tool_name: "ServiceNow",
//         tool_version: "v5",
//         tool_auth: {
//             auth_type: "password",
//             auth_username: "admin",
//             auth_password: "aFi5SHVSw4mq",
//         },
//         tool_users: {}
//     }
//     try {
//         var l = await toolModel.create(itsm_tool_obj);
//     }
//     catch (error) {
//         console.log("error----->", error);
//     }
//     console.log("end");

// }

// var pipeline_key;
// try {
//     pipeline_key = await generate_pipeline_key.generatePipelineKey();
// }
// catch (error) {
//     throw new Error(error.message);
// }
const seed_sla = async (pipeline_key) => {
    try {
        //var pipeline_key = await generate_pipeline_key.generatePipelineKey();
        let randnum = Math.round(Math.random() * (16 - 3) + 3);
        let randnum1 = Math.round(Math.random() * (16 - 3) + 3);
        let randnum2 = Math.round(Math.random() * (16 - 3) + 3);
        var slaarray = ["GT", "GTE", "LT", "LTE", "EQ", "BTWN"];
        var slaarraydata = slaarray[Math.floor(Math.random() * slaarray.length)]
        var slaarray_one = ["GT", "GTE", "LT", "LTE", "EQ", "BTWN"];
        var slaarraydata_one = slaarray_one[Math.floor(Math.random() * slaarray_one.length)]
        var slaarray_two = ["GT", "GTE", "LT", "LTE", "EQ", "BTWN"];
        var slaarraydata_two = slaarray_two[Math.floor(Math.random() * slaarray_two.length)]
        var tyarray = ["COUNT", "PERCENTAGE"];
        var tyarraydata = tyarray[Math.floor(Math.random() * tyarray.length)]
        var toolcatSet = ['SCM', 'CI', 'CODE ANALYSIS'];
        var tool_cat_value = toolcatSet[Math.floor(Math.random() * toolcatSet.length)];

        for (let i = 0; i < 3; i++) {
            console.log("ivalue--->", i);
            if (i == 0) {
                console.log("inside0--->", i);
                let slaobj = {
                    last_run: null,
                    pipeline_key: pipeline_key,
                    tool: "SCM",
                    entity: "Commits",
                    type: tyarraydata,
                    success: {
                        criteria: slaarraydata_one,
                        value: randnum
                    },
                    warning: {
                        criteria: slaarraydata,
                        value: randnum1
                    },
                    error: {
                        criteria: slaarraydata_two,
                        value: randnum2
                    },
                    scope: "PIPELINE",
                    status: true
                }
                await slaconfig.create(slaobj);

            }
            else if (i == 1) {
                console.log("inside1--->", i);
                var ciarray = ["Builds", "Successfull Builds", "Failed Builds"];
                var ciarraydata = ciarray[Math.floor(Math.random() * ciarray.length)]
                let slaobj1 = {
                    last_run: null,
                    pipeline_key: pipeline_key,
                    tool: "CI",
                    entity: ciarraydata,
                    type: tyarraydata,
                    success: {
                        criteria: slaarraydata_one,
                        value: randnum1
                    },
                    warning: {
                        criteria: slaarraydata_two,
                        value: randnum2
                    },
                    error: {
                        criteria: slaarraydata,
                        value: randnum
                    },
                    scope: "PIPELINE",
                    status: true
                }
                await slaconfig.create(slaobj1);

            }
            else {
                console.log("inside2--->", i);
                var codeaarray = ["Lines of Code", "Bugs", "Code Smells", "Duplication %", "Vulnerabilities"];
                var codeaarraydata = codeaarray[Math.floor(Math.random() * codeaarray.length)]
                let slaobj2 = {
                    last_run: null,
                    pipeline_key: pipeline_key,
                    tool: "CODE ANALYSIS",
                    entity: codeaarraydata,
                    type: tyarraydata,
                    success: {
                        criteria: slaarraydata,
                        value: randnum2
                    },
                    warning: {
                        criteria: slaarraydata_one,
                        value: randnum
                    },
                    error: {
                        criteria: slaarraydata_two,
                        value: randnum1
                    },
                    scope: "PIPELINE",
                    status: true
                }
                await slaconfig.create(slaobj2);
            }
        }
        var apparray = ["Sprints-Running Sprints", "Sprint-Pending Issues", "Backlog-Pending Issues", "Sprint-Story Points", "Estimated vs Actual"];
        var apparraydata = apparray[Math.floor(Math.random() * apparray.length)]
        let slaappobj = {
            last_run: null,
            pipeline_key: pipeline_key,
            tool: "PLANNING",
            entity: apparraydata,
            type: tyarraydata,
            success: {
                criteria: slaarraydata_one,
                value: randnum1
            },
            warning: {
                criteria: slaarraydata_two,
                value: randnum2
            },
            error: {
                criteria: slaarraydata,
                value: randnum
            },
            scope: "APPLICATION",
            status: true
        }
        await slaconfig.create(slaappobj);

        var clrarray = ["R", "G"];
        var clrarraydata = clrarray[Math.floor(Math.random() * clrarray.length)]
        var sldata = await slaconfig.find({ pipeline_key: pipeline_key });
        for (let k = 0; k < sldata.length; k++) {
            let randval = Math.round(Math.random() * (25 - 5) + 5);
            let sladashobj = {
                config_id: sldata[k]._id,
                pipeline_key: sldata[k].pipeline_key,
                timeline: {
                    value: randval,
                    indicator: clrarraydata,
                    type: sldata[k].type
                },
            }
            await sladatas.create(sladashobj);
        }
    }
    catch (error) {
        throw error;
    }
}


// const seed_dashboard = async () => {
//     try {

//     }
//     catch (error) {
//         throw error;
//     }
// }



//let seed_dashboard_response = await seed_dashboard(application_key, pipeline_name);



const seed_dashboard = async (application_key, pipeline_name) => {

    console.log("app key : ", application_key)
    console.log("pipe name : ", pipeline_name)

    try {
        var sprintCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // 2 week sprint for 6 months
        // for(i=1;i<=sprintCount_value;i++){
        //     sprintCount.push(i);
        // }
        var sprintItems = ['EPIC', 'STORY', 'BUG', 'TASK'];
        var issueStatus = ['TO DO', 'IN PROGRESS', 'DONE'];
        var phase = ['Development', 'Testing', 'Deployment'];
        var creation_status_pip = ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"];
        // startDate = // 6 months before
        var currentDate = new Date();
        var firstDate = new Date(currentDate);
        firstDate.setMonth(firstDate.getMonth() - 5);
        // var currentMonth = currentDate.getMonth() + 1;
        // var firstYear = currentMonth - 5;
        var startDate = new Date((firstDate.getMonth() + 1) + '/01/' + firstDate.getFullYear());
        // console.log(startDate);

        var endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14);//sprint duration 
        // console.log(endDate);

        // startDate.setMonth(firstMonth - 1);
        var response = [];

        var sprintID = Math.random().toString(36).slice(2);



        let tool_obj = {
            status_category: {
                New: {},
                In_Progress: {},
                Closed: {}

            },
            webhook_enable: false,
            proxy_required: false,
            application_key: application_key,
            tool_url: "http://54.87.195.230:8081",
            tool_instance_name: "jiraInstanceForSeeder",
            tool_category: "Planning",
            tool_name: "Jira",
            tool_version: "v5",
            tool_auth: {
                auth_type: "password",
                auth_username: "admin",
                auth_password: "admin",
            },
            tool_users: {}
        }

        var z = await toolModel.create(tool_obj);

        // console.log("after saving tool");
        try {
            var instance_planning = await toolModel.findOne({ application_key: application_key, tool_category: "Planning" }).lean();
        }
        catch (error) {
            throw error
        }
        // console.log("instance planning", instance_planning);

        await application.findOneAndUpdate(
            { application_key: application_key },
            {
                $set: {
                    'plan': {
                        creation_status: "SUCCESS",
                        configured: true,
                        is_sync: false,
                        project_url: "http://54.87.195.230:8081/projects/CDVSM",
                        tool_project_key: "CDVSM",
                        tool_project_name: "CDVSM",
                        create_webhook: true,
                        instance_details: {
                            tool_name: "Jira",
                            tool_version: "v5",
                            instance_name: "jiraInstanceForSeeder",
                            instance_id: instance_planning._id,
                            tool_roles: {}
                        }
                    },

                }
            },
            { upsert: true, new: true }
        );
        // console.log("after saving application plan");
        let issue_sprint_names = [];
        for (const i of sprintCount.keys()) {
            // for (let i = 1; i <= sprintCount.length; i++) {
            let backL = (Math.random() < 0.5);
            var sprint = {
                tool_project_key: 'CDVSM',
                // pipeline_key: pipeline_key,
                sprint_id: sprintID,
                sprint_logical_name: 'Demo-Sprint-' + (i + 1),
                start_date: startDate,
                end_date: endDate,
                sprint_active: i == 11 ? true : false,
                self: 'https://temp.jira.com/demoapp/test',
                story_points: {
                    points_committed: 43 + (i + 1),
                    points_completed: 40 + (i + 1)
                },
                application_key: application_key,
                epics: [],
                stories: [],
                bugs: [],
                tasks: [],
            };

            for (const j of sprintCount.keys()) {
                var item = sprintItems[Math.floor(Math.random() * sprintItems.length)];
                var item_phase = phase[Math.floor(Math.random() * phase.length)];

                var dateObj = calculatePdDate(startDate, endDate);

                var pdStartDate = dateObj.pdStartdate;
                var pdEndDate = dateObj.pdEndDate;
                var pd = {
                    isDelete: false,
                    issue_story_points: Math.floor(Math.random() * 7) == 0 ? 1 : Math.floor(Math.random() * 7),
                    issue_sprint: (backL == true) ? "" : sprint.sprint_logical_name,
                    // issue_sprint: sprint.sprint_logical_name,
                    timeoriginalestimate: Math.floor(Math.random() * (400000 - 150000 + 1)) + 150000,
                    timespent: Math.floor(Math.random() * (400000 - 150000 + 1)) + 150000,
                    issue_wastage_days: 0,
                    issue_type: item,
                    issue_name: `Temp ${item.toLocaleLowerCase()} - ${(j + 1)}`,
                    issue_desc: `Temp Desc for issue - ${item.toLocaleLowerCase()} - ${(j + 1)}`,
                    application_key: application_key,
                    sprint_id: sprintID,
                    issue_id: (j + 1),
                    issue_key: (j + 1),
                    actual_start_date: pdStartDate,
                    actual_end_date: pdEndDate,
                    assigned_to: 'Temp',
                    reporter: 'System',
                    issue_status: j < 11 ? 'DONE' : issueStatus[Math.floor(Math.random() * issueStatus.length)],
                    phase: item_phase,
                    isSpillOver: (Math.random() < 0.5),
                    isBacklog: backL,
                    completionTime: Math.floor(Math.random() * (25 - 2 + 1)) + 2,
                    lT: Math.floor(Math.random() * (9 - 1 + 1)) + 1,
                    pT: Math.floor(Math.random() * (11 - 2 + 1)) + 2,
                }
                switch (pd.issue_type) {
                    case 'TASK':
                        sprint.tasks.push(pd.issue_id);
                        break;
                    case 'EPIC':
                        sprint.epics.push(pd.issue_id);
                        break;
                    case 'STORY':
                        sprint.stories.push(pd.issue_id);
                        break;
                    case 'BUG':
                        sprint.bugs.push(pd.issue_id);
                        break;
                }
                // console.log("pd---->", pd)
                var pdata = await planning_data.create(pd);

            }

            var s = await sprintModel.create(sprint);

            response.push(s);



            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() + 1);

            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 14);

        }

        var sprintOfApplication = await sprintModel.find({ application_key: application_key, sprint_active: true }).lean();
        try {

            for (let i = 0; i < 10; i++) {

                let sprint_start_d = sprintOfApplication[0].start_date;
                let sprint_end = sprintOfApplication[0].end_date;
                // var startDate = new Date((firstDate.getMonth() + 1) + '/01/' + firstDate.getFullYear());
                let incident_opened1 = new Date(sprint_start_d);
                incident_opened1.setDate(sprint_start_d.getDate() + 2);
                let incident_opened2 = new Date(sprint_start_d);
                incident_opened2.setDate(sprint_start_d.getDate() + 4);
                let incident_opened3 = new Date(sprint_start_d);
                incident_opened3.setDate(sprint_start_d.getDate() + 6);
                // let incident_opened4 = new Date( sprint_start_d);
                // incident_opened4.setDate(sprint_start_d.getDate() + 16);
                let incident_opened_dates = [incident_opened1, incident_opened2, incident_opened3];
                var stc_dt = [1500000, 390000, 270000, 500000, 240000];
                var cal_stc = stc_dt[Math.floor(Math.random() * stc_dt.length)];
                let incident_opened = incident_opened_dates[Math.floor(Math.random() * incident_opened_dates.length)];
                // console.log("sprindate l1",sprintOfApplication[0].start_date);
                // console.log("sprindate",sprint_start_d);
                // console.log("incidentopened",incident_opened);

                // incident_opened.setDate((sprint_start_d.getDate() + Math.floor(Math.random() * (3 - 1 + 1)) + 1))
                let incident_closed1 = new Date(incident_opened1);
                incident_closed1.setDate(incident_opened1.getDate() + 7);
                // let incident_closed2 = new Date(incident_opened2);
                // incident_closed2.setDate(incident_opened2.getDate() + 6);
                // let incident_closed3 = new Date(incident_opened3);
                // incident_closed3.setDate(incident_opened3.getDate() + 3);
                // let incident_closed4 = new Date(incident_opened4);
                // incident_closed4.setDate(incident_opened4.getDate() + 4);
                let incident_closing = ["", incident_closed1];

                let incident_closing_date = incident_closing[Math.floor(Math.random() * incident_closing.length)];
                // let incident_state = ["Closed"];
                let vsm_snow_obj = {
                    application_key: application_key,
                    incident_number: "INC001001" + (i + 1),
                    calendar_stc: (incident_closing_date == "") ? "" : cal_stc,
                    opened_at: incident_opened,
                    closed_at: incident_closing_date,
                    incident_state: (incident_closing_date == "") ? "New" : "Closed"
                }

                await snowModel.create(vsm_snow_obj);
            }
            let jlength = 9
            for (let j = 0; j < 6; j++) {
                let graph_mttr_date = sprintOfApplication[0].start_date;
                let difference = (jlength - j);
                var stc_d = [1500000, 390000, 270000, 500000, 240000];
                var cal_stcd = stc_d[Math.floor(Math.random() * stc_d.length)];
                let incident_opened_mttr = new Date(graph_mttr_date);
                incident_opened_mttr.setMonth(incident_opened_mttr.getMonth() - difference);
                let incident_closed_mttr = incident_opened_mttr;
                incident_closed_mttr.setDate(incident_opened_mttr.getDate() + 2);
                let vsm_snow_obj_mttr = {
                    application_key: application_key,
                    incident_number: "INC001002" + (j + 1),
                    calendar_stc: cal_stcd,
                    opened_at: incident_opened_mttr,
                    closed_at: incident_closed_mttr,
                    incident_state: "Closed"
                }

                let rn = Math.random() * (16 - 3) + 3;
                for (let i = 0; i < rn; i++) {
                    await snowModel.create(vsm_snow_obj_mttr);
                }

                // await snowModel.create(vsm_snow_obj_mttr);
                // if (difference == 8 || difference == 6) {
                //     vsm_snow_obj_mttr.incident_number = "INC001002" + (j + 4);

                //     await snowModel.create(vsm_snow_obj_mttr);
                // }
                // if (difference == 4) {
                //     vsm_snow_obj_mttr.incident_number = "INC001002" + (j + 4);

                //     await snowModel.create(vsm_snow_obj_mttr);
                // }

            }

        }
        catch (error) {

            throw error;
        }

        try {
            let gitlab_tool_obj = {
                status_category: {
                    New: {},
                    In_Progress: {},
                    Closed: {}

                },
                webhook_enable: false,
                proxy_required: false,
                application_key: application_key,
                tool_url: "https://gitlab.com",
                tool_instance_name: "GitlabInstanceForSeeder",
                tool_category: "Source Control",
                tool_name: "GitLab",
                tool_version: "v1",
                tool_auth: {
                    auth_type: "Token",
                    auth_token: "tSS3dQ3c2zepLr5Wv_-C"
                },
                tool_users: {}
            }
            var gitlabcr = await toolModel.create(gitlab_tool_obj);
            console.log("gittt", gitlabcr);


            let bitb_tool_obj = {
                status_category: {
                    New: {},
                    In_Progress: {},
                    Closed: {}

                },
                webhook_enable: false,
                proxy_required: false,
                application_key: application_key,
                tool_url: "http://54.87.195.230:7990",
                tool_instance_name: "BitbucketInstanceForSeeder",
                tool_category: "Source Control",
                tool_name: "Bitbucket",
                tool_version: "v1",
                tool_auth: {
                    auth_type: "password",
                    auth_username: "admin",
                    auth_password: "admin",
                },
                tool_users: {}
            }
            var bbcr = await toolModel.create(bitb_tool_obj);
            console.log("bitbuckett", bbcr);


            let azurep_tool_obj = {
                status_category: {
                    New: {},
                    In_Progress: {},
                    Closed: {}

                },
                webhook_enable: false,
                proxy_required: false,
                application_key: application_key,
                tool_url: "https://dev.azure.com",
                tool_instance_name: "AzurerepoInstanceForSeeder",
                tool_category: "Source Control",
                tool_name: "Azure Repos",
                tool_version: "v5",
                tool_auth: {
                    auth_type: "Token",
                    auth_token: "4jqty3je3rikr2njoujr3ldw7rz27xhk5vehdksfqy62tltyjiea"
                },
                tool_users: {}
            }
            var azrcr = await toolModel.create(azurep_tool_obj);


            let jenkins_tool_obj = {
                status_category: {
                    New: {},
                    In_Progress: {},
                    Closed: {}

                },
                webhook_enable: false,
                proxy_required: false,
                application_key: application_key,
                tool_url: "http://54.87.195.230:8080",
                tool_instance_name: "JenkinsInstanceForSeeder",
                tool_category: "Continuous Integration",
                tool_name: "Jenkins",
                tool_version: "v1",
                tool_auth: {
                    auth_type: "password",
                    auth_username: "cldadmin",
                    auth_password: "admin",
                },
                tool_users: {}
            }
            var jenkincr = await toolModel.create(jenkins_tool_obj);


            let sonar_obj = {
                status_category: {
                    New: {},
                    In_Progress: {},
                    Closed: {}

                },
                webhook_enable: false,
                proxy_required: false,
                application_key: application_key,
                tool_url: "http://54.87.195.230:8085",
                tool_instance_name: "SonarInstanceForSeeder",
                tool_category: "Code Analysis",
                tool_name: "Sonarqube",
                tool_version: "v1",
                tool_auth: {
                    auth_type: "password",
                    auth_username: "admin",
                    auth_password: "admin",
                },
                tool_users: {}

            }
            var sonar_create = await toolModel.create(sonar_obj);
        } catch (error) {
            throw error;
        }

        let itsm_tool_obj = {
            status_category: {
                New: {},
                In_Progress: {},
                Closed: {}

            },
            webhook_enable: false,
            proxy_required: false,
            application_key: application_key,
            tool_url: "https://dev109540.service-now.com",
            tool_instance_name: "serviceNowInstanceForSeeder",
            tool_category: "ITSM",
            tool_name: "ServiceNow",
            tool_version: "v5",
            tool_auth: {
                auth_type: "password",
                auth_username: "admin",
                auth_password: "aFi5SHVSw4mq",
            },
            tool_users: {}
        }
        var l = await toolModel.create(itsm_tool_obj);
        return response = "success";
    }
    catch (error) {
        throw error;
    }

}

const seed_pipelines = async (application_key, pipeline_name, pipeline_key) => {
    try {
        var creation_status_pip = ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"];
        var pipe_data, pipeline_id;
        let pipeline_type = "PIPELINE_STANDARD";
        let i = 0;
        try {
            let stat = creation_status_pip[Math.floor(Math.random() * creation_status_pip.length)];
            pipe_data = await pipeline.findOneAndUpdate({
                "pipeline_key": pipeline_key
            }, {
                "$set": {
                    "pipeline_name": pipeline_name,
                    "pipeline_key": pipeline_key,
                    "application_key": application_key,
                    "pipeline_description": "seedData_demo_pipeline",
                    "pipeline_type": pipeline_type,
                    "pipeline_workflow_ui_data": {
                        "nodes": [{
                            "id": i + 1,
                            "label": "Start",
                            "task": {
                                "task_name": "This is start node",
                                "task_key": "start_node"
                            }
                        }, {
                            "id": i + 2,
                            "label": "End",
                            "task": {
                                "task_name": "This is end node",
                                "task_key": "end_node"
                            }
                        }, {
                            "id": i + 3,
                            "label": "security",
                            "category": "Security",
                            "task": {
                                "task_name": "CodeDx SAST",
                                "task_key": "CodeDx_SAST",
                                "Tool Instance Name": "ftdytr",
                                "Project Name": "Canvas DevOps Demo",
                                "Context Name": "Security",
                                "Project Id": "demoId",
                            }
                        }],
                    },
                },
            }, { upsert: true, setDefaultsOnInsert: true, new: true })
            pipeline_id = pipe_data._id;
            try {
                let application_name = await save_pipeline_info.save_pipeline_in_application(application_key, pipeline_id);
                //console.log("Utility app name : ", application_name);

            }
            catch (error) {

                throw new Error(error.message);
            }
        }
        catch (error) {
            logger.error('error.message save info = ', error.message);
            let err = new Error(error.message);
            throw err;
        }
        var ca_analysis_id = Math.random().toString(36).slice(2);
        // console.log("ca_analysis_id ", ca_analysis_id)
        var ca_project_key = Math.random().toString(36).substr(2, 8);
        // console.log("ca_project_key ", ca_project_key)

        let newCodeAnalysis = {
            analysis_id: ca_analysis_id,
            pipeline_key: pipeline_key,
            tool_project_key: ca_project_key,
            nloc: Math.floor(Math.random() * (1900 - 1300) + 1300),
            line_coverage: Math.floor(Math.random() * (80 - 30) + 30),
            violations: Math.floor(Math.random() * (2 - 0) + 0),
            vulnerabilities: Math.floor(Math.random() * (5 - 1) + 1),
            technical_debt: Math.floor(Math.random() * (4000 - 1200) + 1200),
            bugs: Math.floor(Math.random() * (45 - 10) + 10),
            code_smells: Math.floor(Math.random() * (400 - 130) + 130),
            duplication: Math.floor(Math.random() * (100 - 30) + 30),

        };


        try {
            await code_analysis.findOneAndUpdate(
                { analysis_id: ca_analysis_id },
                newCodeAnalysis,
                { upsert: true }
            );

            let sonar_roles = ["admin", "codeviewer", "issueadmin", "scan", "user"];
            let temp = {
                onboarded: true,
                code_quality: {
                    creation_status: "SUCCESS",
                    tool_project_key: ca_project_key,
                    tool_project_name: "test sonar",
                    is_sync: false,
                    project_url: "http://54.87.195.230:8085/projects/" + ca_project_key,
                    configured: true,
                    instance_details: {
                        tool_name: "Sonarqube",
                        instance_name: "fytc",
                        instance_id: "",
                        //instance_id: "ObjectId('60e8399bca879c3d1046a674')",
                        tool_roles: sonar_roles,
                    },
                },
            };

            await pipeline.findOneAndUpdate(
                {
                    pipeline_key: pipeline_key,
                },
                temp,
                {
                    upsert: true,
                }
            );
            update_creation_status.set_creation_status(
                pipeline_key,
                "code_quality",
                "SUCCESS"
            );
        }
        catch (err) {
            update_creation_status.set_creation_status(
                pipeline_key,
                "code_quality",
                "FAILED"
            );

        }

        var qd = {
            pipeline_key: pipeline_key,
            build_number: '' + Math.floor(Math.random() * (40 - 35 + 1)),
            crawling_time: '' + Math.floor(Math.random() * (561 - 536 + 1)),
            Assesment_Time: '' + Math.floor(Math.random() * (15 - 13 + 1)),
            Requests_Performed: '' + Math.floor(Math.random() * (244 - 243 + 1)),
            Links_Crawled: '' + Math.floor(Math.random() * (12 - 10 + 1)),
            vulnerabilities: '' + Math.floor(Math.random() * 10),
            sensitive_contents: '' + Math.floor(Math.random() * 100) / 100,
            Information_Gathered: '' + Math.floor(Math.random() * 100) / 100,
            Level_5: '' + Math.floor(Math.random() * 100) / 100,
            Level_4: '' + Math.floor(Math.random() * 100) / 100,
            Level_3: '' + Math.floor(Math.random() * 100) / 100,
            Level_2: '' + Math.floor(Math.random() * 100) / 100,
            Level_1: '' + Math.floor(Math.random() * 100) / 100,
            Cross_Site: '' + Math.floor(Math.random() * 100) / 100,
            SQL_Injection: '' + Math.floor(Math.random() * 100) / 100,
            Information_Disclosure: '' + Math.floor(Math.random() * 100) / 100,
            Path_Disclosure: '' + Math.floor(Math.random() * 100) / 100,
            Injection: '' + Math.floor(Math.random() * 100) / 100,
            Broken_Authentication: '' + Math.floor(Math.random() * 100) / 100,
            Sensitive_Data: '' + Math.floor(Math.random() * 100) / 100,
            XML_XXE: '' + Math.floor(Math.random() * 100) / 100,
            Broken_Access: '' + Math.floor(Math.random() * 100) / 100,
            Security_Misconfiguration: '' + Math.floor(Math.random() * 100) / 100,
            Cross_XSS: '' + Math.floor(Math.random() * 100) / 100,
            Insecure: '' + Math.floor(Math.random() * 100) / 100,
            Using_Vulnerabilities: '' + Math.floor(Math.random() * 100) / 100,
            Insufficient_Logging: '' + Math.floor(Math.random() * 100) / 100,
            Links_Collected: '' + Math.floor(Math.random() * 53),
            Ajax_Links_Crawled: '' + Math.floor(Math.random() * 28),
            Requests_Crawled: '' + Math.floor(Math.random() * 55),
            Unexpected_Errors: '' + Math.floor(Math.random() * 6),
            Avg_Response_Time: '' + Math.floor(Math.random() * 100) / 100,
        }

        var d = await dast_qualys_model.create(qd);

        //response.push(d);

    } catch (err) {
        //res.status(500).send({ data: err.message });
        console.log(err);
    }
    try {

        var randomBuildStateCount = Math.floor(Math.random() * (15 - 10) + 10);

        for (i = 0; i < randomBuildStateCount; i++) {
            var buildResult = ['SUCCESS', 'FAILURE', 'ABORTED', 'IN PROGRESS'];

            var build_result_value = buildResult[Math.floor(Math.random() * buildResult.length)];

            // console.log("build result value: ", build_result_value);

            var currentDate = new Date();
            var buildDate = currentDate.setMonth(currentDate.getMonth() - 1);


            var total_Count = Math.floor(Math.random() * (7 - 3) + 3);
            var fail_Count = Math.floor(Math.random() * (2 - 0) + 0);
            var tests_Result;

            if (fail_Count == 0) {
                tests_Result = 'PASS';
            } else {
                tests_Result = 'FAIL';
            };

            var total_Count2 = Math.floor(Math.random() * (7 - 3) + 3);
            var fail_Count2 = Math.floor(Math.random() * (2 - 0) + 0);
            var tests_Result2;

            if (fail_Count2 == 0) {
                tests_Result2 = 'PASS';
            } else {
                tests_Result2 = 'FAIL';
            };

            let ci_data_value = {
                build_number: i + 1,
                build_cause: "Started by user for demo",
                build_result: build_result_value,
                build_fullDisplayName: "demo build - " + i + 1,
                build_url: "//http://demo.com/job/test",
                job_name: "demo job - " + i + 1,
                pipeline_key: pipeline_key,
                build_duration: Math.floor(Math.random() * (160 - 70) + 70),
                job_url: "demo url",
                build_timestamp: buildDate,
                code_analysis_id: ca_analysis_id,
                build_commit_set: [], //number of commits in the build
                build_test: {
                    unit_test: {
                        totalCount: total_Count,
                        failCount: fail_Count,
                        skipCount: 0,
                        testsResult: tests_Result
                    },

                    functional_test: {
                        totalCount: total_Count2,
                        failCount: fail_Count2,
                        skipCount: 0,
                        testsResult: tests_Result2
                    }
                }
            };


            let pass_test = Math.floor(Math.random() * (8 - 4) + 4)
            let fail_count = Math.floor(Math.random() * (3 - 0) + 0)
            let total_count_test = pass_test + fail_count;
            let test_data_set = {
                pipeline_key: pipeline_key,
                build_number: i + 1, //build no
                test_result: fail_count > 0 ? 'FAILED' : 'PASSED', //test_data.result 
                test_pass_count: pass_test,
                test_duration: Math.floor(Math.random() * (20 - 10) + 10), //"duration": 31713,
                test_fail_count: fail_count,
                total_test: total_count_test
            }


            await test_data_db.findOneAndUpdate(
                { 'pipeline_key': pipeline_key, 'build_number': test_data_set.build_number },
                test_data_set,
                { upsert: true }
            );

            // console.log(ci_data_value);
            await ci_data.create(ci_data_value, { upsert: true, new: true });
        }

        try {
            await pipeline.findOneAndUpdate({
                "pipeline_key": pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "continuous_integration": {
                        "creation_status": "SUCCESS",
                        "job_url": "http://54.87.195.230:8080/job/",
                        "job_name": "demo job",
                        "configured": true,
                        "is_sync": false,
                        "tool_project_key": "",
                        "tool_project_name": "test jenkins",
                        "instance_details": {
                            "tool_name": "Jenkins",
                            "instance_name": "gfxht",
                            "instance_id": "",
                            // "instance_id": "ObjectId('60e83973ca879c3d1046a5b9')",
                            "tool_roles": ""
                        }
                    },
                    "scm": {

                        "creation_status": "SUCCESS",

                        "configured": true,

                        "is_sync": false,

                        "project_url": "https://gitlab.com/groups/lti_cldpractice",

                        "repo_url": "https://gitlab.com/projects/25576305",

                        "repo_name": "dummy project",

                        "branch_name": "master",

                        "tool_project_key": "",

                        "tool_project_name": "LTI",

                        "scm_type": "git",

                        "instance_details": {

                            "tool_name": "GitLab",

                            "instance_name": "shgfsaja",

                            "instance_id": "",

                            "tool_roles": []

                        }
                    }
                }
            }, { upsert: true })
        }
        catch (err) {
            err = new Error(`Error Updating project ${project_key}`)
            throw err;
        }

        try {

            for (j = 0; j < 40; j++) {

                let additionsValue = Math.floor(Math.random() * (8 - 4) + 4);
                let deletionsValue = Math.floor(Math.random() * (3 - 1) + 1);
                let editsValue = Math.floor(Math.random() * (6 - 2) + 2);
                let totalValue = additionsValue + deletionsValue + editsValue;
                var today = new Date();
                var userSet = ['Goutham', 'Manoj', 'Ryan', 'Saurabh', 'Yash', 'Vivek', 'Soumya'];
                var user_set_value = userSet[Math.floor(Math.random() * userSet.length)];

                try {
                    var commit_ = await sprintModel.findOne({ application_key: application_key, sprint_active: true });
                    var commit_sd = new Date(commit_.start_date);
                    var commit_time1 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (3 - 2) + 2));
                    // console.log("commit times", commit_times);
                    var commit_time2 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (5 - 4) + 4));
                    var commit_time3 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (7 - 6) + 6));
                    var commit_time4 = commit_sd.setDate(commit_sd.getDate() + Math.floor(Math.random() * (9 - 8) + 8));

                    var nowDate = new Date();
                    var commitDateNew = new Date(nowDate);
                    commitDateNew.setMonth(commitDateNew.getMonth() - 1);

                    var commit_time5 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (6 - 4) + 4));
                    var commit_time6 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (9 - 7) + 7));
                    var commit_time7 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (12 - 10) + 10));
                    var commit_time8 = commitDateNew.setDate(commitDateNew.getDate() + Math.floor(Math.random() * (15 - 13) + 13));

                }
                catch (error) {
                    // console.log("errr--->", error);
                    throw error;
                }
                // console.log("ct---", commit_time1);
                // console.log("t---", today);
                var commit_d = [commit_time1, commit_time2, commit_time3, commit_time4, commit_time5, commit_time6, commit_time7, commit_time8, today];
                var commit_date = commit_d[Math.floor(Math.random() * commit_d.length)]
                var commitID = Math.floor(Math.random() * (500 - 100) + 100);

                let commit_data_set = {
                    type: "COMMIT",
                    commit_id: Math.random().toString(36).slice(2),
                    commit_msg: "demo commit - " + commitID,
                    commit_author: user_set_value,
                    commit_timestamp: commit_date,
                    commit_branch: "refs/heads/demoCommit",
                    commit_project_key: pipeline_key,
                    commit_project_id: commitID,
                    commit_for_build_id: "",
                    commit_plan_issues: [],
                    pipeline_key: pipeline_key,
                    is_pr_deleted: false,
                    stats: {
                        additions: additionsValue,
                        deletions: deletionsValue,
                        edits: editsValue,
                        total: totalValue
                    }
                };
                // console.log(commit_data_set);
                await scm_data.create(commit_data_set, { upsert: true, new: true });

                // console.log(ci_data_value.build_commit_set[j]);
            }

        }
        catch (error) {
            throw error;

        }

        try {

            var authorSet = ['Ryan', 'Saurabh', 'Yash'];

            for (k = 0; k < 20; k++) {

                var author_set_value = authorSet[Math.floor(Math.random() * authorSet.length)];

                var pullnowDate = new Date();
                var pullDateNew = new Date(pullnowDate);
                pullDateNew.setMonth(pullDateNew.getMonth() - 1);

                var pull_time1 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (6 - 4) + 4));
                var pull_time2 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (9 - 7) + 7));
                var pull_time3 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (12 - 10) + 10));
                var pull_time4 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (15 - 13) + 13));
                var pull_time5 = pullDateNew.setDate(pullDateNew.getDate() + Math.floor(Math.random() * (18 - 16) + 16));

                var pull_d = [pull_time1, pull_time2, pull_time3, pull_time4, pull_time5];
                var pullDate = pull_d[Math.floor(Math.random() * pull_d.length)]

                var pullId = k + 1;

                let pull_data_set = {
                    type: "PULL",
                    pull_id: pullId,
                    pull_project_key: "PR-" + pullId,
                    pipeline_key: pipeline_key,
                    pull_source: "refs/heads/feature/featureName" + pullId,
                    pull_destination: "refs/heads/master",
                    pull_author: author_set_value,
                    createdAt: pullDate,
                    updatedAt: pullDate,
                    closedAt: pullDate,
                    commit_plan_issues: [],
                    pull_reviewers: [],
                    is_pr_deleted: false,
                    pull_title: "/feature/featureName" + pullId,
                    pull_desc: "demo seeder data simulation task",
                    pull_state: "MERGED"

                };
                // console.log(pull_data_set);
                await scm_data.create(pull_data_set, { upsert: true, new: true });

            }


        }
        catch (error) {
            throw error;

        }


    } catch (error) {
        throw error;
    }
}
module.exports = utility_service;