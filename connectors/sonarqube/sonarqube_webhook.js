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

var HTTPRequest = require("../../service_helpers/HTTP-Request/http_request");
module.exports = {
  
   SonarAnalysis : async(serverUrl,projectKey,sonarAuthToken) => {
    HTTPRequestOptions.basicAuthToken = sonarAuthToken;
    HTTPRequestOptions.requestMethod = 'GET';
     //componentKey
    var projectURL =
      `${serverUrl}/api/measures/component?component=${projectKey}` +
      `&format=json&pretty=true&metricKeys=blocker_violations,major_violations,ncloc,` +
      `violations,test_errors,test_failures,critical_violations,line_coverage,` +
      `test_success_density,sqale_rating,sqale_index,reliability_rating,security_rating,` +
      `bugs,code_smells,vulnerabilities,skipped_tests,duplicated_lines_density`;

    var result = await HTTPRequest.make_request (
      projectURL,
      HTTPRequestOptions.requestMethod,
      HTTPRequestOptions.basicAuthToken,
      HTTPRequestOptions.proxyFlag
    )
      return result;
       
  },
};