var logger = require('../../../configurations/logging/logger');
var dashboard_service = require('./pipeline_dashboard_service');

var code = require('../../../connectors/codeDX/get_project_list'
)
var token_method = require("../../../service_helpers/verify_token");
var new_codeDx_service = require('../../codeDX_service/codedx_service');


module.exports = (app) => {




  app.get(
    "/pipeline/dashboard/code_analysis",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisData(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_tech_debt",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisTechDebtData(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_bugs",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisBugs(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_code_smells",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisCodeSmells(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_line_cover",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisLineCover(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/api/pipeline/dashboard/pipeline_summary",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let ci_build_data = await dashboard_service.getCiBuildsData(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          ci_build_data: ci_build_data,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching continous integration data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/build_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let build = await dashboard_service.getBuildData(pipeline_key);
        res.status(200).send({
          data: "Success",
          build: build,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching build data",
        });
      }
    }
  );
  app.get(
    "/pipeline/dashboard/Appsbuild_data",
    token_method.verifyToken,
    token_method.decodeToken,
    async (req, res) => {
      try {
        let build = await dashboard_service.getAppsBuildData(req.body.req_user_email);

        res.status(200).send({
          data: "Success",
          build: build,
        });

      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching build data",
        });
      }
    }
  );
  app.get(
    "/pipeline/dashboard/azure_test_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let test_results = await dashboard_service.getAzureTestData(pipeline_key);
        res.status(200).send({
          data: "Success",
          test_result: test_results,
        });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching azure test data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/snow",
    token_method.verifyToken,
    async (req, res) => {
      var application_key = req.query.application_key;
      var pipeline_key = req.query.pipeline_key
      var tool_category = req.query.tool_category

      try {
        var data_by_appKey = await dashboard_service.getServiceNOwData(application_key, pipeline_key, tool_category);
        res.status(200).send({ data: data_by_appKey });
      } catch (error) {
        logger.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching service now data",
        });
      }
    }
  );


  app.get(
    "/pipeline/dashboard/code_analysis_tech_debt",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisTechDebtData(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_bugs",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisBugs(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_code_smells",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisCodeSmells(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/code_analysis_line_cover",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let code_analysis = await dashboard_service.getCodeAnalysisLineCover(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );

  app.get(
    "/api/pipeline/dashboard/pipeline_summary",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let ci_build_data = await dashboard_service.getCiBuildsData(
          pipeline_key
        );
        res.status(200).send({
          data: "Success",
          ci_build_data: ci_build_data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching continous integration data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/build_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let build = await dashboard_service.getBuildData(pipeline_key);
        res.status(200).send({
          data: "Success",
          build: build,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching build data",
        });
      }
    }
  );
 
  app.get(
    "/pipeline/dashboard/azure_test_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;

      try {
        let test_results = await dashboard_service.getAzureTestData(pipeline_key);
        res.status(200).send({
          data: "Success",
          test_result: test_results,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching azure test data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/snow",
    token_method.verifyToken,
    async (req, res) => {
      var application_key = req.query.application_key;
      var pipeline_key = req.query.pipeline_key
      var tool_category = req.query.tool_category

      try {
        var data_by_appKey = await dashboard_service.getServiceNOwData(application_key, pipeline_key, tool_category);
        res.status(200).send({ data: data_by_appKey });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching service now data",
        });
      }
    }
  );



  app.get("/pipeline/dashboard/component/list", token_method.verifyToken, async (req, res) => {
    try {
      var component_list = await dashboard_service.getComponetList(req.query.pipeline_key, req.query.user_email);
      res.send(component_list);
    } catch (err) {
      res.status(500).send("Failed");
    }
  });

  app.post("/pipeline/dashboard/component/save", token_method.verifyToken, async (req, res) => {
    try {
      var save_status = await dashboard_service.saveDashboardPreference(req.body);
      res.status(200).send(save_status);
    } catch (err) {
      res.send("Failed");
    }
  });



  app.post("/pipeline/dashboard/component/add", token_method.verifyToken, async (req, res) => {
    try {
      await dashboard_service.addComponent(req.body)
      res.status(500).send("Success");
    } catch (err) {
      res.send("Failed");
    }
  });


  app.get(
    "/pipeline/dashboard/performance_testing_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getPerformanceTestingData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching stress testing data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/functional_testing_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getfunctionalTestingData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching stress testing data",
        });
      }
    }
  );
  app.get(
    "/pipeline/dashboard/unit_testing_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getUnitTestingData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching stress testing data",
        });
      }
    }
  );



  app.get(
    "/pipeline/dashboard/monitoring_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getmonitoringData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching stress testing data",
        });
      }
    }
  );


  app.get(
    "/pipeline/dashboard/monitoring_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getmonitoringData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching monitoring data",
        });
      }
    }
  );



  app.get(
    "/pipeline/dashboard/security_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getSecurityData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching security data",
        });
      }
    }
  );



  app.get(
    "/pipeline/dashboard/defect_distribution_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getDefectDistributionData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching defect distribution data",
        });
      }
    }
  );

  app.get(
    "/pipeline/dashboard/deployment_data",
    token_method.verifyToken,
    async (req, res) => {
      let pipeline_key = req.query.pipeline_key;
      try {
        let data = await dashboard_service.getDeploymentData(
          pipeline_key
        );
        res.status(200).send({
          msg: "Success",
          data: data,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching deployment data",
        });
      }
    }
  );
  app.get("/pipeline/dashboard/getPlankpiData", token_method.verifyToken, async (req, res) => {

    try {

      var pipelineKpiData = await dashboard_service.getPlankpiData(req.query.pipeline_key)
      res.status(200).send({
        "data": pipelineKpiData
      })

    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  })




  app.get("/pipeline/dashboard/scmCommit", token_method.verifyToken, async (req, res) => {

    try {

      var scm_commit_data = await dashboard_service.getscmCommitData(req.query.pipeline_key);
      res.status(200).send({
        "data": scm_commit_data
      })

    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  })


  app.get("/pipeline/dashboard/commitTimeLine", token_method.verifyToken, async (req, res) => {

    try {

      var scm_commit_data = await dashboard_service.commitTimeLine(req.query.pipeline_key);
      res.status(200).send({
        "data": scm_commit_data
      })

    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  })



  app.get("/pipeline/dashboard/recentCommit", token_method.verifyToken, async (req, res) => {

    try {

      var scm_commit_data = await dashboard_service.getScmLastCommit(req.query.pipeline_key);
      res.status(200).send({
        "data": scm_commit_data
      })

    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  })



  app.get("/api/pipeline/dashboard/qualys_data", async (req, res) => {

    try {

      var qualys_data = await dashboard_service.getQualysData(req.query.pipeline_key);
      res.status(200).send({
        "data": qualys_data
      })

    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  })



  app.get("/pipeline/dashboard/scmkpi", token_method.verifyToken, async (req, res) => {
    try {

      var scm_kpi_data = await dashboard_service.getScmKpi(
        req.query.pipeline_key
      );


      res.status(200).send({
        data: scm_kpi_data,
      });
    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  });



  app.get("/pipeline/dashboard/stest", token_method.verifyToken, async (req, res) => {
    try {

      var a = await code.getProjectList('http://54.87.195.230/codedx/api/projects', 'a01aa79e-be78-4fdS38-8df8-17c20ec0a6ce');

      res.status(200).send(a);
    } catch (error) {
      logger.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error",
      });
    }
  });


  app.get("/pipeline/dashboard/getPipelinePullRequestData", token_method.verifyToken, async (req, res) => {
    try {

      var pipeline_key = req.query.pipeline_key
      var pullRequestData = await dashboard_service.getPullRequestData(pipeline_key)




      res.status(200).send(pullRequestData);
    } catch (error) {
      winston.error("Error with database query: " + error);
      res.status(500).send({
        status: "Error" + error
      });
    }
  });


  app.post("/api/codedx/get_average_days",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        var save_status = await new_codeDx_service.updateAsPerPipeline(req.body.pipeline_key, "AverageResolutionDays");
        res.status(200).send(save_status);
      } catch (err) {
        res.send("Failed");
      }
    });

  app.post("/api/codedx/get_code_metrics",
    // token_method.verifyToken,  
    async (req, res) => {
      try {
        var save_status = await new_codeDx_service.updateAsPerPipeline(req.body.pipeline_key, "CodeMetrics");
        res.status(200).send(save_status);
      } catch (err) {
        res.send("Failed");
      }
    });

  app.post("/api/codedx/get_Top_Vulnerabilities",
    // token_method.verifyToken,  
    async (req, res) => {
      try {
        var save_status = await new_codeDx_service.updateAsPerPipeline(req.body.pipeline_key, "TopVulnerabilities");
        res.status(200).send(save_status);
      } catch (err) {
        res.send("Failed");
      }
    });

  app.get(
    "/pipeline/dashboard/Totalcode_analysis",
    token_method.verifyToken,
    token_method.decodeToken,
    async (req, res) => {
      try {
        let code_analysis = await dashboard_service.getTotalCodeAnalysisData(
          req.req_user_email
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );


  app.get("/pipeline/dashboard/getPipelineName",
    //token_method.verifyToken, 
    async (req, res) => {
      try {
        var PipelineName = await dashboard_service.getPipelineName(req.query.pipeline_key)
        res.status(200).send({ "PipelineName": PipelineName });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error" + error
        });
      }
    });

  app.get("/dashboard/getApplicationName",
    //token_method.verifyToken, 
    async (req, res) => {
      try {
        var ApplicationName = await dashboard_service.getApplicationName(req.query.application_key)
        res.status(200).send({ "ApplicationName": ApplicationName });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error" + error
        });
      }
    });


  app.get(
    "/pipeline/dashboard/Totalcode_analysis",
    //token_method.verifyToken,
    async (req, res) => {
      let user_mail = req.query.user_mail;

      try {
        let code_analysis = await dashboard_service.getTotalCodeAnalysisData(
          user_mail
        );
        res.status(200).send({
          data: "Success",
          code_analysis: code_analysis,
        });
      } catch (error) {
        winston.error("Error with database query: " + error);
        res.status(500).send({
          status: "Error while fetching code analysis data",
        });
      }
    }
  );
}

