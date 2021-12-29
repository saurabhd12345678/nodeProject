var onboarding_existing_service = require('./onboarding_existing_service');
var get_all_projects = require('../../../service_helpers/common/get_project_names');
var token_method = require("../../../service_helpers/verify_token");
//var express = require('express');
// var generate_file = require('../../../service_helpers/common/generate_jenkins_file');
module.exports = (app) => {

  app.post(
    "/api/pipeline/onboarding/existing_scm",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_existing_service.existing_scm(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.post(
    "/api/pipeline/onboarding/existing_code_analysis",


    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_existing_service.existing_code_analysis(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

 

  app.get(
    "/api/onboarding/get_all_projects",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await get_all_projects.get_projects(
          req.query.application_key,
          req.query.tool_name,
          req.query.tool_instance_name
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.get('/api/onboarding/get_all_gropus_having_appropriate_access_level',
  token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_existing_service.get_allGroups_having_access(
          req.query.application_key,
          req.query.tool_name,
          req.query.tool_instance_name
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );



  app.post(
    "/api/pipeline/onboarding/existing_ci",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_existing_service.existing_ci(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

}