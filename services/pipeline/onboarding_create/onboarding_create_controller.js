var onboarding_service = require('./onboarding_create_service');

var token_method = require("../../../service_helpers/verify_token");

var activity_logger = require("../../../service_helpers/common/activity_logger")
module.exports = (app) => {

  app.post(
    "/api/pipeline/onboarding_create/onboard_plan",
      token_method.verifyToken,
    async (req, res) => {
      try {




        var onboarding_plan_service_res = await onboarding_service.onboard_plan_project_application(
          req.body
        );
        res.status(200).send({ data: onboarding_plan_service_res });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );



  app.post(
    "/api/pipeline/onboarding_create/onboard_planning",
     token_method.verifyToken,
    async (req, res) => {
      try {


        var onboarding_plan_service_res = await onboarding_service.onboard_plan_project_application(
          req.body
        );
        
        res.status(200).send({ data: onboarding_plan_service_res });
      } catch (err) {

        res.status(500).send({ data: err.message });
      }
    }
  );
  /**
   * input - pipeline_name,application_key,user_name,pipeline_description
   * output - pipeline_key
   */


  app.post(
    "/api/pipeline/onboarding_create/save_initial_pipeline_data",
    token_method.verifyToken,
    async (req, res) => {
      
      if(!(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.pipeline_name)) && !(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.pipeline_description)))
        {
      try {
        var onboarding_service_response = await onboarding_service.save_pipeline_data(
          req.body
        );
        if (onboarding_service_response.msg == "success") {
          await activity_logger.logActivity(req.body.application_key, onboarding_service_response.pipeline_key, "New Pipeline Created", req.headers["authorization"]);
        }

        res.status(200).send({ data: onboarding_service_response.pipeline_key });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
    else{
      res.status(500).send({
        status: "Format Not matched",
      });
    }
    }
  );


  app.post(
    "/api/pipeline/onboarding_create/onboard_code_quality",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_code_quality_res = await onboarding_service.onboard_code_quality_project(
          req.body
        );
        res.status(200).send({ data: onboarding_code_quality_res });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  /**
   * "instance_name"
   * "pipeline_key"
   * "tool_name"
   * "application_key"
   * "pipeline_name"
   * "project_name"
   * "user_name"
   */
  app.post(
    "/api/pipeline/onboarding_create/onboard_continuous_integration",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_continuous_integration_resp = await onboarding_service.onboard_continuous_integration_project(
          req.body
        );
        res
          .status(200)
          .send({ data: onboarding_continuous_integration_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.get(
    "/api/pipeline/get_onboarded_details",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_get_pipeline_resp = await onboarding_service.get_onboarded_details(
          req.query.pipeline_key
        );
        res.status(200).send({ data: onboarding_get_pipeline_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  app.get('/api/pipeline/getPipelineType', token_method.verifyToken,async (req, res) => {
    try {
      var pipeline_service = await onboarding_service.getPipelineType(req.query.pipeline_key);
      res.status(200).send({ "data": pipeline_service });

    } catch (error) {
      res.status(500).send({ "data": error.message });
    }
  })


  app.get('/application/pipelineData_list', token_method.verifyToken,async (req, res) => {


    try {
      var pipelineList = await onboarding_service.getPipelineListData(req.query.application_key)

      res.status(200).send({ "data": pipelineList })

    } catch (error) {
      res.status(500).send({ "data": error.message });
    }
  })

  // app.get('/updateDate', async (req, res) => {


  //   try {
  //     var resp = await onboarding_service.updateDate(req.query.issue_sprint, req.query.issue_key, req.query.actual_start_date, req.query.actual_end_date,req.query.timespent);

  //     res.status(200).send({ "data": resp })

  //   } catch (error) {
  //     res.status(500).send({ "data": error.message });
  //   }
  // })

}