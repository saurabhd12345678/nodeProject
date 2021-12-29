var get_current_date = require('../../service_helpers/common/get_current_date');
var http_request = require("../../service_helpers/HTTP-Request/http_request");
var unirest = require("unirest");
var tooldata = require("../../models/tool");
var snow = require("../../models/itsm_incidents");
var HTTPRequestOptions = {
  requestMethod: "",
  basicAuthToken: "",
  proxyFlag: false,
  reqToken: false,
  urlSuffix: "",
};
var tool_auth_token;
var admin = "admin";
var password = "aFi5SHVSw4mq";
var contentType = "application/json";
var servicenow_url = "https://dev109540.service-now.com";
let auth = "Basic " + Buffer.from(admin + ":" + password).toString("base64");

module.exports = {


  get_all_servicenow_data: async (app_key) => {

    HTTPRequestOptions.requestMethod = "GET";
    responseData = null;
    try {

      await unirest(
        HTTPRequestOptions.requestMethod,
        // `${servicenow_url}/api/now/table/incident?sysparm_query=opened_atONLast%206%20months%40javascript%3Ags.beginningOfLast6Months()%40javascript%3Ags.endOfLast6Months()%5Eu_application_key%3D${app_key}`
        `https://dev109540.service-now.com/api/now/table/incident?sysparm_query=opened_atONLast%206%20months%40javascript%3Ags.beginningOfLast6Months()%40javascript%3Ags.endOfLast6Months()%5Eu_application_key%3D${app_key}`
      )
        .headers({
          Authorization: auth,
        })

        .then((response) => {

          responseData = response.body;
          if (typeof responseData.result === "undefined") {


            responseData = "ERROR";



          } else {

            responseData = responseData.result;
          }


        })
        .catch((error) => {

          responseData = "ERROR";
        });

      return responseData;


    } catch (error) {
      responseData = "ERROR";
      return responseData;
      // throw new Error(error.message);
    }
  },

  get_data_by_sys_id: async (tableName, sys_id) => {
    HTTPRequestOptions.requestMethod = "GET";
    responseData = null;
    try {
      await unirest(
        HTTPRequestOptions.requestMethod,
        `${servicenow_url}/api/now/table/${tableName}/${sys_id}`
      )
        .headers({
          "Content-Type": contentType,
          Authorization: auth,
        })

        .then((response) => {
          responseData = response.body;
        });

      return responseData;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  get_data_by_app_key: async (app_key) => {
    HTTPRequestOptions.requestMethod = "GET";
    responseData = null;
    try {
      await unirest(
        HTTPRequestOptions.requestMethod,
        `${servicenow_url}/api/now/stats/incident?sysparm_query=u_application_key%3D${app_key}&sysparm_count=true&sysparm_group_by=state&sysparm_display_value=true`
      )
        .headers({
          "Content-Type": contentType,
          Authorization: auth,
        })

        .then((response) => {
          responseData = response.body;
        });

      return responseData;
    } catch (error) {
      throw new Error(error.message);
    }
  },
  get_data_by_pipline_key: async (pipeline_key) => {
    HTTPRequestOptions.requestMethod = "GET";
    responseData = null;
    try {
      await unirest(
        HTTPRequestOptions.requestMethod,
        `${servicenow_url}/api/now/stats/incident?sysparm_query=u_pipeline_key%3D${pipeline_key}&sysparm_count=true&sysparm_group_by=state&sysparm_display_value=true`
      )
        .headers({
          "Content-Type": contentType,
          Authorization: auth,
        })

        .then((response) => {
          responseData = response.body;
        });

      return responseData;
    } catch (error) {
      throw new Error(error.message);
    }
  },
  get_all_data_by_app_key: async (app_key) => {
    HTTPRequestOptions.requestMethod = "GET";
    responseData = null;
    try {
      await unirest(
        HTTPRequestOptions.requestMethod,
        //  `https://dev102243.service-now.com/api/now/stats/${tableName}?sysparm_query=u_application_key%3D${app_key}&sysparm_count=true&sysparm_group_by=state&sysparm_display_value=true`

        `${servicenow_url}/api/now/table/incident?sysparm_query=u_application_key%3D${app_key}&sysparm_count=true&sysparm_group_by=state&sysparm_display_value=true`
      )
        .headers({
          "Content-Type": contentType,
          Authorization: auth,
        })

        .then((response) => {
          responseData = response.body;
        });

      return responseData;
    } catch (error) {
      throw new Error(error.message);
    }
  },
  get_all_incidents_by_appKey: async (app_key) => {
    HTTPRequestOptions.requestMethod = "GET";
    responseData = null;
    var tool_details = {
      "tool_url": "",
    }
    var toolsdata = await tooldata.find({ tool_name: "ServiceNow", application_key: app_key }).lean();
    tool_details.tool_url = toolsdata[0].tool_url;
    if (toolsdata[0].tool_auth.auth_type == 'password') {
      tool_auth_token = new Buffer.from(
        toolsdata[0].tool_auth.auth_username + ':' +
        toolsdata[0].tool_auth.auth_password
      ).toString('base64');
    }
    else {
      tool_auth_token = toolsdata[0].tool_auth.auth_token;
    }
    try {
      await unirest(
        HTTPRequestOptions.requestMethod,
        //  `https://dev102243.service-now.com/api/now/stats/${tableName}?sysparm_query=u_application_key%3D${app_key}&sysparm_count=true&sysparm_group_by=state&sysparm_display_value=true`

        `${tool_details.tool_url}/api/now/table/incident?sysparm_query=u_application_key%3D${app_key}&sysparm_count=true&sysparm_group_by=state&sysparm_display_value=true`
      )
        .headers({
          "Content-Type": contentType,
          Authorization: 'Basic' + " " + tool_auth_token,
        })

        .then((response) => {
          responseData = response.body;
        });
      // console.log("res--->", responseData);
      return responseData;
    } catch (error) {

      throw new Error(error.message);
    }
  },
  create_new_incident: async (snow_data) => {
    var tool_details = {
      "tool_url": "",
    }
    var toolsdata = await tooldata.find({ tool_name: "ServiceNow", application_key: snow_data.u_application_key }).lean();
    tool_details.tool_url = toolsdata[0].tool_url;
    let application_key = toolsdata[0].application_key;
    if (toolsdata[0].tool_auth.auth_type == 'password') {
      tool_auth_token = new Buffer.from(
        toolsdata[0].tool_auth.auth_username + ':' +
        toolsdata[0].tool_auth.auth_password
      ).toString('base64');
    }
    else {
      tool_auth_token = toolsdata[0].tool_auth.auth_token;
    }
    try {
      await unirest('POST', `${tool_details.tool_url}/api/now/table/incident`)
        .headers({
          'Authorization': 'Basic' + " " + tool_auth_token,
          'Content-Type': 'application/json',
        })
        .send(JSON.stringify({
          "short_description": snow_data.short_description,
          "u_application_key": snow_data.u_application_key,
          "u_pipeline_key": snow_data.u_pipeline_key
        }))
        .then((response) => {
          resp = response.body.result
        });

        await snow.findOneAndUpdate(
          { incident_number: resp.number, application_key: snow_data.u_application_key },
          {
              $set: {
                  application_key: snow_data.u_application_key,
                  pipeline_key: snow_data.u_pipeline_key,
                  opened_at: resp.opened_at,
                  closed_at: resp.closed_at,
                  incident_state: resp.closed_at != "" ? "Closed" : "New",
                  calendar_stc: resp.calendar_stc,
                  incident_number: resp.number,
                  Description: snow_data.short_description
              }
          },
          { upsert: true, new: true }
      )        

      return resp;
    }
    catch (error) {

      throw new Error(error.message);
    }
  },


};
