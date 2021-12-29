var webhook_service = require('./webhook_service');

var token_method = require("../../../service_helpers/verify_token");
module.exports = (app) => {



  app.post(
    "/api/pipeline/webhook/planning",

    async (req, res) => {
      await webhook_service.processPlanApplicationData(req.body);
      res.status(200).send();
    }
  );
  app.post(
    "/api/pipeline/webhook/code_quality", token_method.verifyToken,

    async (req, res) => {

      await webhook_service.processCodeQualityData(req.body);

      res.status(200).send();

    }
  );

  app.post(
    "/api/pipeline/webhook/ci/jenkins", token_method.verifyToken,
    async (req, res) => {
      var webhook = await webhook_service.ci_data(req.body);
      res.status(200).send(webhook);
    }
  );
  app.post(
    "/api/pipeline/webhook/ci/azuredevops",
    async (req, res) => {
      await webhook_service.azuredevops_data(req.body);
     
      //res.send();
    }
  );

  //ng rok start url change
  // create project
  //on board scm
  //push
  app.post(
    "/api/pipeline/webhook/scm/bitbucket",
    token_method.verifyToken,
    async (req, res) => {
      await webhook_service.bitbucket_data(req.body);
      res.send();
    }
  );
  // app.post(
  //   "/api/webhook/planning/azure",
  //   async (req, res) => {
  //    await webhook_service.azure_webhook_data(req.body);    
  //     res.send();
  //   }
  // );
  app.post(
    "/api/pipeline/webhook/scm/gitlab",
    async (req, res) => {
      await webhook_service.gitlab_data(req.body);
      //console.log(req.body);
      res.send();
    }
  );

  app.post(
    "/api/pipeline/webhook/scm/azurerepos",
    async (req, res) => {
      await webhook_service.azurerepos_data(req.body);
      //console.log(req.body);
      res.send();
    }
  );


  app.post(
    "/api/webhook/planning/azure",
    async (req, res) => {
      await webhook_service.azure_webhook_data(req.body);
      res.send();
    }
  );

  app.post(
    "/api/webhook/qualys/test",
    async (req, res) => {
      try {

        let data = req.query.data.split(',')
        let pipeline_key = data[0];
        let build_number = data[1];


        let xyz = await webhook_service.qualys_data_save(pipeline_key, build_number, req.body);

        res.send();
      }

      catch (err) {

        res.send();
      }
    }

  );

}