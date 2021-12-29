const { token } = require('morgan');
const azure_service = require('./azure_services');
var application_data = require('../../models/application');
var tool_detail = require('../../models/tool');
var token_method = require("../../service_helpers/verify_token");
const { forEach } = require('async');
const planning_data = require('../../models/planning_data');
const sprints = require('../../models/sprint');
const tools = require('../../models/tool');
module.exports = (app) => {
  // app.get(
  //   "/api/get_azure_projects",

  //   async (req, res) => {

  //     try {
  //      let project_array = await azure_service.get_azure_projects()
  //       res.status(200).send(project_array);
  //     }
  //     catch(error){
  //         res.status(500).send({"data":error.message});
  //     }
  // }); 


  app.get(
    "/api/settings/sync_azure_projects",
    // token_method.verifyToken,
    async (req, res) => {

      try {

        var tool_info = req.query;

        var settings_service_response = await azure_service.sync_azure_projects(tool_info);

        if (settings_service_response == "Projects data fetched successfully") {
          await activity_logger.logActivity(req.query.application_key, "-", "Sync Project Completed", req.headers["authorization"]);

        }
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );


  app.get(
    "/api/delete",

    async (req, res) => {
      try {
        var application_key = req.query.application_key

        await planning_data.deleteMany({ "application_key": application_key })
        await sprints.deleteMany({ "application_key": application_key });
        await tools.deleteMany({ "application_key": application_key, tool_name: "Jira" });
        res.status(200).send("success");
      }
      catch (error) {
        res.status(500).send({ "data": error.message });
      }
    });


  app.get(
    "/application/AzuregetAreas",
    // token_method.verifyToken,
    async (req, res) => {

      var tool_info = req.query
      try {
        let project_areas = await azure_service.getProjectAreas(
          tool_info
        );
        res.status(200).send({ "data": project_areas });


      } catch (error) {
        res.status(500).send({

          status: "Error while fetching application configurations",
        });

      }
    }
  );

  app.post(
    "/api/settings/save_azure",
    token_method.verifyToken,
    async (req, res) => {
      try {
        plan_obj = req.body;
        let save_azure = await azure_service.save_plan_azure_application(plan_obj);

        res.status(200).send({ data: save_azure });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.post(
    "/api/config/delete_azure_webhook",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        let project_id = req.body.project_id;
        let azure_url = req.body.azure_url;
        let azure_auth_token = req.body.azure_auth_token;

        let save_azure = await azure_service.delete_azure_webhook(project_id, azure_url, azure_auth_token);
        if (save_azure == '200') {
          res.status(200).send("success");
        } else {
          res.status(500).send("failed");
        }
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );


  app.post(
    "/api/config/create_azure_webhook",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        let project_id = req.body.project_id;
        let azure_url = req.body.azure_url;
        let azure_auth_token = req.body.azure_auth_token;

        let save_azure = await azure_service.create_azure_webhook(project_id, azure_url, azure_auth_token);
        if (save_azure == '200') {
          res.status(200).send("success");
        } else {
          res.status(500).send("failed");
        }
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.post(
    "/api/config/update_azure_webhook",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        let project_id = req.body.project_id;
        let azure_url = req.body.azure_url;
        let azure_auth_token = req.body.azure_auth_token;

        let save_azure = await azure_service.update_azure_webhook(project_id, azure_url, azure_auth_token);
        if (save_azure == '200') {
          res.status(200).send("success");
        }
        else {
          res.status(500).send("failed");
        }
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.get(
    "/api/work_item_id_azure",

    async (req, res) => {
      try {
        var application_key = req.query.application_key

        let result = await azure_service.get_work_item_id_azure(application_key)
        res.status(200).send(JSON.stringify(result));
      }
      catch (error) {

        res.status(500).send({ "data": error.message });

      }
    });



}





