var activity_service =require("./activity_log_service");
var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {


  app.post("/get/activity",token_method.verifyToken, async (req, res) => {

    try {

      let status = await activity_service.getActivityLogs(req);
      res.status(200).send({
        data: status,
      });
    } catch (error) {

      res.status(500).send({
        status: "Error while featching logs data",
      });
    }
  });



  app.post("/get/activity1", token_method.verifyToken,async (req, res) => {

    try {
       await activity_service.getActivityLogs1(req.body);
    res.send("done")
    } catch (error) {

      res.status(500).send({
        status: "Error while registering user",
      });
    }
  });
};

