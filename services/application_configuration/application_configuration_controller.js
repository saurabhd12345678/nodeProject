let appConfigService = require('./application_configuration_service');
const logger = require('../../configurations/logging/logger')
var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {
  app.get(
    "/application/configurations",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let app_configs = await appConfigService.getApplicationConfigurations(
          application_key
        );
        res.status(200).send({ "data": app_configs });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching application configurations",
        });
      }
    }
  );




  app.post(
    "/api/pipeline/onboarding/save_jira_planning",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await appConfigService.save_jira_planning(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.post(
    "/application/configurations/vault",
    token_method.verifyToken,
    async (req, res) => {
      let config_body = req.body;
      try {
        let app_configs = await appConfigService.saveVaultApplicationConfiguration(
          config_body
        );
        res.status(200).send({ "data": app_configs });
      } catch (error) {

        res.status(500).send({
          status: "Error while fetching application configurations",
        });
      }
    }
  );

 
  
}