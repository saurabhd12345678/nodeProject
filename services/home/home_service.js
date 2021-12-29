var application_list = require('../../service_helpers/application_list');
var calculate_kpis = require('../../service_helpers/calculate_application_kpis');
var generate_key = require('../../service_helpers/generate_key');
var Application = require('../../models/application');
var User = require('../../models/user');
var unit_testing_data = require('../../models/unit_testing_data');
var functional_testing_data = require('../../models/functional_testing_data');
var code_security_data = require("../../models/code_security_data");

var load_testing_data = require("../../models/load_testing_data");
var spike_testing_data = require("../../models/spike_testing_data");
var stress_testing_data = require("../../models/stress_testing_data");
var monitoring_health_data = require("../../models/monitoring_health_data");
var monitoring_env_data = require("../../models/monitoring_env_data");
const monitoring_request_rate_data = require('../../models/monitoring_request_rate_data');
var deployment_build_data = require('../../models/deployment_build_data');
var deployment_status_data = require('../../models/deployment_status_data');

const dashboard_components = require('../../models/dashboard_components');
const dashboard_service = require('../dashboard/dashboard_service');
const { application } = require('express');

const CodeAnalysis = require('../../models/code_analysis')
const CIData = require('../../models/ci_data')
var logger = require('../../configurations/logging/logger');



/**
* This function gets all applications that user is present in and re-calculates every application's health
* @param {String} user_name
*/
getApplications: async (user_name) => {
    var tempArray = []
    try {

        let applications = await application_list.getApplicationList(user_name);



        // applications.forEach(async (application) => {

        // });
        for await (let application of applications) {
            let data = await calculate_kpis.getApplicationsKpis(user_name, [application.application_key], true, applications);

            let health = "";
            if (data.bug_ratio <= 25 && data.line_coverage >= 75) {
                health = "STABLE";
            } else if (data.bug_ratio <= 50 && data.line_coverage >= 50) {
                health = "WARNING";
            } else {
                health = "AT RISK";
            }
            await Application.findOneAndUpdate(
                { application_key: data.application_keys[0] },
                {
                    $set: {
                        "application_health": health
                    }
                }
            );
        }



        return applications;

    } catch (err) {
        throw err;
    }
},

    module.exports.getAllApplications = async (user_name) => {

        try {

            let applications = await application_list.getAllApplicationList();
            var tempArray = []


            // applications.forEach(async (application) => {
            //     let data = await calculate_kpis.getApplicationsKpis(user_name, [application.application_key], true, applications);

            //     let health = "";
            //     if (data.bug_ratio <= 25 && data.line_coverage >= 75) {
            //         health = "STABLE";
            //     } else if (data.bug_ratio <= 50 && data.line_coverage >= 50) {
            //         health = "WARNING";
            //     } else {
            //         health = "AT RISK";
            //     }
            //     await Application.findOneAndUpdate(
            //         { application_key: data.application_keys[0] },
            //         {
            //             $set: {
            //                 "application_health": health
            //             }
            //         }
            //     );
            // });
            for await (let application of applications) {
                let data = await calculate_kpis.getApplicationsKpis(user_name, [application.application_key], true, applications);

                let health = "";
                if (data.bug_ratio <= 25 && data.line_coverage >= 75) {
                    health = "STABLE";
                } else if (data.bug_ratio <= 50 && data.line_coverage >= 50) {
                    health = "WARNING";
                } else {
                    health = "AT RISK";
                }
                await Application.findOneAndUpdate(
                    { application_key: data.application_keys[0] },
                    {
                        $set: {
                            "application_health": health
                        }
                    }
                );

            }





            return applications;

        } catch (err) {
            throw err;
        }
    }

const getApplicationNewVersion = async (user_name) => {

    let applications = await application_list.getApplicationList(user_name);
    for await (let application of applications) {
        var app_line_coverage = 0;
        var app_technical_debt = 0;
        var app_build_ratio = 0;
        var app_bug_ratio = 0 ///Check with Ajinkya
        let pipeline_key_array = await Application.findOne({ "application_key": application.application_key }).populate("pipelines")
        for await (var pipeline of pipeline_key_array.pipelines) {


            let code_analysis_data = await CodeAnalysis.find({ "pipeline_key": pipeline.pipeline_key },
                null
                , {
                    sort: {
                        build_number: -1
                    }
                })
            if (code_analysis_data.length > 0) {
                app_line_coverage += code_analysis_data[0].line_coverage
                app_technical_debt = app_technical_debt + (code_analysis_data[0].technical_debt / 60)
            }

            let ci_analysis_data = await CIData.find({
                "pipeline_key": pipeline.pipeline_key
            })
            var successCount = 0
            var pipelineBuildRatio

            if (ci_analysis_data.length > 0) {

                for (let ci_data of ci_analysis_data) {
                    if (ci_data.build_result == 'SUCCESS') {

                        successCount += 1
                    }

                }
                pipelineBuildRatio = (successCount / ci_analysis_data.length) * 100
            } else {
                pipelineBuildRatio = 100
            }
            app_build_ratio += pipelineBuildRatio

        }
        if (application.pipelines.length == 0) {
            app_build_ratio = 100

        }
        let health = "";
        if (app_bug_ratio <= 25 && app_line_coverage >= 75) {
            health = "STABLE";
        } else if (app_bug_ratio <= 50 && app_line_coverage >= 50) {
            health = "WARNING";
        } else {
            health = "AT RISK";
        }
        await Application.update(
            { application_key: application.application_key },
            {
                $set: {
                    "application_health": health
                }
            }
        );


    }



    return applications;


}

module.exports.getApplicationNewVersion2 = async (user_name) => {
    let applications = await application_list.getApplicationList(user_name);

    applications.filter(async app => {
        var app_line_coverage = 0;
        var app_technical_debt = 0;
        var app_build_ratio = 0;
        var app_bug_ratio = 0

        app.pipelines_array.filter(async pipeline => {

            let code_analysis_data = await CodeAnalysis.find({ "pipeline_key": pipeline.pipeline_key },
                null
                , {
                    sort: {
                        build_number: -1
                    }
                })
            if (code_analysis_data.length > 0) {
                app_line_coverage += code_analysis_data[0].line_coverage
                app_technical_debt = app_technical_debt + (code_analysis_data[0].technical_debt / 60)
            }
            let ci_analysis_data = await CIData.find({
                "pipeline_key": pipeline.pipeline_key
            })

            var successCount = 0
            var pipelineBuildRatio

            if (ci_analysis_data.length > 0) {
                ci_analysis_data.filter(ci_data => {

                    if (ci_data.build_result == 'SUCCESS') {

                        successCount += 1
                    }
                })
                pipelineBuildRatio = (successCount / ci_analysis_data.length) * 100
            } else {
                pipelineBuildRatio = 100
            }
            app_build_ratio += pipelineBuildRatio


        })

        if (app.pipelines.length == 0) {
            app_build_ratio = 100

        }
        let health = "";
        if (app_bug_ratio <= 25 && app_line_coverage >= 75) {
            health = "STABLE";
        } else if (app_bug_ratio <= 50 && app_line_coverage >= 50) {
            health = "WARNING";
        } else {
            health = "AT RISK";
        }
        await Application.updateOne(
            { application_key: app.application_key },
            {
                $set: {
                    "application_health": health
                }
            }
        );

    })


    return applications

}

const getDefaultListOfComponent = async () => {
    try {
        var component_list = await dashboard_components.find({ dashboard_component_key: ["PLAN", "BUIL", "FUTE", "UNTE"] }, { _id: 1 });
        return component_list;
    } catch (err) {

        throw err;
    }
}

/**
* This function gets list of managers
*/
module.exports.getManagers = async () => {

    try {
        let data = await User.aggregate([
            {
                $match: {
                    "user_roles": { $eq: "ADMINISTRATOR" }
                }
            },
            {
                $group: {
                    _id: null,
                    managers: { $addToSet: "$user_name" }
                }
            },
            {
                $project: {
                    _id: 0,
                    managers: 1
                }
            }]);

        return data.length > 0 ? data[0].managers : ["ADMINISTRATOR"];
    } catch (err) {
        return err;
    }

}
const getAdmin = async () => {
    return 'admin'

}
const getDeveloper = async () => {
    return 'developer'

}

/**
* This function creates an application and adds user in the application_user_list
* @param {Object} user_name
* @param {Object} application
*/
module.exports.addApplication = async (user_name, application) => {



    let user = await User.findOne({ "user_name": user_name }).lean();
    let application_key = await generate_key.generateKey(application.application_name);

    application['application_key'] = application_key;
    application.project_manager.id = user.user_id;
    // let default_dashbord_componet_list = await module.exports.getDefaultListOfComponent()
    let admin_user = {
        user_display_name: "ADMIN",
        user_name: "000001",
        user_email: "admin@lntinfotech.com",
        user_role: ['ADMINISTRATOR'],
        dashboard_preference: [],
        dashboard_availabl_component: []
    };
    let developer_user = {
        user_display_name: "DEVELOPER",
        user_name: "000002",
        user_email: "developer@lntinfotech.com",
        user_role: ['DEVELOPER'],
        dashboard_preference: [],
        dashboard_availabl_component: []

    };

    if (user_name != "ADMIN" && user_name != "DEVELOPER") {
        application['users'] = [{
            user_display_name: user.user_name,
            user_name: user.user_id,
            user_email: user.user_mail,
            user_role: ['ADMINISTRATOR'],
            dashboard_preference: [],
            dashboard_availabl_component: []
        },
            admin_user,
            developer_user];

    } else {
        application['users'] = [
            admin_user,
            developer_user];
    }

    try {
        await Application.create(application);
    } catch (err) {

        throw err;
    }
    try {
        if (user_name != "ADMIN" && user_name != "DEVELOPER") {
            await User.findOneAndUpdate(
                { "user_name": user_name },
                {
                    $push: {
                        "user_allocation": {
                            "application_name": application.application_name,
                            //   "pipelines": [],
                            "application_key": application.application_key,
                            "role_name": ["ADMINISTRATOR"],
                            "isAuthorized": true,

                        }
                    }
                },
                {
                    upsert: true
                }
            ).lean();
        }
        //let user_password = 'admin'
        await User.findOneAndUpdate(
            { "user_name": "ADMIN", user_id: "000001" },
            {
                $push: {
                    "user_allocation": {
                        "application_name": application.application_name,
                        //"pipelines": [],
                        "application_key": application.application_key,
                        "role_name": ["ADMINISTRATOR"],
                        "isAuthorized": true
                    }
                },
                $set: {
                    user_id: "000001",
                    user_name: "ADMIN",
                    user_mail: "admin@lntinfotech.com",
                    user_roles: ['ADMINISTRATOR'],
                    user_password: getAdmin()
                },
            },
            {
                upsert: true
            }
        ).lean();

        await User.findOneAndUpdate(
            { "user_name": "DEVELOPER", user_id: "000002" },
            {
                $push: {
                    "user_allocation": {
                        "application_name": application.application_name,
                        // "pipelines": [],
                        "application_key": application.application_key,
                        "role_name": ["DEVELOPER"],
                        "isAuthorized": false,

                    }
                },
                $set: {
                    user_id: "000002",
                    user_name: "DEVELOPER",
                    user_mail: "developer@lntinfotech.com",
                    user_roles: ['DEVELOPER'],
                    user_password: getDeveloper()
                }
            },
            {
                upsert: true
            }
        ).lean();



    } catch (err) {
        logger.error("Adding Application Failed.");
        return err;
    }

    logger.info("Application Added Successfully.");
    return { "status": "Success", "application_key": application_key };


}

/**
* This function calculates kpi of all applications for the logged in user
* @param {Object} user_name
*/
    // async calculateApplicationKpi(user_name, application_keys) {

    //     let kpi_data = {
    //         "no_of_apps": application_keys.length,
    //         "line_coverage": 0,
    //         "build_ratio": 100,
    //         "bug_ratio": 0,
    //         "technical_debt": 0,
    //         "tech_debt_text": "Hrs",
    //         "stable": 0,
    //         "at_risk": 0,
    //         "warning": 0
    //     }

    //     try {

    //         let data = await calculate_kpis.getApplicationsKpis(user_name, application_keys, false);

    //         kpi_data = data;
    //         delete kpi_data["application_keys"];

    //         return kpi_data;

    //     } catch (err) {
    //         throw err;
    //     }


    // }



