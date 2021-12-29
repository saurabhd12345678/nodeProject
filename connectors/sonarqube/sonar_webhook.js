var HTTPRequestOptions = {
  proxyFlag: false,
  urlSuffix: "",
  requestMethod: "POST",
  basicAuthToken: "",
};
var sonarAuthToken;
var cqData;
var serverUrl;
var projectKey;
var buildNumber;
var pipelineKey;
var code_analysis_id;
var Pipeline = require('../../models/pipeline');
var Tools = require("../../models/tool");
var sonarData = require('../../models/code_analysis');
var ci_data = require('../../models/ci_data');
var job_name;
var ci_build = require('../../service_helpers/common/ci_sync_db_save');
var pipeline_workflow = require('../../models/pipeline_workflow');
var HTTPRequest = require("../../service_helpers/HTTP-Request/http_request");
module.exports = {
  processData: async (req) => {

    let project_key = req.project.key;

    let pipelineType;

    try {
      let resp = await Pipeline.findOne({
        "code_quality.tool_project_key": project_key,
      })
        .populate();
      pipelineKey = resp.pipeline_key;
      job_name = resp.pipeline_type == "PIPELINE_CUSTOM" ? "workflow-sonar" : resp.continuous_integration.job_name;
      pipelineType = resp.pipeline_type;
      cqData = resp.code_quality;


    }
    catch (error) {
      throw new Error(error);
    }

    let tool_data = await Tools.findOne({
      tool_instance_name: cqData.instance_details.instance_name,
    });

    if (tool_data.tool_auth.auth_type == "password") {
      sonarAuthToken = new Buffer.from(
        tool_data.tool_auth.auth_username +
        ":" +
        tool_data.tool_auth.auth_password
      ).toString("base64");
    } else {
      sonarAuthToken = tool_data.tool_auth.auth_token;
    }

    HTTPRequestOptions.basicAuthToken = sonarAuthToken;
    serverUrl = tool_data.tool_url;
    projectKey = req.project.key;
    buildNumber = req.properties["sonar.analysis.buildNumber"];
    await module.exports.SonarAnalysis(pipelineType, pipelineKey, job_name, buildNumber);


  },
  SonarAnalysis(pipelineType, pipelineKey, job_name, buildNumber) {
    let execution_number = -1;
    let projectURL =
      `${serverUrl}/api/measures/component?component=${projectKey}` +
      `&format=json&pretty=true&metricKeys=blocker_violations,major_violations,ncloc,` +
      `violations,test_errors,test_failures,critical_violations,line_coverage,` +
      `test_success_density,sqale_rating,sqale_index,reliability_rating,security_rating,` +
      `bugs,code_smells,vulnerabilities,skipped_tests,duplicated_lines_density`;
    HTTPRequest.make_request(
      projectURL,
      HTTPRequestOptions.requestMethod,
      HTTPRequestOptions.basicAuthToken,
      HTTPRequestOptions.proxyFlag
    )

      .then(async (result) => {

        let codeAnalysisResults = result.body.component;
        let measures = codeAnalysisResults.measures;

        for (let measure of measures) {
          codeAnalysisResults[measure.metric] = measure.value;
        }
        code_analysis_id = codeAnalysisResults.id;

        if (pipelineType == "PIPELINE_CUSTOM") {
          let pipeline_workflow_data = await pipeline_workflow.aggregate([
            {
              $match: { pipeline_key: pipelineKey }
            }, {
              $sort: { execution_number: -1 }
            }
          ])
          for (let i = 0; i < pipeline_workflow_data.length; i++) {
            let context = Object.keys(pipeline_workflow_data[i].pipeline_workflow_xstate_data.context);

            for (let j = 0; j < context.length; j++) {
              let task = pipeline_workflow_data[i].pipeline_workflow_xstate_data.context[context[j]];
              if (task == null) {

              }

              if (task.task_name == "sonarqube_code_analysis" && task.build_number == buildNumber) { //task_name != undefined &&
                execution_number = pipeline_workflow_data[i].execution_number;
                break;
              }

            }
            if (execution_number != -1) {
              break;
            }
          }
        }
        let newCodeAnalysis = new sonarData({
          analysis_id: codeAnalysisResults.id,
          tool_project_key: projectKey,
          build_number: buildNumber,
          workflow_execution_number: execution_number,
          analysis_date: codeAnalysisResults.date,
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
          pipeline_key: pipelineKey,
        });


        let ci_instance = await ci_data.findOne({
          "build_number": buildNumber,
          "job_name": job_name,
          "pipeline_key": pipelineKey,
        });
        if (ci_instance == null || ci_instance == undefined) {
           await ci_build.save_build_data(
            pipelineKey,
            buildNumber,
            job_name,
            code_analysis_id
          );

        } else {
          ci_data.findOneAndUpdate({ "job_name": job_name, "pipeline_key": pipelineKey, "build_number": buildNumber }, { "code_analysis_id": code_analysis_id });

        }

        try {
          await sonarData.findOneAndUpdate(
            { "analysis_id": codeAnalysisResults.id, "build_number": buildNumber },
            newCodeAnalysis,
            { upsert: true }
          );

        }
        catch (err) {
          throw new Error(err);
        }
      })


      .catch((err) => {
        throw new Error(err);
      });
    return "success";
  },
};