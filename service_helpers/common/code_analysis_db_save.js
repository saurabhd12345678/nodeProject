const logger = require("../../configurations/logging/logger");
var Pipeline = require("../../models/pipeline");

var Code_analysis = require("../../models/code_analysis");
var update_creation_status = require("../common/update_creation_status");
module.exports = {
  sonar_analysis: async (tool_details, ca_obj, result) => {
    try {
      let codeAnalysisResults = result.body.component;
      let measures = codeAnalysisResults.measures;
      for (let measure of measures) {
        codeAnalysisResults[measure.metric] = measure.value;
      }

      let newCodeAnalysis = {
        analysis_id: codeAnalysisResults.id,
        pipeline_key: ca_obj.pipeline_key,
        tool_project_key: ca_obj.project_key,
        nloc: codeAnalysisResults.ncloc,
        line_coverage: codeAnalysisResults.line_coverage,
        violations: codeAnalysisResults.violations,
        blocker_violations: codeAnalysisResults.blocker_violations,
        critical_violations: codeAnalysisResults.critical_violations,
        major_violations: codeAnalysisResults.major_violations,
        vulnerabilities: codeAnalysisResults.vulnerabilities,
        technical_debt: codeAnalysisResults.sqale_index,
        scale_rating: codeAnalysisResults.sqale_rating,
        reliability_rating: codeAnalysisResults.reliability_rating,
        security_rating: codeAnalysisResults.security_rating,
        bugs: codeAnalysisResults.bugs,
        code_smells: codeAnalysisResults.code_smells,
        duplication: codeAnalysisResults.duplicated_lines_density,
        test_error: codeAnalysisResults.test_error,
        test_failure: codeAnalysisResults.test_failure,
        skipped_tests: codeAnalysisResults.skipped_tests,
        analysis_date: codeAnalysisResults.date,

      };


      try {
      await Code_analysis.findOneAndUpdate(
          { analysis_id: codeAnalysisResults.id },
          newCodeAnalysis,
          { upsert: true }
        );

        let sonar_roles = ["admin", "codeviewer", "issueadmin", "scan", "user"];
        let temp = {
          onboarded: true,
          code_quality: {
            creation_status: "SUCCESS",
            tool_project_key: ca_obj.project_key,
            tool_project_name: ca_obj.project_name,
            is_sync: ca_obj.is_sync,
            project_url: `${tool_details.tool_url}/projects/${ca_obj.project_key}`,
            configured: true,
            create_webhook: ca_obj.create_webhook,
            instance_details: {
              tool_name: tool_details.tool_name,
              instance_name: tool_details.tool_instance_name,
              instance_id: tool_details._id,
              tool_roles: sonar_roles,
            },
          },
        };

        await Pipeline.findOneAndUpdate(
          {
            pipeline_key: ca_obj.pipeline_key,
          },
          temp,
          { 
            upsert: true,
          }
        );
        update_creation_status.set_creation_status(
          ca_obj.pipeline_key,
          "code_quality",
          "SUCCESS"
        );
      } catch (err) {
     update_creation_status.set_creation_status(
          ca_obj.pipeline_key,
          "code_quality",
          "FAILED"
        );
        logger.error(
          "sonaranalysis function inside code_analysis_db_save ",
          err.message
        );
      }
    } catch (err) {
     update_creation_status.set_creation_status(
        ca_obj.pipeline_key,
        "code_quality",
        "FAILED"
      );
      logger.error(
        "sonaranalysis function inside code_analysis_db_save ",
        err.message
      );
    }
    return "success";
  },
};
