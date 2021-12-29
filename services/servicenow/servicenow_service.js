
var servicenow_connector = require('../../connectors/servicenow/servicenow_crud');
var tool = require('../../models/tool');
var snow = require('../../models/itsm_incidents');


module.exports.get_all_incident_data = async (app_key) => {


    try {

        var incident_details = await servicenow_connector.get_all_servicenow_data(app_key);
        return incident_details;

    }

    catch (err) {
        throw err;
    }
}

module.exports.get_data_by_id = async (tableName, sys_id) => {


    try {

        var incident_details = await servicenow_connector.get_data_by_sys_id(tableName, sys_id);
        return incident_details;

    }

    catch (err) {
        throw err;
    }
},

    module.exports.get_data_by_appKey = async function (app_key) {

        let status_data = {
            "New": 0,
            "In_Progress": 0,
            "Closed": 0
        };

        var checkcategory = [];


        try {

            var status_cat = await tool.findOne({ application_key: app_key, tool_category: "ITSM" });


            checkcategory = status_cat.status_category.In_Progress;
            //get_data_by_app_key

            var incident_details = await servicenow_connector.get_data_by_pipline_key(app_key);
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
            throw err;

        }
    },
    module.exports.get_data_by_pipeline_key = async function (app_key, pipeline_key) {

        let status_data = {
            "New": 0,
            "In_Progress": 0,
            "Closed": 0
        };

        var checkcategory = [];


        try {

            var status_cat = await tool.findOne({ application_key: app_key, tool_category: "ITSM" });


            checkcategory = status_cat.status_category.In_Progress;
            var incident_details = await servicenow_connector.get_data_by_pipline_key(pipeline_key);
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

    module.exports.get_all_data_by_appKey = async (app_key) => {


        try {

            var incident_details = await servicenow_connector.get_all_data_by_app_key(app_key);
            return incident_details;

        }

        catch (err) {
            throw err;
        }
    }
module.exports.get_all_incidents_by_app = async (app_key) => {


    try {

        var detailOfIncident = await servicenow_connector.get_all_incidents_by_appKey(app_key);
        var incidents = detailOfIncident.result;

        if (incidents == undefined) {
            return "failure";
        }
        else {
            await snow.deleteMany({ application_key: app_key });

            for await (let incident of incidents) {

                let incident_object = {
                    application_key: app_key,
                    pipeline_key: incident.u_pipeline_key,
                    opened_at: incident.opened_at,
                    closed_at: incident.closed_at,
                    incident_state: incident.incident_state,
                    calendar_stc: incident.calendar_stc,
                    incident_number: incident.number,
                    Description: incident.short_description
                }
                // await snow.create(incident_object);

                await snow.findOneAndUpdate(
                    { incident_number: incident.number, application_key: app_key },
                    {
                        $set: {
                            application_key: app_key,
                            pipeline_key: incident.u_pipeline_key == "" ? "" : incident.u_pipeline_key,
                            opened_at: incident.opened_at,
                            closed_at: incident.closed_at,
                            incident_state: incident.closed_at != "" ? "Closed" : incident.incident_state,
                            calendar_stc: incident.calendar_stc,
                            incident_number: incident.number,
                            Description: incident.short_description == "" ? "" : incident.short_description
                        }
                    },
                    { upsert: true, new: true }
                )

            }

            return "success"
        }
    }

    catch (error) {

        throw error;
    }
}








