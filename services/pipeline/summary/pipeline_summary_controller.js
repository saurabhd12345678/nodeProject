var pipeline_summary_service = require('./pipeline_summary_service');

var token_method = require("../../../service_helpers/verify_token");

module.exports = (app) => {
app.get(
  "/api/pipeline/summary/pipeline_summary",token_method.verifyToken,
  token_method.verifyToken,
  async (req, res) => {
    try {
      var pipeline_summary_res = await pipeline_summary_service.summary_pipeline_data(
        req.query.pipeline_key
      ); //PIP8F6XKO1

      res.status(200).send({ data: pipeline_summary_res });
    } catch (err) {

      res.status(500).send({ data: err.message });
    }
  }
);

app.get(
  "/api/checkpipeline",
  // token_method.verifyToken,
  
  async (req, res) => {
    try {
      let response = await pipeline_summary_service.checkPipeline(
        req.query.application_key
      ); 

      res.status(200).send({ data: response });
    } catch (err) {

      res.status(500).send({ data: err.message });
    }
  }
);
}