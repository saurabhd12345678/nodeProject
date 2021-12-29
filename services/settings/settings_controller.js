var settings_service = require('./settings_service');
var { checkPermissions } = require('../../middlewares/role_manager');
var ServiceConstants = require('../../service_helpers/service_constants')
var token_method = require("../../service_helpers/verify_token");
const RoleManager = require('../../middlewares/role_manager');
var hasicorp_vault_file = require("../../connectors/hashicorp-vault/read_secret");
var activity_logger = require('../../service_helpers/common/activity_logger');
var vault_helper = require('../../service_helpers/hashicorp_vault');
const existing_code_analysis_projects = require('../../models/existing_code_analysis_projects');
const onboarding_create_service = require('../pipeline/onboarding_create/onboarding_create_service');
const application_configuration_service = require('../application_configuration/application_configuration_service');

module.exports = (app) => {
  app.get(
    "/api/settings/get_tools_by_categories",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.get_tools_by_categories(
          req.query.application_key
        );
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );


  app.post(
    "/api/settings/create_tool",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.tool_create(
          req.body
        );
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );


  app.get(
    "/api/settings/get_tool_categories",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.get_tool_categories(
          req.query.application_key
        );
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );

  app.get(
    "/api/settings/get_tools",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.get_tools(
          req.query.application_key,
          req.query.tool_category
        );
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );


  app.get(
    "/api/settings/sync_jira_projects",
    token_method.verifyToken,
    async (req, res) => {

      try {

        var jira_tool = req.query;

        var settings_service_response = await settings_service.sync_jira_projects(jira_tool);

        if (settings_service_response == "Projects data fetched successfully") {
          await activity_logger.logActivity(req.query.application_key, "-", "Sync Project Completed", req.headers["authorization"]);

        }
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );




  app.get(
    "/api/settings/sync_tool_projects",
    // token_method.verifyToken,
    async (req, res) => {

      try {
        var settings_service_response = await settings_service.sync_tool_projects(
          req.query.application_key,
          req.query.tool_category,
          req.query.tool_instance_name
        );

        if (settings_service_response == "Projects data fetched successfully") {
          await activity_logger.logActivity(req.query.application_key, "-", "Sync Project Completed", req.headers["authorization"]);

        }
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        
        res.status(500).send({ data: error.message });
      }
    }

  );

  app.get(
    "/api/settings/getProjectData",
    // token_method.verifyToken,
    async (req, res) => {

      try {
        var settings_service_response = await settings_service.getAllProjects(
          req.query.application_key,
          // req.query.tool_category,
          req.query.tool_name,
          req.query.tool_instance_name
        );

        // if (settings_service_response == "Projects data fetched successfully") {
        //   await activity_logger.logActivity(req.query.application_key, "-", "Sync Project Completed", req.headers["authorization"]);

        // }
      
        res.status(200).send(settings_service_response );
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );
  app.get(
    "/api/settings/getRepoData",
    // token_method.verifyToken,
    async (req, res) => {

      try {
        var settings_service_response = await settings_service.getAllRepo(
          req.query.application_key,
          // req.query.tool_category,
          req.query.tool_name,
          req.query.tool_instance_name,
          req.query.project_key,
          req.query.project_name
        );

        // if (settings_service_response == "Projects data fetched successfully") {
        //   await activity_logger.logActivity(req.query.application_key, "-", "Sync Project Completed", req.headers["authorization"]);

        // }
     
        res.status(200).send(settings_service_response );
      } catch (error) {
     
        res.status(500).send({ data: error.message });
      }
    }

  );
  app.get(
    "/api/settings/getBranches",
    // token_method.verifyToken,
    async (req, res) => {

      try {
        var settings_service_response = await settings_service.getAllBranches(
          req.query.application_key,
          // req.query.tool_category,
          req.query.tool_name,
          req.query.tool_instance_name,
          req.query.project_key,
          req.query.repo_name,
          req.query.repo_id,
          req.query.project_name
        );

        // if (settings_service_response == "Projects data fetched successfully") {
        //   await activity_logger.logActivity(req.query.application_key, "-", "Sync Project Completed", req.headers["authorization"]);

        // }
      
        res.status(200).send(settings_service_response );
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );
  app.post(
    "/api/settings/validate_tool",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.validate_tool(
          req.body
        );
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }
  );

  app.get(
    "/api/settings/get_project_data",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.get_project_data(
          req.query.tool_url,
          req.query.tool_pass
        );
        //console.log("settings_service_response",settings_service_response);
        res.send({ data: settings_service_response });
      } catch (error) {
        //res.status(500).send({ data: error.message });
      }
    }

  );



  app.post(
    "/api/settings/save_tool",
    token_method.verifyToken,
    async (req, res) => {

      if (!(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.tool_version)) &&
        !(/[~`!#$%\^&*+=\[\]\\';,{}|\\"<>\?]/g.test(req.body.tool_url))
        && !(/[~`!#$%\^&*+=\-\[\]\\';,{}|\\"<>\?]/g.test(req.body.tool_instance_name))) {
        try {
          var permission_code

          let vault_tool_category = ""
          switch (req.body.tool_category) {
            case "Source Control":
              vault_tool_category = "Source_Control"
              permission_code = ServiceConstants.SAVE_SOURCE_CONTROL_TOOL
              break
            case "Planning":
              permission_code = ServiceConstants.SAVE_PLANNING_TOOL
              break
            case "Code Analysis":
              permission_code = ServiceConstants.SAVE_CODE_ANALYSIS_TOOL
              break
            case "Continuous Integration":
              permission_code = ServiceConstants.SAVE_CONTINUOUS_INTEGRATION_TOOL
              break
            case "Code Security":
              permission_code = ServiceConstants.SAVE_CODE_SECURITY_TOOL
              break
            case "Continuous Deployment":
              permission_code = ServiceConstants.SAVE_CONTINUOUS_DEPLOYMENT_TOOL
              break
            case "DAST":
              permission_code = ServiceConstants.SAVE_DAST_TOOL
              break
            case "ITSM":
              permission_code = ServiceConstants.SAVE_CODE_ANALYSIS_TOOL
              req.body.status_category = {
                "New": ["New"],
                "In_Progress": ["In Progress", "On Hold", "Resolved"],
                "Closed": ["Closed"]
              };
              break
            case "Artifactory Management":
              permission_code = ServiceConstants.SAVE_CONTINUOUS_DEPLOYMENT_TOOL
              break
            case "Security":

              permission_code = ServiceConstants.SAVE_CONTINUOUS_DEPLOYMENT_TOOL
              break




          }

          var permissionAccess = await RoleManager.getActionPermissionAccessOptimized(req.body.user_name, permission_code, req.body.application_key)
          console.log(permissionAccess);
          if (permissionAccess == ServiceConstants.GRANT) {

            var settings_service_response = await settings_service.save_tool(
              req.body
            );
            if (settings_service_response == "success") {
              await activity_logger.logActivity(req.body.application_key, "-", "New Tool Added", req.headers["authorization"]);
            }
            res.status(200).send({
              data: {
                "permissionAccess": ServiceConstants.GRANT
              }
            });
          } else {
            res.status(200).send({
              data: {
                "permissionAccess": ServiceConstants.DENIED
              }
            });
          }


        } catch (error) {
          res.status(500).send({ data: error.message });
        }
      }
      else {
        res.status(500).send({
          status: false,
          message: "Format not matched"
        });
      }
    }
  );

  app.get(
    "/api/settings/sync_tool_users",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await settings_service.sync_tool_users(
          req.query.application_key,
          req.query.tool_category,
          req.query.tool_instance_name
        );

        if (settings_service_response == "Users fetched successfully") {
          await activity_logger.logActivity(req.query.application_key, "-", "Sync Users Completed", req.headers["authorization"]);
        }
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );
  app.get(
    "/api/settings/test-vault", token_method.verifyToken,
    async (req, res) => {
      try {
        var settings_service_response = await hasicorp_vault_file.read_tool_secret("HELLOWvptf2s", "Source Control", "Bitbucket", "cd-new-vault-2");
        res.status(200).send({ data: settings_service_response });
      } catch (error) {
        res.status(500).send({ data: error.message });
      }
    }

  );



    
     
    
}