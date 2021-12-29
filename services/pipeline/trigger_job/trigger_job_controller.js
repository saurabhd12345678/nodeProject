var trigger_job_service = require('./trigger_job_service');

var token_method = require("../../../service_helpers/verify_token");

var activity_logger = require('../../../service_helpers/common/activity_logger');
var ci_sync_db_save = require("../../../service_helpers/common/ci_sync_db_save");
const pipeline = require("../../../models/pipeline");


module.exports = (app) => {
  app.get(
    "/api/pipeline/trigger_job",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var trigger_job_res = await trigger_job_service.trigger_job(
          req.query.pipeline_key, req.query.application_key, req.query.user_name
        );
        // if (trigger_job_res=="Jenkins job has been started")
        // {
        //    await activity_logger.logActivity(req.query.application_key,req.query.pipeline_key,"Jenkin Job triggered",req.headers["authorization"]);
        // }

        res.status(200).send({ data: trigger_job_res });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  app.post(
    "/api/pipeline/test_trigger",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        var input = req.body;
        let job = await pipeline.findOne({ pipeline_key: input.pipeline_key });
        if (job.continuous_integration != undefined) {
          var jobname = job.continuous_integration.job_name;
        }
     
        var update_status = await ci_sync_db_save.jenkins_save_build_data(input.pipeline_key, input.build_number, jobname);
        if (update_status == "done") {
          res.status(200).send({ data: update_status });
        }
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
}