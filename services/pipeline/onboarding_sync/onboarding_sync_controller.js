var onboarding_sync_service = require("./onboarding_sync_service");
var get_all_projects = require("../../../service_helpers/common/get_project_names");
var genrate_sonar = require("../../../service_helpers/common/generate_sonar_properties_file");
var generate_jenkins = require("../../../service_helpers/common/generate_jenkins_file");
var token_method = require("../../../service_helpers/verify_token");
var fs = require('fs');
var file_system = require('fs')
var AdmZip = require('adm-zip');
var sonarqube_sync_projects = require('../../../connectors/sonarqube/sonarqube_sync_projects');

module.exports = (app) => {
  app.post(
    "/api/pipeline/onboarding/sync_scm",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_sync_service.sync_scm(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.post(
    "/api/pipeline/onboarding/sync_scm_new_project",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_sync_service.sync_create_new_project_scm(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  app.post(
    "/api/pipeline/onboarding/sync_scm_new_project",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_sync_service.sync_create_new_project_scm(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  app.post(
    "/api/pipeline/onboarding/sync_code_analysis",

    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_sync_service.sync_cq(
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

  app.get(
    "/api/onboarding/generate_sonar_file",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var generate_sonar_files = await genrate_sonar.generate_sonar_properties_file(
          req.query.pipeline_key,
          req.query.application_key
        );
        res.status(200).send({ data: generate_sonar_files });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  app.get(
    "/api/onboarding/generate_jenkins_file",
    // token_method.verifyToken,
    async (req, res) => {
      try {
        var generate_jenkins_files = await generate_jenkins.generate_jenkins(
          req.query.pipeline_key,
          req.query.application_key
        );
        res.status(200).send({ data: generate_jenkins_files });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );
  // app.get(
  //   "/api/onboarding/download_file",

  //   async (req, res) => {
  //     try {
  //       var path = await generate_jenkins.get_file_details(req.query.file_name);
  //       //res.status(200).send({ data: download_jenkins_files });
  //       res.download(path, req.query.file_name);
  //       //res.send();
  //     } catch (err) {
  //       res.status(500).send({ data: err.message });
  //     }
  //   }
  // );
  app.get(
    "/api/onboarding/download_fileszip",
    token_method.verifyToken,
    async (req, res) => {
      try {

        var path = await generate_jenkins.generated_files(req.query.pipeline_key,
          req.query.application_key,
        );
        var appRoot = process.cwd();
        var to_zip = file_system.readdirSync(`${appRoot}\\templates\\generated`)

        var zp = new AdmZip();
        for (var k = 0; k < to_zip.length; k++) {
          zp.addLocalFile(`${appRoot}\\templates\\generated` + '/' + to_zip[k])
        }
        const file_after_download = 'downloaded_file.zip';
        const data = zp.toBuffer();
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
        res.set('Content-Length', data.length);
        res.send(data);

      } catch (err) {

        res.status(500).send({ data: err.message });
      }
    }
  );

  app.post(
    "/api/pipeline/onboarding/sync_ci",
    token_method.verifyToken,
    async (req, res) => {
      try {
        var onboarding_sync_resp = await onboarding_sync_service.sync_ci(
          req.body
        );
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

  app.get(
    "/api/onboarding_code_analysis/get_all_projects",
    //token_method.verifyToken,
    async (req, res) => {
      try {
        var sonar = {
          application_key: req.query.application_key,
          tool_instance_name: req.query.tool_instance_name
        }
        var onboarding_sync_resp = await sonarqube_sync_projects.fetch_projects(sonar);
        res.status(200).send({ data: onboarding_sync_resp });
      } catch (err) {
        res.status(500).send({ data: err.message });
      }
    }
  );

};
