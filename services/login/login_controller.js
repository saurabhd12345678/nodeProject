var logger = require("../..//configurations/logging/logger");
var login_service = require("./login_service");
var roleManager = require('../../middlewares/role_manager')
var token_method = require("../../service_helpers/verify_token");
var jwt = require("jsonwebtoken");

module.exports = (app) => {
  app.post("/login/register_user", async (req, res) => {
    let user = req.body;

    try {
      let status = await login_service.registerUser(user);
      if (status == "Success")
        res.status(200).send({
          status: "User registration successful",
        });
      else
        res.status(500).send({
          status: status,
        });
    } catch (error) {
      logger.error("Error with database : " + error);
      res.status(500).send({
        status: "Error while registering user",
      });
    }
  });

  app.post("/login/login_user", async (req, res) => {

    let user = req.body;


    try {
      let jwt_token;

      let user_info = await login_service.loginUser(user);

      var userdetails = user_info.user
      console.log(userdetails);
      if (user_info.status == "Success") {
        jwt.sign(
          { User: userdetails.user_mail,user_name: userdetails.user_name }
          , process.env.SECRET_KEY, { expiresIn: "987m" },
          (err, token) => {
            if (err) {
              res.status(500).send({
                status: "JWT issue"
              });
              return;
            }
            jwt_token = token;
            console.log(jwt_token);
            res.status(200).send({
              status: "User authentication successful",
              user: user_info.user,
              user_email: user_info.user_email,
              token: jwt_token,
            });
          }
        );

      } else {
        res.status(500).send({
          status: "Invalid Credentials",
        });
      }

    } catch (error) {
      logger.error("Error with database query:\n" + error);
      res.status(500).send({
        status: "User authentication failed",
      });
    }
  });


  app.post("/login/get_JWT_Token", async (req, res) => {

    let user = req.body;

    try {
      let jwt_token;

      let validate_user = await login_service.validateUser(user.access_token, user.user_mail)

      if (validate_user) {
        let user_info = await login_service.getJWTToken(user);
        if (user_info.status == "Success") {
          jwt.sign(
            { User: user.user_mail },
            process.env.SECRET_KEY,
            { expiresIn: "859m" },
            (err, token) => {
              jwt_token = token;

              res.status(200).send({
                status: user_info.status,
                user: user_info.user,
                token: jwt_token,
              });
            }
          );

        } else {

          res.status(200).send({
            status: user_info.status,
          });


        }

      } else {

        res.status(500).send({
          status: "User authentication failed",
        });
      }





    } catch (error) {
      logger.error("Error with database query:\n" + error);
      res.status(500).send({
        status: "User authentication failed",
      });
    }
  });


};

