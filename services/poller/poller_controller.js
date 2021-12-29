var poll_data_service = require('../poller/poller_service');
var cron = require('node-cron');
var token_method = require("../../service_helpers/verify_token");

module.exports = (app) => {

  cron.schedule('*/1 * * * *', async () => {
    let poll_data = await poll_data_service.poll_data_application();
    res.status(200).send({ data: poll_data });
  });

  app.get(
    "/api/poller/poller_data",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var poll_data = await poll_data_service.poll_data_application();
        res.status(200).send({ data: poll_data });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );

  app.post(
    "/api/poller/save_poll_data",
    token_method.verifyToken,
    async (req, res) => {
      try {

        var poll_data = await poll_data_service.poll_data_save(
          req.body
        );
        res.status(200).send({ data: poll_data });


      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );

}