var Code_analysis = require('../models/code_analysis');
var CI_data = require('../models/ci_data');
var User = require('../models/user');
var Application = require ("../models/application");
const application_list = require('./application_list');
const { application } = require('express');


module.exports = {

    /**
* This function applications kpis for the user
* @param {String} user_name
* @param {String[]}  // send application_keys null if you want to calculate kpi for all of user's applications else send array of custom user's applcation_keys
* @param {Boolean} single_application_level    //keep false for multiple applications kpi calculation i.e. aggregate of "n" applications else keep true if you want to calculate kpi for single application i.e. single applications ke multiple pipeline
*/
//     getApplicationKpis: async (user_name, application_keys, single_application_level) => {

//         try {
//             let kpi_data = {
//                 "line_coverage": 0,
//                 "build_ratio": 0,
//                 "bug_ratio": 0,
//                 "technical_debt": 0,
//                 "tech_debt_text": "Hrs",
//                 "application_keys": [],
//                 "stable": 0,
//                 "warning": 0,
//                 "at_risk": 0
//             }
// /// mongo USER Query
//             let user_applications = await User.aggregate([
//                 {
//                     "$match": {
//                         "user_name": user_name
//                     }
//                 },
//                 {
//                     $addFields: {
//                         application_keys: {
//                             $cond: {
//                                 if: {
//                                     $eq: [application_keys, null]
//                                 },
//                                 then: {
//                                     $map: {
//                                         input: "$user_allocation",
//                                         as: "ar",
//                                         in: "$$ar.application_key"
//                                     }
//                                 },
//                                 else: application_keys
//                             }
//                         }
//                     }
//                 },
//                 {
//                     $addFields: {
//                         pipelines: {
//                             $map: {
//                                 input: "$user_allocation",
//                                 as: "apps",
//                                 in: {
//                                     $map: {
//                                         input: "$$apps.pipelines",
//                                         as: "pipes",
//                                         in: {
//                                             $cond: {
//                                                 if: {
//                                                     $in: ["$$apps.application_key", "$application_keys"]
//                                                 },
//                                                 then: {
//                                                     pipeline_key: "$$pipes.pipeline_key"
//                                                 },
//                                                 else: null
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 {
//                     $project: {
//                         pipelines: 1,
//                         application_keys: 1
//                     }
//                 },
//                 {
//                     $addFields: {
//                         pipelines: {
//                             $filter: {
//                                 input: "$pipelines",
//                                 as: "pipe",
//                                 cond: {
//                                     $gte: [{ $size: "$$pipe" }, 1]
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 {
//                     $unwind: { path: "$pipelines", preserveNullAndEmptyArrays: true }
//                 },
//                 {
//                     $unwind: { path: "$pipelines", preserveNullAndEmptyArrays: true }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         pipeline_keys: { $push: "$pipelines.pipeline_key" },
//                         application_keys: { $first: "$application_keys" }
//                     }
//                 },
//                 {
//                     $unwind: "$application_keys"
//                 },
//                 {
//                     $lookup: {
//                         from: "applications",
//                         localField: "application_keys",
//                         foreignField: "application_key",
//                         as: "application"
//                     }
//                 },
//                 {
//                     $group:
//                     {
//                         _id: "$application.application_health",
//                         health_count: { $sum: 1 },
//                         pipeline_keys: { $push: "$pipeline_keys" },
//                         application_keys: { $addToSet: "$application_keys" }
//                     }
//                 },
//                 {
//                     $project: {
//                         _id: 0,
//                         pipeline_keys: 1,
//                         application_keys: 1,
//                         health_category: "$_id",
//                         health_count: 1
//                     }
//                 },
//                 {
//                     $unwind: "$health_category"
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         application_keys: { $addToSet: "$application_keys" },
//                         pipeline_keys: { $addToSet: "$pipeline_keys" },
//                         "health_category": {
//                             $push: {
//                                 stable_count: {
//                                     $cond: {
//                                         if: {
//                                             $eq: ["$health_category", "STABLE"]
//                                         },
//                                         then: "$health_count",
//                                         else: 0
//                                     }
//                                 },
//                                 warning_count: {
//                                     $cond: {
//                                         if: {
//                                             $eq: ["$health_category", "WARNING"]
//                                         },
//                                         then: "$health_count",
//                                         else: 0
//                                     }
//                                 },
//                                 at_risk_count: {
//                                     $cond: {
//                                         if: {
//                                             $eq: ["$health_category", "AT RISK"]
//                                         },
//                                         then: "$health_count",
//                                         else: 0
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 {
//                     $unwind: "$health_category"
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         application_keys: { $first: "$application_keys" },
//                         pipeline_keys: { $first: "$pipeline_keys" },
//                         stable_count: { $sum: "$health_category.stable_count" },
//                         warning_count: { $sum: "$health_category.warning_count" },
//                         at_risk_count: { $sum: "$health_category.at_risk_count" }
//                     }
//                 },
//                 {
//                     $unwind: "$application_keys"
//                 },
//                 {
//                     $unwind: "$application_keys"
//                 },
//                 {
//                     $unwind: { path: "$pipeline_keys", preserveNullAndEmptyArrays: true }
//                 },
//                 {
//                     $unwind: { path: "$pipeline_keys", preserveNullAndEmptyArrays: true }
//                 },
//                 {
//                     $unwind: { path: "$pipeline_keys", preserveNullAndEmptyArrays: true }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         application_keys: { $addToSet: "$application_keys" },
//                         pipeline_keys: { $addToSet: "$pipeline_keys" },
//                         stable_count: { $first: "$stable_count" },
//                         warning_count: { $first: "$warning_count" },
//                         at_risk_count: { $first: "$at_risk_count" }
//                     }
//                 }
//             ]);



//            if (user_applications.length > 0) {
//                 let pipeline_keys = user_applications[0].pipeline_keys;
//                 application_keys = application_keys == null ? user_applications[0].application_keys : application_keys;
//                 kpi_data.application_keys = user_applications[0].application_keys;

//                 kpi_data.stable = user_applications[0].stable_count;
//                 kpi_data.warning = user_applications[0].warning_count;
//                 kpi_data.at_risk = user_applications[0].at_risk_count;

//                 let ca_aggregate_query = [
//                     {
//                         "$match": {
//                             pipeline_key: { $in: pipeline_keys }
//                         }
//                     },
//                     { $sort: { pipeline_key: -1, build_number: -1 } },
//                     {
//                         $group:
//                         {
//                             _id: "$pipeline_key",
//                             build_number: { $max: "$build_number" },
//                             technical_debt: { $first: "$technical_debt" },
//                             line_coverage: { $first: "$line_coverage" }
//                         }
//                     },
//                     {
//                         $lookup: {
//                             from: "pipelines",
//                             localField: "_id",
//                             foreignField: "pipeline_key",
//                             as: "pipeline"
//                         }
//                     },
//                     {
//                         $unwind: { path: "$pipeline" }
//                     },
//                     {
//                         $lookup: {
//                             from: "applications",
//                             localField: "pipeline.application_key",
//                             foreignField: "application_key",
//                             as: "application"
//                         }
//                     },
//                     {
//                         $unwind: { path: "$application" }
//                     },
//                     {
//                         $project: {
//                             _id: 0,
//                             build_number: 1,
//                             technical_debt: 1,
//                             line_coverage: 1,
//                             application_key: "$pipeline.application_key",
//                             pipeline_key: "$_id",
//                             total_pipelines_in_application: { $size: "$application.pipelines" }
//                         }
//                     },
//                     {
//                         $group: {
//                             _id: "$application_key",
//                             line_coverage: { $sum: "$line_coverage" },
//                             technical_debt: { $sum: "$technical_debt" },
//                             total_pipelines_in_application: { $first: "$total_pipelines_in_application" }
//                         }
//                     },
//                     {
//                         $project: {
//                             application_key: "$application_key",
//                             line_coverage: { $divide: ["$line_coverage", "$total_pipelines_in_application"] },
//                             technical_debt: { $divide: ["$technical_debt", { $multiply: ["$total_pipelines_in_application", 60] }] }
//                         }
//                     }
//                 ];
//                 let ci_aggregate_query = [
//                     {
//                         "$match": {
//                             pipeline_key: { $in: pipeline_keys }
//                         }
//                     },
//                     {
//                         $group:
//                         {
//                             _id: {
//                                 pipeline_key: "$pipeline_key",
//                                 build_result: "$build_result"
//                             },
//                             build_count: { $sum: 1 }
//                         }
//                     },
//                     {
//                         $group: {
//                             "_id": "$_id.pipeline_key",
//                             "builds": {
//                                 $push: {
//                                     build_result: {
//                                         $cond: {
//                                             if: {
//                                                 $eq: ["$_id.build_result", "SUCCESS"]
//                                             },
//                                             then: "$_id.build_result",
//                                             else: null
//                                         }
//                                     },
//                                     success_builds: {
//                                         $cond: {
//                                             if: {
//                                                 $eq: ["$_id.build_result", "SUCCESS"]
//                                             },
//                                             then: "$build_count",
//                                             else: 0
//                                         }
//                                     }
//                                 },
//                             },
//                             "total_builds": { "$sum": "$build_count" }
//                         }
//                     },
//                     {
//                         $unwind: { path: "$builds" }
//                     },
//                     {
//                         $group: {
//                             _id: "$_id",
//                             success_builds: { $sum: "$builds.success_builds" },
//                             total_builds: { $first: "$total_builds" }
//                         }
//                     },
//                     {
//                         $project: {
//                             _id: 0,
//                             pipeline_key: "$_id",
//                             build_ratio: { $multiply: [{ $divide: ["$success_builds", "$total_builds"] }, 100] }
//                         }
//                     },
//                     {
//                         $lookup: {
//                             from: "pipelines",
//                             localField: "pipeline_key",
//                             foreignField: "pipeline_key",
//                             as: "pipeline"
//                         }
//                     },
//                     {
//                         $unwind: { path: "$pipeline" }
//                     },
//                     {
//                         $lookup: {
//                             from: "applications",
//                             localField: "pipeline.application_key",
//                             foreignField: "application_key",
//                             as: "application"
//                         }
//                     },
//                     {
//                         $unwind: { path: "$application" }
//                     },
//                     {
//                         $project: {
//                             build_ratio: 1,
//                             application_key: "$pipeline.application_key",
//                             pipeline_key: "$pipeline_key",
//                             total_pipelines_in_application: { $size: "$application.pipelines" }
//                         }
//                     },
//                     {
//                         $group: {
//                             _id: "$application_key",
//                             build_ratio: { $sum: "$build_ratio" },
//                             no_of_pipeline_builds: { $sum: 1 },  //number of pipelines whos build data found in DB i.e. whos builds were run. So for remaining pipelines whose build never ran initial build_ratio should be 100%
//                             total_pipelines_in_application: { $first: "$total_pipelines_in_application" }
//                         }
//                     },
//                     {
//                         $project: {
//                             application_key: "$_id",
//                             build_ratio: { $divide: [{ $sum: ["$build_ratio", { $multiply: [{ $subtract: ["$total_pipelines_in_application", "$no_of_pipeline_builds"] }, 100] }] }, "$total_pipelines_in_application"] }
//                         }
//                     }
//                 ];
//                 if (!single_application_level) {
//                     let ca_group_query = {
//                         "$group": {
//                             _id: null,
//                             line_coverage: { $sum: "$line_coverage" },
//                             technical_debt: { $sum: "$technical_debt" }
//                         }
//                     };
//                     let ca_project_query = {
//                         "$project": {
//                             line_coverage: { $divide: ["$line_coverage", application_keys.length] },
//                             technical_debt: { $divide: ["$technical_debt", application_keys.length] }
//                         }
//                     };

//                     let ci_group_query = {
//                         "$group": {
//                             _id: null,
//                             build_ratio: { $sum: "$build_ratio" },
//                             no_of_application_builds: { $sum: 1 },  //number of applications in which build data found in DB i.e. whos build data found i.e. whos builds were run. So for remaining applications in which for single pipelines where build never ran initially build_ratio should be 100%
//                         }
//                     };
//                     let ci_project_query = {
//                         "$project": {
//                             build_ratio: { $divide: [{ $sum: ["$build_ratio", { $multiply: [{ $subtract: [application_keys.length, "$no_of_application_builds"] }, 100] }] }, application_keys.length] }
//                         }
//                     }

//                     ca_aggregate_query.push(ca_group_query);
//                     ca_aggregate_query.push(ca_project_query);
//                     ci_aggregate_query.push(ci_group_query);
//                     ci_aggregate_query.push(ci_project_query);

//                 }
//                 else {
//                     ca_aggregate_query.push({ $sort: { application_key: 1 } });
//                     ci_aggregate_query.push({ $sort: { application_key: 1 } });
//                 }

//                 //*******Code Analysis(Technical Debt/ Code Coverage)***************
//                 let ca_data = await Code_analysis.aggregate(ca_aggregate_query);

//                 if (ca_data.length > 0) {
//                     kpi_data.line_coverage = Math.round(ca_data[0].line_coverage);
//                     kpi_data.technical_debt = Math.round(ca_data[0].technical_debt);

//                     /*if(kpi_data.technical_debt > 720){  //If technical debt is greater than say 720 hours(threshold) i.e. 30 days show tech debt in days
//                         kpi_data.technical_debt /= 24;
//                         kpi_data.tech_debt_text = "Days";
//                         if(kpi_data.technical_debt > 120){  //If technical debt is greater than say 120 days(threshold) i.e. 6 months show tech debt in months
//                             kpi_data.technical_debt /= 30;
//                             kpi_data.tech_debt_text = "Months";
//                         }
//                     }*/
//                 }

//                 //******************************************************************

//                 //*******Continuous Integration(Jenkins{Build Ratio})***************
//                 let ci_data = await CI_data.aggregate(ci_aggregate_query);

//                 if (ci_data.length > 0) {
//                     kpi_data.build_ratio = Math.round(ci_data[0].build_ratio);
//                 }


//                 //******************************************************************

//                 //*********************Bug Ratio or 4th kpi*************************

//                 kpi_data.bug_ratio = 0;

//                 //******************************************************************

//             }
//             return kpi_data;

//         } catch (err) {
//             throw err;
//         }
//     },


    getApplicationsKpis: async (user_name, application_keys, single_application_level,applications) => {




        try{
            let kpi_data = {
                "line_coverage": 0,
                "build_ratio": 0,
                "bug_ratio": 0,
                "technical_debt": 0,
                "tech_debt_text": "Hrs",
                "application_keys": [],
                "stable": 0,
                "warning": 0,
                "at_risk": 0
            }



             let application_keys_array  = await User.aggregate([
                {
                    "$match": {
                        "user_name": user_name
                    }
                },
                {
                    $addFields: {

                        application_keys: {

                            $cond: {
                                if: {
                                    $eq: [application_keys, null]
                                },
                                then: {
                                    $map: {
                                        input: "$user_allocation",
                                        as: "ar",
                                        in: "$$ar.application_key"
                                    }
                                },
                                else: application_keys
                            }
                        }
                    }
                },

            ])




            application_keys = application_keys_array[0].application_keys
            if(application_keys_array[0].is_admin){

            var applicationData = await Application.find()

                application_keys = applicationData.filter(application =>{
                    return application.application_keys
                })


            }



            let user_applications = await Application.aggregate([
                {
                    "$match": {
                        "application_key": {
                            $in : application_keys
                        }
                    }
                },
                {
                    $lookup :{
                        from: "pipelines",
                        localField: "pipelines",
                        foreignField: "_id",
                        as: "pipelines"
                    }
                },
                {

                    $addFields : {
                        user_allocation : application_keys_array[0].user_allocation,
                        application_keys : application_keys,

                    }
                },

                {

                    $addFields : {
                        user_allocation : {
                            $map: {
                                input: "$user_allocation",
                                as: "apps",
                                in: {
                                    $cond: {
                                        if: {
                                            $in: ["$$apps.application_key", "$application_keys"]
                                        },
                                        then: {
                                            pipelines: "$pipelines"
                                        },
                                        else: []
                                    }
                                }
                            }

                        }


                    }
                },
                {
                    $addFields: {
                        pipelines: {
                            $map: {
                                input: "$user_allocation",
                                as: "apps",
                                in: {
                                    $map: {
                                        input: "$$apps.pipelines",
                                        as: "pipes",
                                        in: {
                                            $cond: {
                                                if: {
                                                    $in: ["$$apps.application_key", "$application_keys"]
                                                },
                                                then: {
                                                    pipeline_key: "$$pipes.pipeline_key"
                                                },
                                                else: "$$pipes.pipeline_key"
                                               // else : null
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        pipelines: 1,
                        application_keys: 1
                    }
                },

                {
                    $addFields: {
                        pipelines: {
                            $filter: {
                                input: "$pipelines",
                                as: "pipe",
                                cond: {
                                    $gte: [{ $size: "$$pipe" }, 1]
                                }
                            }
                        }
                    }
                },
                {
                    $unwind: { path: "$pipelines", preserveNullAndEmptyArrays: true }
                },
                {
                    $unwind: { path: "$pipelines", preserveNullAndEmptyArrays: true }
                },
                {
                    $group: {
                        _id: null,
                        pipeline_keys: { $push: "$pipelines" },
                        // pipeline_keys: { $push: "$pipelines.pipeline_key" },
                        application_keys: { $first: "$application_keys" }
                    }
                },
                {
                    $unwind: "$application_keys"
                },
                {
                    $lookup: {
                        from: "applications",
                        localField: "application_keys",
                        foreignField: "application_key",
                        as: "application"
                    }
                },
                {
                    $group:
                    {
                        _id: "$application.application_health",
                        health_count: { $sum: 1 },
                        pipeline_keys: { $push: "$pipeline_keys" },
                        application_keys: { $addToSet: "$application_keys" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        pipeline_keys: 1,
                        application_keys: 1,
                        health_category: "$_id",
                        health_count: 1
                    }
                },
                {
                    $unwind: "$health_category"
                },
                {
                    $group: {
                        _id: null,
                        application_keys: { $addToSet: "$application_keys" },
                        pipeline_keys: { $addToSet: "$pipeline_keys" },
                        "health_category": {
                            $push: {
                                stable_count: {
                                    $cond: {
                                        if: {
                                            $eq: ["$health_category", "STABLE"]
                                        },
                                        then: "$health_count",
                                        else: 0
                                    }
                                },
                                warning_count: {
                                    $cond: {
                                        if: {
                                            $eq: ["$health_category", "WARNING"]
                                        },
                                        then: "$health_count",
                                        else: 0
                                    }
                                },
                                at_risk_count: {
                                    $cond: {
                                        if: {
                                            $eq: ["$health_category", "AT RISK"]
                                        },
                                        then: "$health_count",
                                        else: 0
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $unwind: "$health_category"
                },
                {
                    $group: {
                        _id: null,
                        application_keys: { $first: "$application_keys" },
                        pipeline_keys: { $first: "$pipeline_keys" },
                        stable_count: { $sum: "$health_category.stable_count" },
                        warning_count: { $sum: "$health_category.warning_count" },
                        at_risk_count: { $sum: "$health_category.at_risk_count" }
                    }
                },
                {
                    $unwind: "$application_keys"
                },
                {
                    $unwind: "$application_keys"
                },
                {
                    $unwind: { path: "$pipeline_keys", preserveNullAndEmptyArrays: true }
                },
                {
                    $unwind: { path: "$pipeline_keys", preserveNullAndEmptyArrays: true }
                },
                {
                    $unwind: { path: "$pipeline_keys", preserveNullAndEmptyArrays: true }
                },
                {
                    $group: {
                        _id: null,
                        application_keys: { $addToSet: "$application_keys" },
                        pipeline_keys: { $addToSet: "$pipeline_keys" },
                        stable_count: { $first: "$stable_count" },
                        warning_count: { $first: "$warning_count" },
                        at_risk_count: { $first: "$at_risk_count" }
                    }
                }
            ]);





            if (user_applications.length > 0) {



                let pipeline_keys = user_applications[0].pipeline_keys;

               //pipelineArray = []

            //    for await (var application_key of user_applications[0].application_keys){
            //        var pipelineTempData = await Application.findOne({"application_key" : application_key }).populate('pipelines')

            //       for await ( var pipeline of pipelineTempData.pipelines ){
            //            pipelineArray.push(pipeline.pipeline_key)
            //       }
            //    }
            //    let pipeline_keys = pipelineArray


                application_keys = application_keys == null ? user_applications[0].application_keys : application_keys;
                kpi_data.application_keys = user_applications[0].application_keys;

                kpi_data.stable = user_applications[0].stable_count;
                kpi_data.warning = user_applications[0].warning_count;
                kpi_data.at_risk = user_applications[0].at_risk_count;



                let ca_aggregate_query = [
                    {
                        "$match": {
                            pipeline_key: { $in: pipeline_keys }
                        }
                    },
                    { $sort: { pipeline_key: -1, build_number: -1 } },
                    {
                        $group:
                        {
                            _id: "$pipeline_key",
                            build_number: { $max: "$build_number" },
                            technical_debt: { $first: "$technical_debt" },
                            line_coverage: { $first: "$line_coverage" }
                        }
                    },
                    {
                        $lookup: {
                            from: "pipelines",
                            localField: "_id",
                            foreignField: "pipeline_key",
                            as: "pipeline"
                        }
                    },
                    {
                        $unwind: { path: "$pipeline" }
                    },
                    {
                        $lookup: {
                            from: "applications",
                            localField: "pipeline.application_key",
                            foreignField: "application_key",
                            as: "application"
                        }
                    },
                    {
                        $unwind: { path: "$application" }
                    },
                    {
                        $project: {
                            _id: 0,
                            build_number: 1,
                            technical_debt: 1,
                            line_coverage: 1,
                            application_key: "$pipeline.application_key",
                            pipeline_key: "$_id",
                            total_pipelines_in_application: { $size: "$application.pipelines" }
                        }
                    },
                    {
                        $group: {
                            _id: "$application_key",
                            line_coverage: { $sum: "$line_coverage" },
                            technical_debt: { $sum: "$technical_debt" },
                            total_pipelines_in_application: { $first: "$total_pipelines_in_application" }
                        }
                    },
                    {
                        $project: {
                            application_key: "$application_key",
                            line_coverage: { $divide: ["$line_coverage", "$total_pipelines_in_application"] },
                            technical_debt: { $divide: ["$technical_debt", { $multiply: ["$total_pipelines_in_application", 60] }] }
                        }
                    }
                ];
                let ci_aggregate_query = [
                    {
                        "$match": {
                            pipeline_key: { $in: pipeline_keys }
                        }
                    },
                    {
                        $group:
                        {
                            _id: {
                                pipeline_key: "$pipeline_key",
                                build_result: "$build_result"
                            },
                            build_count: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            "_id": "$_id.pipeline_key",
                            "builds": {
                                $push: {
                                    build_result: {
                                        $cond: {
                                            if: {
                                                $eq: ["$_id.build_result", "SUCCESS"]
                                            },
                                            then: "$_id.build_result",
                                            else: null
                                        }
                                    },
                                    success_builds: {
                                        $cond: {
                                            if: {
                                                $eq: ["$_id.build_result", "SUCCESS"]
                                            },
                                            then: "$build_count",
                                            else: 0
                                        }
                                    }
                                },
                            },
                            "total_builds": { "$sum": "$build_count" }
                        }
                    },
                    {
                        $unwind: { path: "$builds" }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            success_builds: { $sum: "$builds.success_builds" },
                            total_builds: { $first: "$total_builds" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            pipeline_key: "$_id",
                            build_ratio: { $multiply: [{ $divide: ["$success_builds", "$total_builds"] }, 100] }
                        }
                    },
                    {
                        $lookup: {
                            from: "pipelines",
                            localField: "pipeline_key",
                            foreignField: "pipeline_key",
                            as: "pipeline"
                        }
                    },
                    {
                        $unwind: { path: "$pipeline" }
                    },
                    {
                        $lookup: {
                            from: "applications",
                            localField: "pipeline.application_key",
                            foreignField: "application_key",
                            as: "application"
                        }
                    },
                    {
                        $unwind: { path: "$application" }
                    },
                    {
                        $project: {
                            build_ratio: 1,
                            application_key: "$pipeline.application_key",
                            pipeline_key: "$pipeline_key",
                            total_pipelines_in_application: { $size: "$application.pipelines" }
                        }
                    },
                    {
                        $group: {
                            _id: "$application_key",
                            build_ratio: { $sum: "$build_ratio" },
                            no_of_pipeline_builds: { $sum: 1 },  //number of pipelines whos build data found in DB i.e. whos builds were run. So for remaining pipelines whose build never ran initial build_ratio should be 100%
                            total_pipelines_in_application: { $first: "$total_pipelines_in_application" }
                        }
                    },
                    {
                        $project: {
                            application_key: "$_id",
                            build_ratio: { $divide: [{ $sum: ["$build_ratio", { $multiply: [{ $subtract: ["$total_pipelines_in_application", "$no_of_pipeline_builds"] }, 100] }] }, "$total_pipelines_in_application"] }
                        }
                    }
                ];
                if (!single_application_level) {
                    let ca_group_query = {
                        "$group": {
                            _id: null,
                            line_coverage: { $sum: "$line_coverage" },
                            technical_debt: { $sum: "$technical_debt" }
                        }
                    };
                    let ca_project_query = {
                        "$project": {
                            line_coverage: { $divide: ["$line_coverage", application_keys.length] },
                            technical_debt: { $divide: ["$technical_debt", application_keys.length] }
                        }
                    };

                    let ci_group_query = {
                        "$group": {
                            _id: null,
                            build_ratio: { $sum: "$build_ratio" },
                            no_of_application_builds: { $sum: 1 },  //number of applications in which build data found in DB i.e. whos build data found i.e. whos builds were run. So for remaining applications in which for single pipelines where build never ran initially build_ratio should be 100%
                        }
                    };
                    let ci_project_query = {
                        "$project": {
                            build_ratio: { $divide: [{ $sum: ["$build_ratio", { $multiply: [{ $subtract: [application_keys.length, "$no_of_application_builds"] }, 100] }] }, application_keys.length] }
                        }
                    }

                    ca_aggregate_query.push(ca_group_query);
                    ca_aggregate_query.push(ca_project_query);
                    ci_aggregate_query.push(ci_group_query);
                    ci_aggregate_query.push(ci_project_query);

                }
                else {
                    ca_aggregate_query.push({ $sort: { application_key: 1 } });
                    ci_aggregate_query.push({ $sort: { application_key: 1 } });
                }

                //*******Code Analysis(Technical Debt/ Code Coverage)***************
                let ca_data = await Code_analysis.aggregate(ca_aggregate_query);



                if (ca_data.length > 0) {


                    kpi_data.line_coverage = Math.round(ca_data[0].line_coverage);
                    kpi_data.technical_debt = Math.round(ca_data[0].technical_debt);

                    /*if(kpi_data.technical_debt > 720){  //If technical debt is greater than say 720 hours(threshold) i.e. 30 days show tech debt in days
                        kpi_data.technical_debt /= 24;
                        kpi_data.tech_debt_text = "Days";
                        if(kpi_data.technical_debt > 120){  //If technical debt is greater than say 120 days(threshold) i.e. 6 months show tech debt in months
                            kpi_data.technical_debt /= 30;
                            kpi_data.tech_debt_text = "Months";
                        }
                    }*/
                }

              

                //******************************************************************

                //*******Continuous Integration(Jenkins{Build Ratio})***************
                let ci_data = await CI_data.aggregate(ci_aggregate_query);


                if (ci_data.length > 0) {

                    kpi_data.build_ratio = Math.round(ci_data[0].build_ratio);
                }

              


                //******************************************************************

                //*********************Bug Ratio or 4th kpi*************************

                kpi_data.bug_ratio = 0;

                //******************************************************************

            }


            return kpi_data;








        }catch(error){
            throw error;
        }



    },







}

