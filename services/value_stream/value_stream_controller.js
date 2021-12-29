var token_method = require("../../service_helpers/verify_token");
var value_stream_service = require("./value_stream_service");
var activity_logger = require("../../service_helpers/common/activity_logger");
var bb_push = require("../../service_helpers/bitbucket_push");
module.exports = (app) => {
  // token_method.verifyToken,
  app.get(
    "/api/value_stream/get_efficiency",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var application_key = req.query.application_key;
        var value_stream_service_res = await value_stream_service.getEfficiency(
          application_key
        );
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/value_stream/get_cycle_time",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var application_key = req.query.application_key;
        var value_stream_service_res = await value_stream_service.getCycleTime(
          application_key
        );
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/value_stream/get_app_cycle_time",
    token_method.verifyToken,
    token_method.decodeToken,
    async (req, res) => {
      try {
        var value_stream_service_res =
          await value_stream_service.getAppsCycleTime(req.req_user_email);
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/value_stream/get_velocity",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var application_key = req.query.application_key;
        var value_stream_service_res =
          await value_stream_service.getVelocityData(application_key);
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/value_stream/get_app_velocity",
    token_method.verifyToken,
    token_method.decodeToken,
    async (req, res) => {
      try {
        var value_stream_service_res =
          await value_stream_service.getAppsVelocityData(req.req_user_email);
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/value_stream/get_distribution",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var application_key = req.query.application_key;
        var value_stream_service_res =
          await value_stream_service.getDistribution(application_key);
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/value_stream/get_mttr",
    //token_method.verifyToken,
    async (req, res) => {
      try {
        var application_key = req.query.application_key;
        var value_stream_service_res = await value_stream_service.getMTTR(
          application_key
        );
        res.status(200).send({ data: value_stream_service_res });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get("/pushfile", token_method.verifyToken, async (req, res) => {
    try {
      var my_res = await bb_push.pushFilesToBitbucket(req.query.pipeline_key);
      res.status(200).send({ data: my_res });
    } catch (error) {
      res.status(500).send({ data: error.message });
    }
  });
  app.get(
    "/api/value_stream/getDevelopmentMetrics",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let planMetrics = await value_stream_service.getDevelopmentMetrics(
          application_key
        );
        res.status(200).send({ data: planMetrics });
      } catch (error) {
        // logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching plan metrics",
        });
      }
    }
  );
  app.get(
    "/api/value_stream/getPlanMetrics",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let planMetrics = await value_stream_service.getPlanMetrics(
          application_key
        );
        res.status(200).send({ data: planMetrics });
      } catch (error) {
        // logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching plan metrics",
        });
      }
    }
  );
  app.get(
    "/api/value_stream/getTestMetrics",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let testMetrics = await value_stream_service.getTestMetrics(
          application_key
        );
        res.status(200).send({ data: testMetrics });
      } catch (error) {
        // logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching plan metrics",
        });
      }
    }
  );

  app.get(
    "/api/value_stream/getDeployementMetrics",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let deployementMetrics =
          await value_stream_service.getDeployementMetrics(application_key);
        res.status(200).send({ data: deployementMetrics });
      } catch (error) {
        //logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching deployement metrics",
        });
      }
    }
  );
  app.get(
    "/api/value_stream/getTestLtpt",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let testMetrics = await value_stream_service.getTestLtpt(
          application_key
        );
        res.status(200).send({ data: testMetrics });
      } catch (error) {
        //logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching test metrics",
        });
      }
    }
  );
  app.get(
    "/api/value_stream/getDevelopementLtpt",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let deployementMetrics = await value_stream_service.getDevelopementLtpt(
          application_key
        );
        res.status(200).send({ data: deployementMetrics });
      } catch (error) {
        //logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching deployement metrics",
        });
      }
    }
  );
  app.get(
    "/api/value_stream/getDeployementLtpt",
    token_method.verifyToken,
    async (req, res) => {
      let application_key = req.query.application_key;

      try {
        let deployementMetrics = await value_stream_service.getDeployementLtpt(
          application_key
        );
        res.status(200).send({ data: deployementMetrics });
      } catch (error) {
        //logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching deployement metrics",
        });
      }
    }
  );

  app.get('/api/value_stream/getAppsTotalmttr', 
  token_method.verifyToken,
  token_method.decodeToken, 
  async (req, res) => {
    try {
      var value_stream_service_res = await value_stream_service.getTotalMTTR(req.req_user_email);
      res.status(200).send({ "data": value_stream_service_res });

    } catch (error) {
      res.status(500).send({ "data": error.message });
    }
  });


  app.get('/api/value_stream/getAppsTotalefficiency',
    token_method.verifyToken,
    token_method.decodeToken, 
    async (req, res) => {
      try {
        var value_stream_service_res = await value_stream_service.getTotalEfficiency(req.req_user_email);
        res.status(200).send({ "data": value_stream_service_res });

      } catch (error) {
        res.status(500).send({ "data": error.message });
      }
    });
};
