var template_screen_service = require('./template_screen_service');

var token_method = require("../../../service_helpers/verify_token");

var activity_logger=require('../../../service_helpers/common/activity_logger')

module.exports = (app) => {
    app.post(
      "/api/pipeline/template_screen/save_custom_template",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var template_screen_service_response = await template_screen_service.save_custom_template(
            req.body
          );
          if (template_screen_service_response=="Template saved successfully"){
            await activity_logger.logActivity(req.body.application_key,"-","New Template Created",req.headers["authorization"]);
          }

          res.status(200).send({ data: template_screen_service_response });
        } catch (err) {
          res.status(500).send({ data: err.message });
        }
      }
    );
    app.get(
      "/api/pipeline/template_screen/get_all_templates",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var template_screen_service_response = await template_screen_service.get_all_templates(
            req.query.application_key
          );
          res.status(200).send({ data: template_screen_service_response });
        } catch (err) {
          res.status(500).send({ data: err.message });
        }
      }
    );
}