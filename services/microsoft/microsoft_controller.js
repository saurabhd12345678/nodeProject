const { token } = require('morgan');
const microsoft_service = require('./microsoft_service');

var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {
    app.get(
      "/api/get_lti_users",
       token_method.verifyToken,
      async (req, res) => {
        var name = req.query.name;
        var access_token = req.query.access_token;



        try {
          var response = await microsoft_service.get_users(name, access_token);
          // var response = await microsoft_service.get_users(name, access_token);
          res.status(200).send({ data: response });
        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });
    app.get(
      "/api/get_profile_photo",
      token_method.verifyToken,
      async(req,res)=>{

        var access_token = req.query.access_token;
        var mailID = req.query.mailID;
        try{
       var response = await microsoft_service.getProfilePhoto(
         access_token,
         mailID
       );

       res.status(200).send({ data: response });

        }catch(error){
          res.status(500).send({"data":error.message});
        }
    }
    );

    app.get("/api/get_employeeId",  token_method.verifyToken,async(req,res)=>{

        var email = req.query.email
        var access_token = req.query.access_token

        try{
            var response = await microsoft_service.getEmployeeId(access_token,email);
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });


    app.get("/api/profile_photos",  token_method.verifyToken,async(req,res)=>{


      var email = req.query.email
      var access_token = req.query.access_token



      try{
          var response = await microsoft_service.getProfilePhotos(access_token,email);
          res.status(200).send(response);

      }
      catch(error){
          res.status(500).send({"data":error.message});
      }
  });


      }





