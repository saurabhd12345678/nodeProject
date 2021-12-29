var Application = require('../models/application');
var User = require('../models/user');
var calculate_kpis = require('./calculate_application_kpis');
var HTTPRequest = require('../service_helpers/HTTP-Request/http_request');


module.exports = {

    /**
 * This function gets applications kpis for the user
 * @param {String} user_name
 */
    getApplicationList: async (user_name) => {

        try {

            let user = await User.aggregate([
                {
                    "$match": {
                        "user_name": user_name
                    }
                },
                {
                    $addFields: {
                        application_keys: {
                            "$map": { "input": "$user_allocation", "as": "ar", "in": "$$ar.application_key" }
                        }
                    }
                }
            ]);

            let user_applications = await Application.aggregate([
                { "$match": { application_key: { $in: user[0].application_keys } } },
                // { "$match": { application_key: "TEST-12fu4zs"} } ,
                {
                    $lookup: {
                        from: "pipelines",
                        localField: "pipelines",
                        foreignField: "_id",
                        as: "pipelines_array"
                    }
                },
                {
                    $addFields: {
                        month: {
                            $let: {
                                vars: {
                                    monthsInString: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July',
                                        'August', 'September', 'October', 'November', 'December']
                                },
                                in: {
                                    $arrayElemAt: ['$$monthsInString', { $month: "$createdAt" }]
                                }
                            }
                        }
                    }
                },
                {
                    "$project": {
                        pipelines: { $size: "$pipelines" },
                        "_id": 0,
                        "application_name": 1,
                        "application_key": 1,
                        "application_type": 1,
                        "application_desc": 1,
                        "application_health": 1,
                        "project_manager": 1,
                        "pipelines_array": 1,
                        "created_at": { $concat: ["$month", " ", { $dateToString: { format: "%d, %Y", date: "$createdAt" } }] }
                    }
                }
            ]);


            return user_applications;

        } catch (err) {

            throw err;
        }

    }


    ,


    getAzureProjectAreas: async (tool_info) => {
        try {
           
            let azure_auth_token
           
            // let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            //     tool_info.application_key
            // );


            // if (vault_config_status == true) {
            //     let vault_configuration = await hashicorp_vault_config.read_tool_secret(
            //         tool_info.application_key,
            //         tool_info.tool_category,
            //         tool_info.tool_name,
            //         tool_info.tool_instance_name
            //     );
            //     ("1 if");

            //     if (vault_configuration.auth_type == "password") {
            

            //         azure_auth_token = new Buffer.from(
            //             vault_configuration.auth_username + ':' +
            //             vault_configuration.auth_password
            //         ).toString('base64');

            //     } else {
            

            // azure_auth_token = vault_configuration.auth_token;
            // }
            // }
            // else {
           
            // let tool_info.auth_username="";
            let auth_username = "";
            if (tool_info.tool_auth_type == 'password') {
               
                azure_auth_token = new Buffer.from(
                    auth_username + ':' +
                    tool_info.tool_auth_password
                ).toString('base64');

            }
            else {
                

                azure_auth_token = tool_info.tool_auth_token;
        
            }
           


            // }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: azure_auth_token,
                proxyFlag: tool_info.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            // (`${tool_details.tool_url}/projects/${project_key}`)
            var azure_projects_url = `${tool_info.tool_url}/${tool_info.project_name}/_apis/wit/classificationnodes/areas?$depth=2&api-version=5.0`;
            

            var fetched_areas = await HTTPRequest.make_request(encodeURI(azure_projects_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            

            
            return (fetched_areas.body);
        }
        catch (error) {
            return (error);
        }




    },

    getAllApplicationList: async () => {

        try {



            let admin_applications = await Application.find();
            let applicationArray = []
            admin_applications.map(async (application) => {
                let date = new Date(application.createdAt);
                let month = await module.exports.getMonthData(date.getMonth() + 1)
                let created_At = (month) + ' ' + date.getDate() + ', ' + date.getFullYear();
                let applicationObject = {
                    application_desc: application.application_desc,
                    application_health: application.application_health,
                    application_name: application.application_name,
                    application_type: application.application_type,
                    project_manager: application.project_manager,
                    application_key: application.application_key,
                    pipelines: application.pipelines.length,
                    created_at: created_At
                }
                applicationArray.push(applicationObject)
            })

            return applicationArray;

        } catch (err) {
            throw err;
        }

    },

    getMonthData: async (monthNumber) => {

        switch (monthNumber) {
            case 1:
                return "January"

            case 2:
                return "February"
            case 3:
                return "March"
            case 4:
                return "April"
            case 5:
                return "May"
            case 6:
                return "June"
            case 7:
                return "July"
            case 8:
                return "August"
            case 9:
                return "September"
            case 10:
                return "October"
            case 11:
                return "November"
            case 12:
                return "December"

        }


    }


}