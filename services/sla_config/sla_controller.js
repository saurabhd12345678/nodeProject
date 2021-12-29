var sla_service = require('./sla_service');
var token_method = require("../../service_helpers/verify_token");

module.exports = (app) => {
  app.get(
    "/api/sla/config/:config_id",
    token_method.verifyToken,
    async (req, res) => {
      try {
        if(!req.params.config_id) {
          res.status(400).send({ data: 'Config Id not found' });  
          return;
        }
        var sla_config_response = await sla_service.get_config(
          req.params.config_id
        );

        if(!sla_config_response) {
          res.status(404).send({ data: sla_config_response });
          return;
        }
        else {
          res.status(200).send({ data: sla_config_response });
        }
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.get(
    "/api/sla/config/all/:pipeline_key",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_config_response = await sla_service.get_all_configs(req.params.pipeline_key);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.post(
    "/api/sla/config",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_config_response = await sla_service.create_config(req.body);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.put(
    "/api/sla/config",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_config_response = await sla_service.update_config(req.body);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.delete(
    "/api/sla/config/:config_id",
    token_method.verifyToken,
    async (req, res) => {
      try {
        if(!req.params.config_id) {
          res.status(200).send({ data: 'Config Id not found' });  
          return;
        }
        var sla_config_response = await sla_service.delete_config(req.params.config_id);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.get(
    "/api/sla/global-config/:pipeline_key",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_config_response = await sla_service.get_pip_config(req.params.pipeline_key);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.post(
    "/api/sla/global-config",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_config_response = await sla_service.create_pip_config(req.body);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.put(
    "/api/sla/global-config",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_config_response = await sla_service.update_pip_config(req.body);
        res.status(200).send({ data: sla_config_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  ),
  app.get(
    "/api/sla-dashboard/:pipeline_key",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var sla_dashboard_response = await sla_service.get_sla_dashboard(req.params.pipeline_key);
        if(sla_dashboard_response && sla_dashboard_response.length > 0) {
          res.status(200).send({ data: sla_dashboard_response });
          return;
        }
        res.status(404).send({ data: 'No Dashboard data found' });
          return;
        
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  )
}