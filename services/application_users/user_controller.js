const user_service = require("./user_service");
const comm = require("../../service_helpers/common/get_project_names");
var ServiceConstants = require("../../service_helpers/service_constants");
var token_method = require("../../service_helpers/verify_token");
const RoleManager = require("../../middlewares/role_manager");
module.exports = (app) => {
  app.get(
    "/api/users/get_tools",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var user_service_response = await user_service.get_tools(
          req.query.application_key
        );
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.post(
    "/api/users/get_tool_users",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var user_service_response = await user_service.get_tool_users(req.body);
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/users/get_user_detail",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var user_service_response = await user_service.get_user_detail(
          req.query.application_key,
          req.query.user_name,
          req.query.user_type,
          req.query.tool_name
        );
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/users/get_fields_info",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var user_service_response = await user_service.get_fields_info(
          req.query.application_key,
          req.query.tool_name,
          req.query.tool_instance_name,
          req.query.user_type
        );
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.get(
    "/api/users/get_tool_instances",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var user_service_response = await user_service.get_tool_instances(
          req.query.application_key,
          req.query.tool_name
        );
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
  app.post(
    "/api/users/assign_user",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var user_service_response = await user_service.assign_user(req.body);
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );

  app.get("/api/test", token_method.verifyToken,async (req, res) => {
    try {
      var user_service_response = await comm.get_projects(
        req.query.application_key,
        req.query.tool_name,
        req.query.tool_instance_name
      );
      res.status(200).send({ data: user_service_response });
    } catch (error) {
      res.status(500).send({ data: error.message });
    }
  });

  app.post(
    "/api/users/save_organisationUser",token_method.verifyToken,

    async (req, res) => {
      try {

        var user_service_response = await user_service.save_user_from_organisation(
          req.body
        );
        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );

  app.put(
    "/api/users/editUserInformation",token_method.verifyToken,

    async (req, res) => {
      try {


        var user_service_response = await user_service.edit_user_information(
          req.body
        );

        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );

  app.put(
    "/api/users/deleteUserInformation",token_method.verifyToken,

    async (req, res) => {
      try {
        var user_service_response = await user_service.delete_user_information(
          req.body
        );

        res.status(200).send({ data: user_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );
};
