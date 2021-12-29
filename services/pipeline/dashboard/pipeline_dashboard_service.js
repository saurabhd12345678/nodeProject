var Code_analysis = require('../../../models/code_analysis');
var azure_data = require('../../../models/azure_test_data');
var CI_Data = require('../../../models/ci_data');


var moment = require('moment');
var pipeline_dashboard_components = require('../../../models/pipeline_dashboard_components');
var pipeline = require('../../../models/pipeline');
var tool = require('../../../models/tool');
var servicenow_connector = require('../../../connectors/servicenow/servicenow_crud');
var bitbucket_kpi = require('../../../connectors/bitbucket/bitbucket_kpis');
var pipeline_dashboard_unit_testing = require('../../../models/pipeline_dashboard_unit_testing');
var pipeline_dashboard_functional_testing = require('../../../models/pipeline_dashboard_functional_testing');
var pipeline_dashboard_performance_testing = require('../../../models/pipeline_dashboard_performance_testing');
var pipeline_dashboard_monitoring = require('../../../models/pipeline_dashboard_monitoring');
var pipeline_dashboard_security = require('../../../models/pipeline_dashboard_security');
var pipeline_dashboard_defect_distribution = require('../../../models/pipeline_dashboard_defect_distribution');
var pipeline_dashboard_deployment = require('../../../models/pipeline_dashboard_deployment');
var workflow_master_task = require('../../../models/workflow_master_task');
var d3 = require('d3-collection');
var pipeline_workflow = require('../../../models/pipeline_workflow');


var Tool = require('../../../models/tool')

var Sprint = require('../../../models/sprint')
var PlanningDatas = require('../../../models/planning_data');
var Application = require('../../../models/application');

var unirest = require('unirest');

var scm_data = require('../../../models/scm_data');
var qualys_data = require('../../../models/dast_qualys_data');
var hashicorp_vault_helper = require("../../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../../connectors/hashicorp-vault/read_secret");
var workflow_build_data = require("../../workflow/workflow_service");

moment().format();
let currentDate = new Date();
currentDate.setHours(23);
currentDate.setMinutes(59);
currentDate.setSeconds(59);

module.exports = {

    /**
 * function gets build data for the application
 * @param {String} pipeline_key
 *
 */

    addComponent: async (dashboard_component) => {
        try {
            await pipeline_dashboard_components.create(dashboard_component);
            return true;
        }
        catch (error) {
            throw error;
        }
    },

    /**
    * function gets build data for the application
    * @param {String} pipeline_key
    *
    */
    getBuildData: async (pipeline_key) => {
        try {
            let ci_build_data = await CI_Data.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: -1 }).limit(5);

            // console.log("Build data in service : ",ci_build_data);

            let ci_graph_data = [];

            for await (let data of ci_build_data) {
                let buildsObject = {
                    "build_number": data.build_number,
                    "build_duration": data.build_duration
                }
                // console.log("Build Object : " ,buildsObject);

                ci_graph_data.push(buildsObject)

            }

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            // console.log("tool_details line 91 : ",tool_details);

            let tool_url;
            let pipline_type
            let tool
            if (tool_details != null) {

                if (tool_details.pipeline_description == 'seedData_demo_pipeline') {

                    tool_url = "http://54.87.195.230:8080";

                    pipline_type = "PIPELINE_STANDARD";

                }
                else {
                    tool = await Tool.findOne({ _id: tool_details.continuous_integration.instance_details.instance_id });

                    tool_url = tool.tool_url
                    pipline_type = tool_details.pipeline_type
                }

            }




            let filter_date = new Date();
            //  filter_date = filter_date.setMonth(1)

            let week_1 = new Date();

            let pastDate = week_1.getDate() - 28;
            week_1.setDate(pastDate);
            filter_date = week_1;
            let week_2 = new Date();

            pastDate = week_2.getDate() - 21;
            week_2.setDate(pastDate);


            let week_3 = new Date();

            pastDate = week_3.getDate() - 14;
            week_3.setDate(pastDate);

            let week_4 = new Date();

            pastDate = week_4.getDate() - 7;
            week_4.setDate(pastDate);

            let status_count = [0, 0, 0, 0];

            //    success       FAILURE       ABORTED      IN PROGRESS
            let week_data = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
            let avg_build_time = [0, 0, 0, 0]
            let sum = [0, 0, 0, 0];
            let count = [0, 0, 0, 0];
            let build_number_count = [0, 0, 0, 0]
            let total_builds = 0;

            if (pipline_type == "PIPELINE_STANDARD" || pipline_type == "PIPELINE_EXISTING") {

                let ci_data = await CI_Data.find({
                    pipeline_key: pipeline_key, "createdAt": {

                        $gte: filter_date
                    }
                })

                for (let build of ci_data) {
                    if (build.createdAt <= filter_date && build.createdAt > week_4) {
                        sum[3] = sum[3] + Number(build.build_duration);
                        build_number_count[3]++;
                        count[3]++
                        if (build.build_result == "SUCCESS") {
                            week_data[0][0]++;
                        } else if (build.build_result == "FAILURE") {
                            week_data[1][0]++;
                        } else if (build.build_result == "ABORTED") {
                            week_data[2][0]++;
                        } else {
                            //INPROGRESS
                            week_data[3][0]++;
                        }



                    } else if (build.createdAt <= week_4 && build.createdAt > week_3) {

                        sum[2] = sum[2] + Number(build.build_duration);
                        build_number_count[2]++;
                        count[2]++

                        if (build.build_result == "SUCCESS") {
                            week_data[0][1]++;
                        } else if (build.build_result == "FAILURE") {
                            week_data[1][1]++;
                        } else if (build.build_result == "ABORTED") {
                            week_data[2][1]++;
                        } else {//INPROGRESS
                            week_data[3][1]++;

                        }



                    } else if (build.createdAt <= week_3 && build.createdAt > week_2) {
                        sum[1] = sum[1] + Number(build.build_duration);
                        build_number_count[1]++;
                        count[1]++

                        if (build.build_result == "SUCCESS") {
                            week_data[0][2]++;
                        } else if (build.build_result == "FAILURE") {
                            week_data[1][2]++;
                        } else if (build.build_result == "ABORTED") {
                            week_data[2][2]++;
                        } else {//INPROGRESS
                            week_data[3][2]++;

                        }


                    } else {
                        sum[0] = sum[0] + Number(build.build_duration);
                        build_number_count[0]++;
                        count[0]++
                        if (build.build_result == "SUCCESS") {
                            week_data[0][3]++;
                        } else if (build.build_result == "FAILURE") {
                            week_data[1][3]++;
                        } else if (build.build_result == "ABORTED") {
                            week_data[2][3]++;
                        } else {//INPROGRESS
                            week_data[3][3]++;

                        }




                    }


                    total_builds++;

                    if (build.build_result == "SUCCESS") {
                        status_count[0]++;
                    } else if (build.build_result == "FAILURE") {
                        status_count[1]++;
                    } else if (build.build_result == "ABORTED") {
                        status_count[2]++;
                    } else {//INPROGRESS
                        status_count[3]++;

                    }

                }
                // avg_build_time[0] = count[0] == 0 ? 0 : (sum[0] / count[0]);
                // avg_build_time[1] = count[1] == 0 ? 0 : (sum[1] / count[1]);
                // avg_build_time[2] = count[2] == 0 ? 0 : (sum[2] / count[2]);
                // avg_build_time[3] = count[3] == 0 ? 0 : (sum[3] / count[3]);
                avg_build_time[0] = Math.round((count[0] == 0 ? 0 : (sum[0] / count[0])) * 100) / 100;

                avg_build_time[1] = Math.round((count[1] == 0 ? 0 : (sum[1] / count[1])) * 100) / 100;

                avg_build_time[2] = Math.round((count[2] == 0 ? 0 : (sum[2] / count[2])) * 100) / 100;

                avg_build_time[3] = Math.round((count[3] == 0 ? 0 : (sum[3] / count[3])) * 100) / 100;

                return {
                    buid_data: status_count, total_build: total_builds, week_data: week_data, tool_url: tool_url, avg_duration: avg_build_time,
                    avg_num: count
                };

            } else {

                let ci_data = await pipeline_workflow.find({
                    pipeline_key: pipeline_key, "start_time": {

                        $gte: filter_date
                    }
                })
                let workflow_data = await workflow_build_data.getPipelineWorkflowExecutions(pipeline_key);

                let build_duration_array = [];
                ci_data.filter((build) => {
                    let flagbuild = false;
                    workflow_data.filter((build_workflow) => {
                        if (build_workflow.execution_number == build.execution_number) {

                            build["build_duration"] = build_workflow.duration;
                            flagbuild = true;
                        }
                    })
                    if (!flagbuild) {
                        build["build_duration"] = 0;
                    }

                    build_duration_array.push(build)
                })
                ci_data = build_duration_array;

                for (let build of ci_data) {
                    let status = build.pipeline_workflow_ui_data.nodes[1].status
                    if (build.start_time <= filter_date && build.start_time > week_4) {
                        sum[3] = sum[3] + Number(build.build_duration);
                        build_number_count[3] = build_number_count[3] + Number(build.execution_number);
                        count[3]++
                        if (status == "COMPLETE") {
                            week_data[0][0]++;
                        } else if (
                            status ==
                            "DISABLED"
                        ) {
                            week_data[1][0]++;
                        } else if (
                            status ==
                            "ABORTED"
                        ) {
                            week_data[2][0]++;
                        } else {
                            //INPROGRESS
                            week_data[3][0]++;
                        }


                    } else if (build.start_time <= week_4 && build.start_time > week_3) {
                        sum[2] = sum[2] + Number(build.build_duration);
                        build_number_count[2] = build_number_count[2] + Number(build.execution_number);
                        count[2]++
                        if (status == "COMPLETE") {
                            week_data[0][1]++;
                        } else if (
                            status ==
                            "DISABLED"
                        ) {
                            week_data[1][1]++;
                        } else if (
                            status ==
                            "ABORTED"
                        ) {
                            week_data[2][1]++;
                        } else {
                            //INPROGRESS
                            week_data[3][1]++;
                        }

                    } else if (build.start_time <= week_3 && build.start_time > week_2) {
                        sum[1] = sum[1] + Number(build.build_duration);
                        build_number_count[1] = build_number_count[1] + Number(build.execution_number);
                        count[1]++
                        if (status == "COMPLETE") {
                            week_data[0][2]++;
                        } else if (
                            status ==
                            "DISABLED"
                        ) {
                            week_data[1][2]++;
                        } else if (
                            status ==
                            "ABORTED"
                        ) {
                            week_data[2][2]++;
                        } else {
                            //INPROGRESS
                            week_data[3][2]++;
                        }

                    } else {
                        sum[0] = sum[0] + Number(build.build_duration);
                        build_number_count[0] = build_number_count[0] + Number(build.execution_number);
                        count[0]++
                        if (status == "COMPLETE") {
                            week_data[0][3]++;
                        } else if (
                            status ==
                            "DISABLED"
                        ) {
                            week_data[1][3]++;
                        } else if (
                            status ==
                            "ABORTED"
                        ) {
                            week_data[2][3]++;
                        } else {
                            //INPROGRESS
                            week_data[3][3]++;
                        }




                    }
                    total_builds++;

                    if (status == "COMPLETE") {
                        status_count[0]++;
                    } else if (
                        status == "DISABLED"
                    ) {
                        status_count[1]++;
                    } else if (
                        status == "ABORTED"
                    ) {
                        status_count[2]++;
                    } else {
                        //INPROGRESS
                        status_count[3]++;
                    }
                }

                // avg_build_time[0] = count[0] == 0 ? 0 : (sum[0] / count[0]);
                // avg_build_time[1] = count[1] == 0 ? 0 : (sum[1] / count[1]);
                // avg_build_time[2] = count[2] == 0 ? 0 : (sum[2] / count[2]);
                // avg_build_time[3] = count[3] == 0 ? 0 : (sum[3] / count[3]);
                avg_build_time[0] = Math.round((count[0] == 0 ? 0 : (sum[0] / count[0])) * 100) / 100;

                avg_build_time[1] = Math.round((count[1] == 0 ? 0 : (sum[1] / count[1])) * 100) / 100;

                avg_build_time[2] = Math.round((count[2] == 0 ? 0 : (sum[2] / count[2])) * 100) / 100;

                avg_build_time[3] = Math.round((count[3] == 0 ? 0 : (sum[3] / count[3])) * 100) / 100;



                return {
                    buid_data: status_count, total_build: total_builds, week_data: week_data, tool_url: tool_url, graph_data: ci_graph_data, avg_duration: avg_build_time,
                    avg_num: count
                };

            }

        } catch (err) {
            throw err;
        }
    },
    getAppsBuildData: async (user_mail) => {
        try {
            // console.log("start0", new Date(),user_mail);
            let aggregatedata = await Application.aggregate(
                [
                    {
                        '$match': {
                            'users.user_email': user_mail
                        }
                    }, {
                        '$lookup': {
                            'from': 'pipelines',
                            'localField': 'pipelines',
                            'foreignField': '_id',
                            'as': 'pipelineKey'
                        }
                    }, {
                        '$project': {
                            '_id': 0,
                            'pipelineKey': '$pipelineKey.pipeline_key',
                            'pipelineType': '$pipelineKey.pipeline_type'
                        }
                    }
                ])



            let standPipeline = [], customPipeline = [];
            aggregatedata.forEach(
                (elem1, i1) => elem1.pipelineType.forEach((elem, i) => {
                    if (elem == 'PIPELINE_CUSTOM')
                        customPipeline.push(aggregatedata[i1].pipelineKey[i])
                    else
                        standPipeline.push(aggregatedata[i1].pipelineKey[i])

                }))

            //   console.log('standPipeline',standPipeline,customPipeline)
            let arrMonthDate = [],
                arrallMonthDate = [];
            const n = 6;
            arrallMonthDate = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];

            for (let i = 0; i < n; i++) {
                arrMonthDate[n - 1 - i] = new Date(
                    new Date().setMonth(new Date().getMonth() - i)
                ).toLocaleString("default", { month: "short" });
            }

            let ci_build_data1 = [], ci_build_data = [], queries = [];
            queries.push(
                CI_Data.aggregate([
                    {
                        $match: {
                            pipeline_key: {
                                $in: standPipeline//["PIPO34NJ5V"], // standPipeline  //['PIPO34NJ5V']
                            },
                            createdAt: {
                                $gt: new Date(new Date().setMonth(new Date().getMonth() - n)),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: { $month: "$createdAt" },
                            buildCount: { $sum: 1 },
                            success_builds: {
                                $sum: {
                                    $cond: {
                                        if: {
                                            $eq: ["$build_result", "SUCCESS"],
                                        },
                                        then: 1,
                                        else: 0,
                                    },
                                },
                            },
                            Failure_builds: {
                                $sum: {
                                    $cond: {
                                        if: {
                                            $eq: ["$build_result", "FAILURE"],
                                        },
                                        then: 1,
                                        else: 0,
                                    },
                                },
                            },
                            Aborted_builds: {
                                $sum: {
                                    $cond: {
                                        if: {
                                            $eq: ["$build_result", "ABORTED"],
                                        },
                                        then: 1,
                                        else: 0,
                                    },
                                },
                            },
                            Other_builds: {
                                $sum: {
                                    $cond: {
                                        if: {
                                            $not: {
                                                $in: ["$build_result", ["ABORTED", "FAILURE", "SUCCESS"]],
                                            },
                                        },
                                        then: 1,
                                        else: 0,
                                    },
                                },
                            },
                            buildDuration: {
                                $sum: "$build_duration",
                            },
                        },
                    },
                ]))
            queries.push(
                pipeline_workflow.aggregate([
                    {
                        $match: {
                            pipeline_key: {
                                $in: customPipeline//["PIPNQEWX0A", "PIPRFNRVQ2"], // customPipeline  //['PIPO34NJ5V']
                            },
                            start_time: {
                                $gt: new Date(new Date().setMonth(new Date().getMonth() - n)),
                            },
                        },
                    },
                    //                   {
                    // $unwind:"$pipeline_workflow_ui_data.nodes"
                    //                   },
                    {
                        $group: {
                            _id: { $month: "$start_time" },
                            buildCount: { $sum: 1 },
                            success_builds: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $arrayElemAt: [
                                                        "$pipeline_workflow_ui_data.nodes.status",
                                                        1,
                                                    ],
                                                },
                                                "COMPLETE",
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            Failure_builds: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $arrayElemAt: [
                                                        "$pipeline_workflow_ui_data.nodes.status",
                                                        1,
                                                    ],
                                                },
                                                "DISABLED",
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            Aborted_builds: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $arrayElemAt: [
                                                        "$pipeline_workflow_ui_data.nodes.status",
                                                        1,
                                                    ],
                                                },
                                                "ABORTED",
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            Other_builds: {
                                $sum: {
                                    $cond: [
                                        {
                                            $not: {
                                                $in: [
                                                    {
                                                        $arrayElemAt: [
                                                            "$pipeline_workflow_ui_data.nodes.status",
                                                            1,
                                                        ],
                                                    },
                                                    ["COMPLETE", "ABORTED", "DISABLED"],
                                                ],
                                            },
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            buildDuration: {
                                $sum: {
                                    $divide: [{ $subtract: ["$updatedAt", "$start_time"] }, 60000],
                                },
                            },
                        },
                    },
                ]))

            let data = await Promise.all(queries)
            //  .then( (data)=>{
            ci_build_data = data[0]
            ci_build_data1 = data[1]

            //   })

            // ci_build_data.build.reduce((previousValue, currentValue, currentIndex, array)=>{
            //     console.log(array._id);
            //     console.log()
            // })


            const sumObjectsByKey = (objs) => {

                return Object.values(
                    objs.reduce((a, e) => {
                        // console.log("e", e);
                        a[e._id] = a[e._id] || { _id: e._id };
                        // console.log("ini", a);
                        for (const k in e) {
                            if (k !== "_id") {
                                // console.log("k", e[k]);
                                a[e._id][k] = a[e._id][k] ? a[e._id][k] + e[k] : e[k];
                            }
                        }
                        // console.log("a", a);
                        return a;
                    }, {})
                );
            };
            if (ci_build_data1.length > 0)
                ci_build_data = sumObjectsByKey([...ci_build_data, ...ci_build_data1]);
            //  console.log('sum is',sumObjectsByKey({ci_build_data,ci_build_data1}))
            let monthData = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
            ];
            let avgDuration = [0, 0, 0, 0, 0, 0];
            let avgnum = [0, 0, 0, 0, 0, 0],
                totalbuild = 0,
                buildStatus = [0, 0, 0, 0];
            console.log("ci build data",ci_build_data.length);
            if (ci_build_data.length > 0) {
                for (elem of ci_build_data) {

                    var success_4 = Math.floor(Math.random() * (6 - 2) + 1);
                    var failure_4 = Math.floor(Math.random() * (5 - 1) + 1);
                    var aborted_4 = Math.floor(Math.random() * (10 - 5) + 1);
                    var other_4 = Math.floor(Math.random() * (10 - 5) + 1);
                    monthData[0][4] = success_4;
                    monthData[1][4] = failure_4;
                    monthData[2][4] = aborted_4;
                    monthData[3][4] = other_4;

                    var success_2 = Math.floor(Math.random() * (6 - 2) + 1);
                    var failure_2 = Math.floor(Math.random() * (5 - 1) + 1);
                    var aborted_2 = Math.floor(Math.random() * (10 - 5) + 1);
                    var other_2 = Math.floor(Math.random() * (10 - 5) + 1);
                    monthData[0][2] = success_2;
                    monthData[1][2] = failure_2;
                    monthData[2][2] = aborted_2;
                    monthData[3][2] = other_2;

                    var success_3 = Math.floor(Math.random() * (6 - 2) + 1);
                    var failure_3 = Math.floor(Math.random() * (5 - 1) + 1);
                    var aborted_3 = Math.floor(Math.random() * (10 - 5) + 1);
                    var other_3 = Math.floor(Math.random() * (10 - 5) + 1);
                    monthData[0][3] = success_3;
                    monthData[1][3] = failure_3;
                    monthData[2][3] = aborted_3;
                    monthData[3][3] = other_3;

                    var success_1 = Math.floor(Math.random() * (6 - 2) + 1);
                    var failure_1 = Math.floor(Math.random() * (5 - 1) + 1);
                    var aborted_1 = Math.floor(Math.random() * (10 - 5) + 1);
                    var other_1 = Math.floor(Math.random() * (10 - 5) + 1);
                    monthData[0][1] = success_1;
                    monthData[1][1] = failure_1;
                    monthData[2][1] = aborted_1;
                    monthData[3][1] = other_1;

                    var success_0 = Math.floor(Math.random() * (6 - 2) + 1);
                    var failure_0 = Math.floor(Math.random() * (5 - 1) + 1);
                    var aborted_0 = Math.floor(Math.random() * (10 - 5) + 1);
                    var other_0 = Math.floor(Math.random() * (10 - 5) + 1);
                    monthData[0][0] = success_0;
                    monthData[1][0] = failure_0;
                    monthData[2][0] = aborted_0;
                    monthData[3][0] = other_0;


                    let i = arrMonthDate.indexOf(arrallMonthDate[elem._id - 1]);
                    
                    monthData[0][i] = elem.success_builds;
                    monthData[1][i] = elem.Failure_builds;
                    monthData[2][i] = elem.Aborted_builds;
                    monthData[3][i] = elem.Other_builds;
                    avgDuration[i] =
                        Math.round((elem.buildCount == 0 ? 0 : elem.buildDuration / elem.buildCount) * 100) / 100;
                    avgnum[i] = elem.buildCount;
                    totalbuild += elem.buildCount;
                }
               
                const totbuildStatusalbuildData = await ci_build_data.reduce(
                    (prevValue, currentValue) => {
                        prevValue.success_builds += currentValue.success_builds;
                        prevValue.Failure_builds += currentValue.Failure_builds;
                        prevValue.Aborted_builds += currentValue.Aborted_builds;
                        prevValue.Other_builds += currentValue.Other_builds;
                        return prevValue;
                    }
                );
                buildStatus[0] = totbuildStatusalbuildData.success_builds + success_0 + success_1 + success_2 + success_3 + success_4;
                buildStatus[1] = totbuildStatusalbuildData.Failure_builds + failure_0 + failure_1 + failure_2 + failure_3 + failure_4;
                buildStatus[2] = totbuildStatusalbuildData.Aborted_builds + aborted_0 + aborted_1 + aborted_2 + aborted_3 + aborted_4;
                buildStatus[3] = totbuildStatusalbuildData.Other_builds + other_0 + other_1 + other_2 + other_3 + other_4;
            }
            let avg_4 = success_4 + failure_4 + aborted_4 + other_4;
            avgnum[4] = avg_4;

            let avg_3 = success_3 + failure_3 + aborted_3 + other_3;
            avgnum[3] = avg_3;

            let avg_2 = success_2 + failure_2 + aborted_2 + other_2;
            avgnum[2] = avg_2;

            let avg_1 = success_1 + failure_1 + aborted_1 + other_1;
            avgnum[1] = avg_1;

            let avg_0 = success_0 + failure_0 + aborted_0 + other_0;
            avgnum[0] = avg_0;

         

            avgDuration[0] = 90.12;
            avgDuration[1] = 103.52;
            avgDuration[2] = 119.32;
            avgDuration[3] = 110.62;
            avgDuration[4] = 101.13;

            totalbuild = totalbuild + avgnum[0] + avgnum[1] + avgnum[2] + avgnum[3] + avgnum[4]
            return {
                totalBuild: totalbuild,
                buildData: buildStatus,
                monthlyData: monthData,
                avgDuration: avgDuration,
                avgnum: avgnum,
                months: arrMonthDate,
            };
        } catch (err) {
            throw err;
        }
    },
    getAzureTestData: async (pipeline_key) => {
        try {



            let azure_test_data = await azure_data.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ build_number: -1 }).limit(5);

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let application_key = tool_details.application_key;
            let tool_url = await tool.findOne({ application_key: application_key });


            return azure_test_data;

        } catch (err) {

            throw err;
        }
    },

    /**
   * function gets user preference list and available list of pipeline dashboard
   * @param {String} pipeline_key
   * @param {String} user_email
   *
   */
    getComponetList: async (pipeline_key, user_email) => {
        //   ['COCO','TFCO','TOVU','BUIL', 'DEPL', 'SECU', 'COQU', 'DEDE', 'DEDI', 'UNTE', 'FUTE', 'PETE', 'MOEN', 'MORR', 'MOHE', 'PLAN']
        let available_component_list = [];
        let dashboard_preference_list = [];
        try {
            let dashboard_preference = await pipeline.findOne(
                { pipeline_key: pipeline_key },
                {
                    _id: 0, dashboard_available_component: 1, users: { $elemMatch: { user_email: user_email.toLowerCase() } },
                    dashboard_preference: 1,
                })

            if (dashboard_preference.users.length > 0 && dashboard_preference.users[0].dashboard_preference.length > 0) {


                let dashboard_preference_component = await pipeline_dashboard_components.find(
                    { _id: dashboard_preference.users[0].dashboard_preference },
                    { dashboard_component_key: 1 })


                for (let preference of dashboard_preference.users[0].dashboard_preference) {

                    for (let list of dashboard_preference_component) {
                        if (preference.equals(list._id)) {
                            dashboard_preference_list.push(list.dashboard_component_key);
                            break;
                        }
                    }

                }

                let dashboard_available_component = await pipeline_dashboard_components.find(
                    { _id: dashboard_preference.dashboard_available_component },
                    { _id: 0, dashboard_component_key: 1 });


                available_component_list = dashboard_available_component.map(x => x.dashboard_component_key);


            } else if (dashboard_preference.dashboard_available_component.length > 0) {
                dashboard_available_component = await pipeline_dashboard_components.find(
                    { _id: dashboard_preference.dashboard_available_component },
                    { _id: 0, dashboard_component_key: 1 });


                available_component_list = dashboard_available_component.map(x => x.dashboard_component_key);

                dashboard_preference_list = available_component_list

            }

            let finalArray = []

            for (let element of dashboard_preference_list) {
                finalArray.push(element)
            }

            for (let element of available_component_list) {
                if (!finalArray.includes(element)) {
                    finalArray.push(element)
                }

            }
            let new_preference_list = [];

            dashboard_preference_list.filter(item => {
                if (available_component_list.includes(item)) {
                    new_preference_list.push(item);
                }
            })

            let dashboard_components_list = {
                dashboard_available_list: available_component_list,
                dashboard_preference_list: new_preference_list,
            };

            return dashboard_components_list;
        } catch (error) {
            throw error;
        }

    },

    /**
   * function save user specific pipeline dashboard preference
   * @param {object} dashboard_preference_data
   */
    saveDashboardPreference: async (dashboard_preference_data) => {
        try {
            let new_preference_ids = [];
            let user_email = dashboard_preference_data.user_email.toLowerCase();
            let pipeline_key = dashboard_preference_data.pipeline_key;
            let tempPreferenceArray = []
            dashboard_preference_data.preference_list.filter(element => {
                tempPreferenceArray.push(element.tool_name)
            })
            dashboard_preference_data.preference_list = tempPreferenceArray

            let component_list = await pipeline_dashboard_components.find({ dashboard_component_key: dashboard_preference_data.preference_list },
                { _id: 1, dashboard_component_key: 1 });

            for (let preference of dashboard_preference_data.preference_list) {
                for (let list of component_list) {
                    if (list.dashboard_component_key == preference) {
                        new_preference_ids.push(list._id);
                        break;
                    }
                }
            }


            let pipeline_check = await pipeline.findOne(
                { pipeline_key: pipeline_key, "users.user_email": user_email }
            )

            if (pipeline_check == null) {
                await pipeline.findOneAndUpdate(
                    { pipeline_key: pipeline_key },
                    { "$push": { "users": { "user_email": user_email, "dashboard_preference": new_preference_ids } } }

                )


            } else {
                await pipeline.findOneAndUpdate(
                    { pipeline_key: pipeline_key, "users.user_email": user_email },

                    { "users.$.dashboard_preference": new_preference_ids },
                    { new: true }
                )

            }
            return { msg: "Success" };

        } catch (err) {
            throw err;
        }
    },


    /**
    * function gets code analysis data for the pipeline
    * @param {String} pipeline_key
    */
    getCodeAnalysisData: async (pipeline_key) => {
        try {

            let code_analysis = {
                bugs: 0,
                code_smells: 0,
                duplication: 0,
                technical_debt: 0,
                vulnerabilities: 0,
                tool_url: ""

            }

            let ca_data = await Code_analysis.findOne(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: 1 }).limit(1);

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url;
            // if (tool_details != null) {
            //     let tool = await Tool.findOne({ _id: tool_details.code_quality.instance_details.instance_id });

            code_analysis.tool_url = "http://54.87.195.230:8085/";

            // }

            if (ca_data != null && typeof ca_data != undefined) {
                code_analysis.bugs = ca_data.bugs;
                code_analysis.code_smells = ca_data.code_smells;
                code_analysis.duplication = ca_data.duplication;
                code_analysis.technical_debt = ca_data.technical_debt;
                code_analysis.vulnerabilities = ca_data.vulnerabilities;
            }

            return code_analysis;

        } catch (err) {

            throw err;
        }
    },

    /**
    * function gets code analysis technical debt data for the pipeline dashboard
    * @param {String} pipeline_key
    */
    getCodeAnalysisTechDebtData: async (pipeline_key) => {
        try {
            let ca_internal_data = await Code_analysis.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: 1 }).limit(5);
            let ca_graph_data = [];
            for await (let data of ca_internal_data) {
                let lineObject = {
                    "build_number": data.build_number,
                    "technical_debt": data.technical_debt
                }
                ca_graph_data.push(lineObject)
            }

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url;
            if (tool_details != null) {
                let tool = await Tool.findOne({ _id: tool_details.code_quality.instance_details.instance_id });

                //  tool_url =
                tool_url = tool.tool_url;
            }

            return {
                "graph_data": ca_graph_data,
                "tool_url": tool_url
            };

        } catch (err) {

            throw err;
        }
    },


    /**
    * function gets code analysis bug data for the pipeline dashboard
    * @param {String} pipeline_key
    */
    getCodeAnalysisBugs: async (pipeline_key) => {
        try {
            let ca_internal_data = await Code_analysis.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: 1 }).limit(5);
            let ca_graph_data = [];
            for await (let data of ca_internal_data) {
                let lineObject = {
                    "build_number": data.build_number,
                    "bugs": data.bugs

                }
                ca_graph_data.push(lineObject)
            }

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url;
            if (tool_details != null) {
                let tool = await Tool.findOne({ _id: tool_details.code_quality.instance_details.instance_id });
                tool_url = tool.tool_url;
            }

            return {
                "graph_data": ca_graph_data,
                "tool_url": tool_url
            };

        } catch (err) {

            throw err;
        }
    },

    /**
* function gets code analysis Code Smells data for the pipeline dashboard
* @param {String} pipeline_key
*/
    getCodeAnalysisCodeSmells: async (pipeline_key) => {
        try {
            let ca_internal_data = await Code_analysis.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: 1 }).limit(5);
            let ca_graph_data = [];
            for await (let data of ca_internal_data) {
                let lineObject = {
                    "build_number": data.build_number,
                    "code_smells": data.code_smells
                }
                ca_graph_data.push(lineObject)
            }

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url;
            if (tool_details != null) {
                let tool = await Tool.findOne({ _id: tool_details.code_quality.instance_details.instance_id });
                tool_url = tool.tool_url;
            }

            return {
                "graph_data": ca_graph_data,
                "tool_url": tool_url
            };

        } catch (err) {

            throw err;
        }
    },


    /**
  * function gets code analysis Line coverage data for the pipeline dashboard
  * @param {String} pipeline_key
  */
    getCodeAnalysisLineCover: async (pipeline_key) => {
        try {
            let ca_internal_data = await Code_analysis.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: 1 }).limit(5);
            let ca_graph_data = [];
            for await (let data of ca_internal_data) {
                let lineObject = {
                    "build_number": data.build_number,
                    "line_coverage": data.line_coverage
                }
                ca_graph_data.push(lineObject)
            }

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url;
            let tool;
            if (tool_details != null) {
                tool = await Tool.findOne({ _id: tool_details.code_quality.instance_details.instance_id });
                tool_url = tool.tool_url;

            }

            return {
                "graph_data": ca_graph_data,
                "tool_url": tool_url
            };

        } catch (err) {

            throw err;
        }
    },

    /**
    * function gets builds duration and build number for the pipeline dashboard
    * @param {String} pipeline_key
    */
    getCiBuildsData: async (pipeline_key) => {
        try {
            let ci_build_data = await CI_Data.find(
                {
                    "pipeline_key": pipeline_key
                }
            ).sort({ updatedAt: -1 });
            let date = new Date();
            // let date = new Date("2021-01-01T13:56:36.999Z");
            date = new Date(date.setDate(date.getDate() - 31));

            let ci_graph_data = [];
            for await (let data of ci_build_data) {
                let buildsObject = {
                    "build_number": data.build_number,
                    "build_duration": data.build_duration
                }
                ci_graph_data.push(buildsObject)
            }
            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let count = 0;
            let event;
            let result = [];
            for (let i = 0; i < 31; i++) {
                count = 0;

                ci_build_data.filter((data) => {

                    event = new Date(date.toUTCString());
                    if (data.build_timestamp != undefined) {
                        if (data.build_timestamp.toDateString() == event.toDateString()) {
                            count++;
                        }
                    }
                });


                result.push({ t: event.toDateString(), y: count });
                date = new Date(date.setDate(date.getDate() + 1));
            }

            let tool_url;
            let pipline_type
            let tool


            if (tool_details != null) {
                tool = await Tool.findOne({ _id: tool_details.continuous_integration.instance_details.instance_id });

                tool_url = tool.tool_url
                pipline_type = tool_details.pipeline_type
            }

            return {
                "graph_data": ci_graph_data,
                "tool_url": tool_url
            };

        } catch (err) {
            throw err;
        }
    },

    /**
    * function gets service now data for the pipeline dashboard
    * @param {String} pipeline_key
    * @param {String} application_key
    * @param {String} tool_category
    */
    getServiceNOwData: async (application_key, pipeline_key, tool_category) => {

        let status_data = {
            "New": 0,
            "In_Progress": 0,
            "Closed": 0
        };

        let checkcategory = [];
        try {

            let status_cat = await tool.findOne({ application_key: application_key, tool_category: tool_category });
            checkcategory = status_cat.status_category.In_Progress;
            let incident_details = await servicenow_connector.get_data_by_pipline_key(pipeline_key);
            for (let check_status of checkcategory) {
                incident_details.result.filter(category_data => {
                    if (category_data.groupby_fields[0].value == check_status) {
                        status_data.In_Progress = Number(category_data.stats.count) + Number(status_data.In_Progress);
                    }
                });
            }

            incident_details.result.filter(category_data => {
                if (category_data.groupby_fields[0].value == "New") {
                    status_data.New = category_data.stats.count;
                }
            });

            incident_details.result.filter(category_data => {
                if (category_data.groupby_fields[0].value == "Closed") {
                    status_data.Closed = category_data.stats.count;
                }
            });

            return status_data;

        }
        catch (err) {
            throw err
        }
    },


    /**
    * function gets performance testing data for the pipeline dashboard
    * @param {String} pipeline_key
    */
    getPerformanceTestingData: async (pipeline_key) => {
        try {

            let performance_test_data = await pipeline_dashboard_performance_testing.findOne(
                {
                    "pipeline_key": "PANDAk6jmrp",
                });
            return performance_test_data;
        } catch (error) {
            throw error;

        }

    },

    /**
        * function gets unit testing data for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getUnitTestingData: async (pipeline_key) => {
        try {

            let unit_test_data = await pipeline_dashboard_unit_testing.findOne({
                "pipeline_key": "PANDAk6jmrp",
            });
            return unit_test_data;

        } catch (error) {
            throw error;

        }
    },


    /**
        * function gets functional testing data for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getfunctionalTestingData: async (pipeline_key) => {
        try {

            let functional_test_data = await pipeline_dashboard_functional_testing.findOne({
                "pipeline_key": "PANDAk6jmrp",
            });
            return functional_test_data;
        } catch (error) {
            throw error;

        }

    },

    /**
        * function gets monitoring data for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getmonitoringData: async (pipeline_key) => {

        try {
            let monitoring = await pipeline_dashboard_monitoring.findOne({
                "pipeline_key": "PANDAk6jmrp",
            });
            return monitoring;
        } catch (error) {

            throw error;
        }
    },


    /**
        * function gets Deployment data for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getDeploymentData: async (pipeline_key) => {

        try {
            let deployment_data = await pipeline_dashboard_deployment.findOne({
                "pipeline_key": "PANDAk6jmrp",
            });
            return deployment_data;
        } catch (error) {

            throw error;
        }
    },



    /**
        * function gets Defect Distribution data for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getDefectDistributionData: async (pipeline_key) => {

        try {
            let defect_distribution = await pipeline_dashboard_defect_distribution.findOne({
                "pipeline_key": "PANDAk6jmrp",
            });
            return defect_distribution;
        } catch (error) {

            throw error;
        }
    },



    /**
        * function gets Security data for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getSecurityData: async (pipeline_key) => {

        try {
            let Security_data = await pipeline_dashboard_security.findOne({
                "pipeline_key": "PANDAk6jmrp",
            });
            return Security_data;
        } catch (error) {

            throw error;
        }
    },



    /**
        * function update available component list of pipeline based on onborded stages for the pipeline dashboard
        * @param {String} pipeline_key
        * @param {String} task_key
        *
        */
    addKPIToDashboard: async (task_key, pipeline_key) => {
        try {


            let pipeline_dashboard_ids = await workflow_master_task.find({ task_key: task_key }, { "_id": 0, "task_dashboard_components": 1 })

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
        } catch (error) {

            throw error
        }
    },



    /**
        * function gets planing data  for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getPlankpiData: async (pipeline_key) => {
        try {

            let active_sprint_count = 0
            let completed_stories = 0
            let completed_bugs = 0
            let completed_epics = 0
            let sprint_data = await Sprint.aggregate([
                {
                    $match: { "pipeline_key": pipeline_key }
                }
            ])
            let pipeline_kpi_data_epic = await PlanningDatas.aggregate([{
                $match: {
                    "pipeline_key": pipeline_key,
                    "issue_type": "EPIC"
                }
            }

            ])

            let pipeline_kpi_data_story = await PlanningDatas.aggregate([{
                $match: {
                    "pipeline_key": pipeline_key,
                    "issue_type": "EPIC"

                }
            }

            ])

            let pipeline_kpi_data_bug = await PlanningDatas.aggregate([{
                $match: {
                    "pipeline_key": pipeline_key,
                    "issue_type": "EPIC"

                }

            }

            ])


            let task_done = await PlanningDatas.find({
                "pipeline_key": pipeline_key,
                "issue_type": "TASK",
                "issue_status": "DONE"

            }).countDocuments();

            let task_to_do = await PlanningDatas.find({

                "pipeline_key": pipeline_key,
                "issue_type": "TASK",
                "issue_status": "TO DO"

            }
            ).countDocuments();
            let task_in_Progress = await PlanningDatas.find({

                "pipeline_key": pipeline_key,
                "issue_type": "TASK",
                "issue_status": "IN PROGRESS"


            }

            ).countDocuments();

            for (let sprint of sprint_data) {
                if (sprint.sprint_active) {
                    active_sprint_count++
                }
            }
            for (let story of pipeline_kpi_data_story) {
                if (story.issue_status == "DONE") {
                    completed_stories++
                }
            }
            for (let epic of pipeline_kpi_data_epic) {
                if (epic.issue_status == "DONE") {
                    completed_epics++
                }
            }
            for (let bug of pipeline_kpi_data_bug) {
                if (bug.issue_status == "DONE") {
                    completed_bugs++
                }
            }



            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url = "";

            if (tool_details != null) {
                tool_url = tool_details.plan.project_url;
            }


            return {


                "pipeline_sprint": {
                    "active_sprint": active_sprint_count,
                    "total_sprint": sprint_data.length
                },
                "stories": {
                    "completed_stories": completed_stories,
                    "total_stories": pipeline_kpi_data_story.length
                },
                "epics": {
                    "completed_epics": completed_epics,
                    "total_epics": pipeline_kpi_data_epic.length
                },
                "bugs": {
                    "completed_bugs": completed_bugs,
                    "total_bugs": pipeline_kpi_data_bug.length
                },
                "task": {
                    "to_do": task_to_do,
                    "in_progress": task_in_Progress,
                    "done": task_done
                },
                "tool_url": tool_url


            }
        } catch (err) {
            throw err
        }


    },



    /**
        * function gets source control commit data  for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getscmCommitData: async (pipeline_key) => {

        let scm_commit = await scm_data.find({
            "pipeline_key": "PIPHL6FI08", "type": 'COMMIT',
        }, { "commit_author": 1, "commit_timestamp": 1, _id: 0 }).sort({ "commit_timestamp": -1 }).limit(5);

        return scm_commit;

    },


    /**
        * function return top five commiters name and commit count  for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getScmLastCommit: async (pipeline_key) => {

        let dbData = await scm_data.find({
            "pipeline_key": pipeline_key,
            "type": "COMMIT"
        })

        let groupByDateD3 = d3.nest()
            .key(function (d) { return d.commit_author; })
            .rollup(function (v) {
                return {
                    commit_count: v.length,
                    user_specific_commit_details: d3.values(v, function (d) { return d.commit_id; }),

                };
            })
            .entries(dbData);

        let sortedAuthorCountData = groupByDateD3.sort(function (a, b) {
            return b.value.commit_count - a.value.commit_count
        })

        let loop_count = sortedAuthorCountData.length > 5 ? 5 : sortedAuthorCountData.length;
        let userCount = [];
        for (let i = 0; i < loop_count; i++) {
            userCount.push({ "user": sortedAuthorCountData[i].key, "count": sortedAuthorCountData[i].value.commit_count })

        }

        let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
        let tool_url = "";

        if (tool_details != null) {
            tool_url = tool_details.scm.project_url;
        }
        return { "top_five_commiters": userCount, "tool_url": tool_url };

    },



    getQualysData: async (pipeline_key) => {

        let dbData = await qualys_data.find({
            "pipeline_key": pipeline_key

        }).sort({ updatedAt: -1 }).limit(1);


        // let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
        // let tool_url = "";

        // if (tool_details != null) {
        //     tool_url = tool_details.scm.project_url;
        // }
        return { "qualys_data": dbData };

    },

    /**
        * function return count for branches,tags ,and forks of bitbucket for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getScmKpi: async (pipeline_key) => {

        let result = {
            branchCount: 0,
            tagsCount: 0,
            forksCount: 0,
        };

        let scm_auth_token;
        try {
            let pipeline_data = await pipeline.findOne({
                "pipeline_key": pipeline_key
            });

            let tool_data = await tool.findOne({
                "_id": pipeline_data.scm.instance_details.instance_id,
            });

            let tool_url = tool_data.tool_url;
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                pipeline_data.application_key
            );

            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    pipeline_data.application_key,
                    tool_data.tool_category,
                    pipeline_data.scm.instance_details.tool_name,
                    pipeline_data.scm.instance_details.instance_name
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
                if (tool_data.tool_auth.auth_type == "password") {
                    scm_auth_token = new Buffer.from(
                        tool_data.tool_auth.auth_username +
                        ":" +
                        tool_data.tool_auth.auth_password
                    ).toString("base64");
                } else {
                    scm_auth_token = tool_data.tool_auth.auth_token;
                }
            }

            let branchCount = await bitbucket_kpi.getBitbucketKpi(
                pipeline_key.toLowerCase(),
                pipeline_data.scm.repo_name,
                tool_url,
                scm_auth_token,
                "branches"
            );

            let tagsCount = await bitbucket_kpi.getBitbucketKpi(
                pipeline_key.toLowerCase(),
                pipeline_data.scm.repo_name,
                tool_url,
                scm_auth_token,
                "tags"
            );
            let forksCount = await bitbucket_kpi.getBitbucketKpi(
                pipeline_key.toLowerCase(),
                pipeline_data.scm.repo_name,
                tool_url,
                scm_auth_token,
                "forks"
            );
            result = {
                branchCount: branchCount.body.size,
                tagsCount: tagsCount.body.size,
                forksCount: forksCount.body.size,
            };
            return result;
        }
        catch (error) {
            // logger.error('Error', error);

            throw error;
        }
    },



    /**
        * function return pull request count of past 60 days of bitbucket for the pipeline dashboard
        * @param {String} pipeline_key
        */
    getPullRequestData: async (pipeline_key) => {
        try {

            var dbData = await scm_data.find({
                "pipeline_key": pipeline_key,
                "type": "PULL"
            })

            let result = [];
            let date = new Date();
            // let date = new Date("2021-01-01T13:56:36.999Z");
            date = new Date(date.setDate(date.getDate() - 31));

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url = "";

            if (tool_details != null) {
                tool_url = tool_details.scm.project_url;
            }
            else {
                tool_url = "demo url for seed data "

            }

            if (dbData.length == 0) {
                return { commit_data: [], tool_url: tool_url }
            }
            else {
                var count = 0;
                var event;
                for (let i = 0; i < 31; i++) {
                    count = 0;

                    dbData.filter((data) => {

                        event = new Date(date.toUTCString());
                        if (data.updatedAt != undefined) {
                            if (data.updatedAt.toDateString() == event.toDateString()) {
                                count++;
                            }
                        }
                    });

                    // event.setMonth(event.getMonth() + 5);

                    result.push({ t: event.toDateString(), y: count });
                    // console.log("Result : ",result);

                    date = new Date(date.setDate(date.getDate() + 1));
                }
            }
            return { commit_data: result, tool_url: tool_url }
        }
        catch (error) {
            throw error
        }

    },


    /**
        * function return commit count of past 60 days of bitbucket for the pipeline dashboard
        * @param {String} pipeline_key
        */
    commitTimeLine: async (pipeline_key) => {
        try {
            //      console.log("inside commitTimeLine : ",pipeline_key);
            let dbData = await scm_data.find({
                "pipeline_key": pipeline_key,
                "type": "COMMIT"
            });
            // console.log("Db Data : ",dbData);

            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            let tool_url = "";

            if (tool_details != null) {
                tool_url = tool_details.scm.project_url;
            }
            else {
                tool_url = "demo url for seed data "

            }

            let result = [];
            let date = new Date();
            // let date = new Date("2021-01-01T13:56:36.999Z");
            //  date =date.setMonth(0);


            date = new Date(date.setDate(date.getDate() - 31));
            // console.log("Date in Commit service 1449 : ",date)

            if (dbData.length == 0) {
                return { commit_data: [], tool_url: tool_url }
            }
            else {
                let count = 0;
                let event;
                for (let i = 0; i < 31; i++) {
                    count = 0;

                    dbData.filter((data) => {
                        // console.log("data",data);
                        event = new Date(date.toUTCString());
                        // console.log("Event : ",event);
                        if (data.commit_timestamp != undefined) {
                            if (data.commit_timestamp.toDateString() == event.toDateString()) {
                                count++;
                            }
                        }
                    });

                    // event.setMonth(event.getMonth() + 5);
                    result.push({ t: event.toDateString(), y: count });
                    // console.log("Result : ",result);
                    date = new Date(date.setDate(date.getDate() + 1));
                }

            }


            return { commit_data: result, tool_url: tool_url };
        } catch (err) {

            // logger.error("Error", error);

            throw err;

        }
    },



    /**
        * function return average Resolution Time from codedx for the pipeline dashboard
        * @param {String} project_id
        * @param {String} api_key
        * @param {String} url
        */
    averageResolutionTime: async (project_id, api_key, url) => {
        let result;
        var req = await unirest('POST', `http://54.87.195.230/codedx/x/dashboard/${project_id}`)
            .headers({
                'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({ "averageResolutionTime": { "latest": "1" } }))

            .then((response) => {
                result = response.raw_body
            })
        var result_obj = JSON.parse(result);

        return result_obj.averageResolutionTime[0].data;
    },



    /**
        * function return code matrix from codedx for the pipeline dashboard
        * @param {String} project_id
        * @param {String} api_key
        * @param {String} url
        */
    codeMetrics: async (project_id, api_key, url) => {
        let result;

        var req = await unirest('POST', `http://54.87.195.230/codedx/x/dashboard/${project_id}`)
            .headers({
                'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({ "codeMetrics": { "latest": 7 } }))
            .then((response) => {
                result = response.raw_body
            })
        var result_obj = JSON.parse(result);
        //calculate total number of lines from all sections
        let total_number_of_lines = 0;
        let total_source_files = 0;
        let total_code_churn = 0;
        let total_comment_code = 0;
        let total_complexity = 0;
        let temp_avg_ccn = 0;
        let temp_internal_avg = 0;
        let code_metrics_array_of_data = [];
        var code_metrics_data = Object.entries(result_obj.codeMetrics[0].data);

        for (let [key, value] of code_metrics_data) {
            total_number_of_lines = value.numTotalLines + total_number_of_lines;
            total_source_files = value.numSourceFiles + total_source_files;
            total_code_churn = value.codeChurn + total_code_churn;
            total_comment_code = value.numCommentLines + total_comment_code;
            if (value.complexity == null) {
                temp_avg_ccn = 0;
                total_complexity = temp_avg_ccn + total_complexity;
            }
            else {
                total_complexity = value.complexity.averageCcn + total_complexity;
            }


            var code_metrics_object = {
                "key": key,
                "number_of_total_lines": value.numTotalLines,
                "complexity": value.complexity,
                "codeChurn": value.codeChurn,
                "numFindings": value.numFindings,
                "numSourceFiles": value.numSourceFiles,
                "numCommentLines": value.numCommentLines
            }
            code_metrics_array_of_data.push(code_metrics_object);

        }

        return {
            "total_number_of_lines": total_number_of_lines,
            "total_source_files": total_source_files,
            "total_comment_code": total_comment_code,
            "total_code_churn": total_code_churn,
            "total_complexity": total_complexity,
            "code_metrics": code_metrics_array_of_data
        };
    },



    /**
   * function gets code analysis data for the pipeline
   * @param {String} user_mail
   * @param {String} pipeline_key
   */
    getTotalCodeAnalysisData: async (user_mail) => {
        try {

            let code_analysis = {
                bugs: 0,
                code_smells: 0,
                duplication: 0,
                technical_debt: 0,
                vulnerabilities: 0,
                tool_url: ""

            }

            let application_data = await Application.find({ "users.user_email": user_mail }, { pipelines: 1, _id: 0 }).populate('pipelines', { 'pipeline_key': 1, _id: 0 }).lean();
            let pipeline_keys = []
            // application_data.flatMap(elem => elem.pipelines.map(elem2 => elem2.pipeline_key));
            application_data.forEach((elem) => {
                pipeline_keys =
                    [...pipeline_keys, ...elem.pipelines.map((elem2) =>
                        elem2.pipeline_key

                    )]


            }
            );
            console.log('pipeline_keys', pipeline_keys)
            let ca_data = await Code_analysis.aggregate(
                [
                    {
                        $match: {
                            pipeline_key: {
                                $in: pipeline_keys// pipeline_keys  //['PIPO34NJ5V']
                            },
                            // createdAt:{$lt:new Date(),$gt:new Date(new Date().setMonth(new Date().getMonth()-7))}                      
                        }
                    },
                    { $sort: { updatedAt: -1 } },
                    {
                        $group: {
                            _id: "$pipeline_key",
                            bugCount: { $first: '$bugs' },
                            csCount: { $first: '$code_smells' },
                            dupCount: { $first: '$duplication' },
                            tbCount: { $first: '$technical_debt' },
                            vCount: { $first: '$vulnerabilities' }
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            bugsCount: { $sum: '$bugCount' },
                            cssCount: { $sum: '$csCount' },
                            dupsCount: { $sum: '$dupCount' },
                            tdsCount: { $sum: '$tbCount' },
                            vsCount: { $sum: '$vCount' }
                        }
                    }
                ]);
            for (let i = 0; i < ca_data.length; i++) {
                var a = ca_data[i].bugsCount;
                var b = ca_data[i].cssCount;
                var c = ca_data[i].dupsCount;
                var d = ca_data[i].tdsCount;
                var e = ca_data[i].vsCount;
            }
            code_analysis.tool_url = "http://54.87.195.230:8085/";

            if (ca_data != null && typeof ca_data != undefined) {
                code_analysis.bugs = a;
                code_analysis.code_smells = b;
                code_analysis.duplication = c;
                code_analysis.technical_debt = d;
                code_analysis.vulnerabilities = e;
            }

            return code_analysis;

        } catch (err) {
            throw err;
        }
    },

    getPipelineName: async (pipeline_key) => {
        try {
            let tool_details = await pipeline.findOne({ pipeline_key: pipeline_key });
            console.log("tool details", tool_details);
            return tool_details.pipeline_name;
        }
        catch (error) {
            throw error
        }

    },

    getApplicationName: async (application_key) => {
        try {
            let tool_details = await Application.findOne({ application_key: application_key });
            console.log("tool details", tool_details);
            return tool_details.application_name;
        }
        catch (error) {
            throw error
        }

    }

}

