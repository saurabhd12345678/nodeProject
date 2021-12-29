const maturity_service = require('./maturity_service');

var activity_logger=require('../../service_helpers/common/activity_logger')
var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {


    app.get(
      "/api/maturity/application_maturity",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var maturity_service_response = await maturity_service.application_maturity(
            req.query.application_key
          );
          res.status(200).send({ data: maturity_service_response });
        } catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
    );

    app.get(
      "/api/maturity/get_all_maturity_data",token_method.verifyToken,

      async (req, res) => {
        try {
          var maturity_service_response = await maturity_service.all_maturity_data();
          res.status(200).send({ data: maturity_service_response });
        } catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
    );

    app.post(
      "/api/maturity/save_maturity",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var maturity_service_response = await maturity_service.save_maturity(
            req.body
          );
          if (maturity_service_response == "Maturity record saved successfully")
          {

            await activity_logger.logActivity(req.body.application_key,"-","Maturity Answers Updated",req.headers["authorization"]);
          }
          res.status(200).send({ data: maturity_service_response });
        } catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
    );
    app.get(
      "/api/maturity/recommendation",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var maturity_service_response = await maturity_service.recommendation(
            req.query.maturity_index
          );
          res.status(200).send({ data: maturity_service_response });
        } catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
    );
    app.get(
      "/api/maturity/pdf_data",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var maturity_service_response = await maturity_service.pdf_data(
            req.query.application_key
          );
          res.status(200).send({ data: maturity_service_response });
        } catch (error) {
          res.status(500).send({ data: error.message });
        }

    });
    app.post("/api/maturity/save_category_maturity",async(req,res)=>{
    
      if(!(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.category_name)) && !(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.category_questions[0].question)) 
      )
        {
        try{
            var maturity_service_response = await maturity_service.save_category_maturity(req.body);
            res.status(200).send({"data":maturity_service_response,status:true});
            
        }
        catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
      else{
        
        res.status(500).send({
          status: false,
          message : "Format not matched"
        });
      }
      }
    );
    app.get(
      "/api/maturity/pdf_data",
      token_method.verifyToken,
      async (req, res) => {
        try {
          var maturity_service_response = await maturity_service.pdf_data(
            req.query.application_key
          );
          res.status(200).send({ data: maturity_service_response });
        } catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
    );

    app.put("/api/maturity/update_category_questions_answers_maturity",token_method.verifyToken,async(req,res)=>{
        try{
            var maturity_service_response = await maturity_service.update_category_questions_answers_maturity(req.body);
            res.status(200).send({"data":maturity_service_response});
        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.get(
        "/api/maturity/weights",token_method.verifyToken,

        async (req, res) => {
          try {
            var maturity_service_response = await maturity_service.get_existing_weights(
              req.body
            );
            res.status(200).send({ data: maturity_service_response });
          } catch (error) {
            res.status(500).send({ data: error.message });
          }
        }
      );
 
      
      app.post(
        "/api/maturity/update_weights",token_method.verifyToken,

        async (req, res) => {
          
          if(!(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.category_questions[0].question)))
          {
          try {
            var maturity_service_response = await maturity_service.update_category_questions(
              req.body
            );
            res.status(200).send({ data: maturity_service_response });
          } catch (error) {
            res.status(500).send({ data: error.message });
          }
        }
        else{
          res.status(500).send({
            status: "Failed to add application",
          });
        }
        }
      );


}