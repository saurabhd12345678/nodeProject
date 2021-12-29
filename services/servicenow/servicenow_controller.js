// const servicenow_service = require('./servicenow_service');
const { pipeline } = require('nodemailer/lib/xoauth2');
var servicenow_service = require('./servicenow_service');
var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {


  app.get(
    "/api/get_all_incident_data",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var all_incident_data = await servicenow_service.get_all_incident_data();
        res.status(200).send({ data: all_incident_data });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );


  app.get(
    "/api/get_data_by_id",
    token_method.verifyToken,
    async (req, res) => {

      var tableName = req.query.tableName;
      var sys_id = req.query.sys_id;

      try {
        var data_by_id = await servicenow_service.get_data_by_id(tableName, sys_id);
        res.status(200).send({ data: data_by_id });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.get(
    "/api/get_data_by_app_key",
    token_method.verifyToken,
    async (req, res) => {

      // var tableName = req.query.tableName;
      var app_key = req.query.app_key;

      try {
        var data_by_appKey = await servicenow_service.get_data_by_appKey(app_key);
        res.status(200).send({ data: data_by_appKey });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );


  app.get(
    "/api/get_data_by_pipeline_key",
    token_method.verifyToken,
    async (req, res) => {

      // var tableName = req.query.tableName;
      var app_key = req.query.app_key;
      var pipeline_key = req.query.pipeline_key

      try {
        var data_by_appKey = await servicenow_service.get_data_by_pipeline_key(app_key, pipeline_key);
        res.status(200).send({ data: data_by_appKey });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.get(
    "/api/get_all_data_by_app_key",
    token_method.verifyToken,
    async (req, res) => {

      // var tableName = req.query.tableName;
      var app_key = req.query.app_key;

      try {
        var data_all_by_appKey = await servicenow_service.get_all_data_by_appKey(app_key);
        res.status(200).send({ data: data_all_by_appKey });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  app.get(
    "/api/get_incidents_of_application",
    //token_method.verifyToken,
    async (req, res) => {

      // var tableName = req.query.tableName;
      var app_key = req.query.application_key;

      try {
        var data_all_by_appKey = await servicenow_service.get_all_incidents_by_app(app_key);
        res.status(200).send({ data: data_all_by_appKey });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );


  app.put(
    "/api/update_data_by_id",
    token_method.verifyToken,
    async (req, res) => {

      var tableName = req.query.tableName;
      var sys_id = req.query.sys_id;

      try {
        var updated_data_by_id = await servicenow_service.update_data_by_id(tableName, sys_id, req.body);
        res.status(200).send({ data: updated_data_by_id });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.delete(
    "/api/delete_data_by_id",
    token_method.verifyToken,
    async (req, res) => {

      var tableName = req.query.tableName;
      var sys_id = req.query.sys_id;

      try {
        var data_by_id = await servicenow_service.delete_data_by_id(tableName, sys_id);
        res.status(200).send({ data: data_by_id });

      }
      catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );


}

