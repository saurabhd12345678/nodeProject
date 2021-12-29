var logger = require('../..//configurations/logging/logger');
var home_service = require('./home_service');
var token_method = require('../../service_helpers/verify_token');
var {checkPermissions} = require('../../middlewares/role_manager')
var ServiceConstants = require('../../service_helpers/service_constants')
var activity_logger=require('../../service_helpers/common/activity_logger')
const { check, validationResult } = require('express-validator');


//****************delete**************** */
var Pipeline = require('../../models/pipeline');
var Application = require('../../models/application');
var User = require('../../models/user');
var Code_analysis = require('../../models/code_analysis');
var CI_data = require('../../models/ci_data');
var role_manager = require('../../middlewares/role_manager');
const user = require('../../models/user');
const { GRANT } = require('../../service_helpers/service_constants');
//****************delete**************** */


module.exports = (app) => {

    app.get("/home/application_list",token_method.verifyToken,async (req, res) => {




            let user_name = req.query.user_name;



            try {
              var adminAccess = await role_manager.getActionPermissionAccessOptimized(user_name,"","")
              if(adminAccess == GRANT){

                let applications = await home_service.getAllApplications(user_name);

                res.status(200).send(applications);

              }else{

              let applications = await home_service.getApplicationNewVersion2(user_name);
                res.status(200).send(applications);
              }


            } catch (error) {
              logger.error("Error with database query: " + error);
              res.status(500).send({
                status: "Error while fetching user applications",
              });
            }

    })

    app.get("/home/manager_list", token_method.verifyToken, async (req, res) => {

        try {

            let managers = await home_service.getManagers();
            res.status(200).send(managers);

        } catch (error) {
            logger.error("Error with database query: " + error);
            res.status(500).send({
                "status": "Error while fetching managers"
            });
        }

    })

    app.post(
      "/home/add_application",
      token_method.verifyToken,
      
      async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
        }
        let user_name = req.body.user_name;
        let application = req.body.application;
        
        ///method  calll
        if(!(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(application.application_name)) && !(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(application.application_desc)))
        {
          try {
            let result= await home_service.addApplication(
              user_name,
              application
            );
            if (result.status == "Success")
            {
              await activity_logger.logActivity(result.application_key,"-","Application Added ",req.headers["authorization"]);
  
              res.status(200).send({
                permissionAccess : ServiceConstants.GRANT,
                status: "Successfully added application",
              });
            }
            else throw new Error(status);
          } catch (error) {
            logger.error("Error with database query:\n" + error);
            res.status(500).send({
              status: "Failed to add application",
            });
          }
        }
        else{
          res.status(500).send({
            status: "Failed to add application",
          });
        }



        
      }
    );

    // app.post(
    //   "/home/calculate_application_kpi",
    //   token_method.verifyToken,
    //   async (req, res) => {
    //     let user_name = req.body.user_name;
    //     let application_keys = req.body.application_keys;

    //     try {
    //       let kpi_data = await home_service.calculateApplicationKpi(
    //         user_name,
    //         application_keys
    //       );
    //       res.status(200).send({
    //         status: "Successfully calculated application kpis",
    //         kpi_data: kpi_data,
    //       });
    //     } catch (error) {
    //       logger.error(
    //         "Error with calculation of application kpis:\n" + error
    //       );
    //       res.status(500).send({
    //         status: "Failed to calculate application kpi",
    //       });
    //     }
    //   }
    // );


    //****************delete**************** */
    app.post("/add_pipeline", token_method.verifyToken, async (req, res) => {
      let pipeline = req.body;

      try {
        let pipe = await Pipeline.create(pipeline);

        let app = await Application.findOneAndUpdate(
          { application_key: pipe.application_key },
          {
            $push: {
              pipelines: pipe._id,
            },
          }
        );

        await User.findOneAndUpdate(
          {
            user_name: "rahul",
            "user_allocation.application_key": pipeline.application_key,
          },
          {
            $push: {
              "user_allocation.$.pipelines": {
                pipeline_key: pipeline.pipeline_key,
                pipeline_name: pipeline.pipeline_name,
              },
            },
            $set: {
              application_name: app.application_name,
              application_key: app.application_key,
            },
          },
          {
            upsert: true,
          }
        );

        res.send("Success");
      } catch (err) {
        res.send("Failed");
      }
    });

    app.post("/Code_analysis", token_method.verifyToken, async (req, res) => {
      let ca = req.body;

      try {
        await Code_analysis.create(ca);

        res.send("Success");
      } catch (err) {
        res.send("Failed");
      }
    });

    app.post("/ci", token_method.verifyToken, async (req, res) => {
      let ci = req.body;

      try {
        await CI_data.create(ci);

        res.send("Success");
      } catch (err) {
        res.send("Failed");
      }
    });

    //****************delete**************** */

}