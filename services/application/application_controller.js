var logger = require('../../configurations/logging/logger');
var application_service = require('./application_service');
let pipeline_helper = require('../../service_helpers/common/get_pipelines');
var token_method = require("../../service_helpers/verify_token");
const roleManager = require('../../middlewares/role_manager');

module.exports = (app) => {

    app.get(
      "/application/application_list",
      //token_method.verifyToken,
      async (req, res) => {
        let user_name = req.query.user_name;

        try {
          let applications = await application_service.getUserApplications(
            user_name
          );
          res.status(200).send(applications);
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching user applications",
          });
        }
      }
    );
    app.get(
      "/application/application_listbyMail",
      //token_method.verifyToken,
      async (req, res) => {
        let user_mail = req.query.user_mail;

        try {
          let applications = await application_service.getUserApplicationsbyEmail(
            user_mail
          );
          res.status(200).send(applications);
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching user applications",
          });
        }
      }
    );
    app.get(
      "/application/pipelines",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let pipelines = await pipeline_helper.get_pipelines(
            application_key
          );
          res.status(200).send(pipelines);
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching pipelines",
          });
        }
      }
    );

    app.get(
      "/application/getPlanningData",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
         let planning_data = await application_service.getPlanningData(application_key)
         
         res.status(200).send(planning_data);
          
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching pipelines",
          });
        }
      }
    );
    app.get(
      "/application/getItsmData",
      token_method.verifyToken,
      async (req, res) => {
        // console.log("itsm app key",req.query.application_key);
        let application_key = req.query.application_key;
        try {
         let itsm_data = await application_service.getITSMData(application_key)
         
         res.status(200).send(itsm_data);
          
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching details",
          });
        }
      }
    );

}