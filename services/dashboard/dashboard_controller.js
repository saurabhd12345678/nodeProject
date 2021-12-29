var logger = require('../..//configurations/logging/logger');
var dashboard_service = require('./dashboard_service');
var azure_service = require('../../connectors/azure_devops/azure_project_sync');
var token_method = require("../../service_helpers/verify_token");

//******************delete************
var Sprint = require('../../models/sprint');
var Planning = require('../../models/planning_data');

//************************************

module.exports = (app) => {


    app.get(
      "/dashboard/application_kpi",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        let user_name = req.query.user_name;

        try {
          let kpi = await dashboard_service.getKpiData(user_name, [
            application_key,
          ]);
          res.status(200).send({
            data: "Success",
            kpi_data: kpi,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching application kpi data",
          });
        }
      }
    );


    app.get(
      "/dashboard/planning_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;

        try {
          let plan = await dashboard_service.getPlankpiData(application_key);


          res.status(200).send({
            data: "Success",
            plan_data: plan,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching planning data",
          });
        }
      }
    );



    app.get(
      "/dashboard/code_analysis",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;

        try {
          let code_analysis = await dashboard_service.getCodeAnalysisData(
            application_key
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
      "/dashboard/build_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;

        try {
          let build = await dashboard_service.getBuildData(application_key);
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
      "/dashboard/azure_dashboard_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;

        try {
          let build = await dashboard_service.getBuildData(application_key);
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
      "/dashboard/unit_testing_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let unit_data = await dashboard_service.getUnitTestingData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: unit_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching unit testing data",
          });
        }
      }
    );

    app.get(
      "/dashboard/functional_testing_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let functional_data = await dashboard_service.getFunctionalTestingData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: functional_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching functional testing data",
          });
        }
      }
    );
    app.get(
      "/dashboard/code_security_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let code_security_data = await dashboard_service.getCodeSecurityData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: code_security_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching code security data",
          });
        }
      }
    );
    app.get(
      "/dashboard/load_testing_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let load_testing_data = await dashboard_service.getLoadTestingData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: load_testing_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching load testing data",
          });
        }
      }
    );
    app.get(
      "/dashboard/stress_testing_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let stress_testing_data = await dashboard_service.getStressTestingData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: stress_testing_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching stress testing data",
          });
        }
      }
    );
    app.get(
      "/dashboard/spike_testing_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let spike_testing_data = await dashboard_service.getSpikeTestingData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: spike_testing_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching spike testing data",
          });
        }
      }
    );
    app.get(
      "/dashboard/monitoring_health_data",
      token_method.verifyToken,
      async (req, res) => {

        let application_key = req.query.application_key;
        try {
          let health_data = await dashboard_service.getMonitoringHealthData(
            application_key
          );


          res.status(200).send({
            msg: "Success",
            data: health_data,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching Monitoring health data",
          });
        }
      }
    );
    app.get(
      "/dashboard/monitoring_env_data",
      token_method.verifyToken,
      async (req, res) => {
        let application_key = req.query.application_key;
        try {
          let env_datas = await dashboard_service.getMonitoringEnvData(
            application_key
          );

          res.status(200).send({
            msg: "Success",
            data: env_datas,
          });
        } catch (error) {
          logger.error("Error with database query: " + error);
          res.status(500).send({
            status: "Error while fetching Monitoring environment data",
          });
        }
      }
    );
     app.get(
       "/dashboard/monitoring_refresh_rate_data",
       token_method.verifyToken,
       async (req, res) => {
         let application_key = req.query.application_key;
         try {
           let refresh_rate_dat = await dashboard_service.getMonitoringRefreshRateData(
             application_key
           );

           res.status(200).send({
             msg: "Success",
             data: refresh_rate_dat,
           });
         } catch (error) {
           logger.error("Error with database query: " + error);
           res.status(500).send({
             status: "Error while fetching Monitoring refresh rate data",
           });
         }
       }
     );
     app.get(
       "/dashboard/deployment_build_data",
       token_method.verifyToken,
       async (req, res) => {
         let application_key = req.query.application_key;
         try {
           let deployment_build_data = await dashboard_service.getDeploymentBuildData(
             application_key
           );

           res.status(200).send({
             msg: "Success",
             data: deployment_build_data,
           });
         } catch (error) {
           logger.error("Error with database query: " + error);
           res.status(500).send({
             status: "Error while fetching Deployment Build data",
           });
         }
       }
     );
     app.get(
       "/dashboard/deployment_status_data",
       token_method.verifyToken,
       async (req, res) => {
         let application_key = req.query.application_key;
         try {
           let deployment_status_data = await dashboard_service.getDeploymentStatusData(
             application_key
           );

           res.status(200).send({
             msg: "Success",
             data: deployment_status_data,
           });
         } catch (error) {
           logger.error("Error with database query: " + error);
           res.status(500).send({
             status: "Error while fetching Deployment status data",
           });
         }
       }
     );




     app.get("/dashboard/component/list",  token_method.verifyToken,async (req, res) => {
      try {
    let component_list  =await dashboard_service.getComponetList(req.query.application_key,req.query.user_email);
        res.send(component_list);
      } catch (err) {
        res.status(500).send("Failed");
      }
    });


    app.post("/dashboard/component/save", token_method.verifyToken, async (req, res) => {
      try {
    let save_status  =await dashboard_service.saveDashboardPreference(req.body);
        res.status(200).send(save_status);
      } catch (err) {
        res.send("Failed");
      }
    });



    app.post("/dashboard/component/add", token_method.verifyToken, async (req, res) => {
      try {
      await dashboard_service.addComponent(req.body)
      res.status(500).send("Success");
      } catch (err) {
        res.send("Failed");
      }
    });


    //*********************************delete*************

    app.post("/sprint", token_method.verifyToken, async (req, res) => {
      let sprint = req.body;

      try {
        await Sprint.create(sprint);

        res.send("Success");
      } catch (err) {
        res.send("Failed");
      }
    });

    app.post("/planning_issue", token_method.verifyToken, async (req, res) => {
      let issue = req.body;

      try {
        await Planning.create(issue);

        res.send("Success");
      } catch (err) {
        res.send("Failed");
      }
    });

    //*****************************************

}