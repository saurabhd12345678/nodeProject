const codedx_service = require("./codedx_service");
var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {

  app.post(
    "/api/codedx/get_finding_table",token_method.verifyToken,

    async (req, res) => {
      try {

        var pipeline_key = req.body.pipeline_key
        var codedx_service_response = await codedx_service.get_codedx_finding_data(pipeline_key);
        res.status(200).send(codedx_service_response);
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
}