const logger = require("../../configurations/logging/logger");
var HTTPRequest = require("../../service_helpers/HTTP-Request/http_request");
var dotenv = require('dotenv');
dotenv.config();

var update_creation_status = require("../../service_helpers/common/update_creation_status");
var HTTPRequestOptions = {
  proxyFlag: "",
  urlSuffix: "",
  requestMethod: "",
  basicAuthToken: "",
  reqToken:false
};
var Code_analysis = require("../../models/code_analysis");
var code_analysis_db_save = require("../../service_helpers/common/code_analysis_db_save");
module.exports = {
  create_sonarqube_project_webhook: async (code_quality_obj, sonarqube_url, sonarqube_auth_token, code_quality_proxy_flag) => {
    HTTPRequestOptions.basicAuthToken = sonarqube_auth_token;
    HTTPRequestOptions.requestMethod = "POST";
    HTTPRequestOptions.proxyFlag = code_quality_proxy_flag;

    var requestURL = `${sonarqube_url}/api/webhooks/create?name=CANVAS DevOps Key - ${code_quality_obj.pipeline_key}&project=${code_quality_obj.project_key}&url=${process.env.SERVICE_URL}/api/pipeline/webhook/code_quality`;

    var project_req_body = {};
    try {
      await HTTPRequest.make_request(
        encodeURI(requestURL),
        HTTPRequestOptions.requestMethod,
        HTTPRequestOptions.basicAuthToken,
        HTTPRequestOptions.proxyFlag,
        HTTPRequestOptions.reqToken,
        HTTPRequestOptions.urlSuffix,
        project_req_body
      )
      return ("success");
    }
    catch (error) {
      throw error;
    }
  },
  sonarAggregation: async (
    tool_details,
    ca_obj,
    tool_url,
    code_quality_auth_token,
    code_quality_proxy_flag
  ) => {
    HTTPRequestOptions.basicAuthToken = code_quality_auth_token;
    HTTPRequestOptions.proxyFlag = code_quality_proxy_flag;
    HTTPRequestOptions.requestMethod = "GET";
    var projectKey = ca_obj.project_key;
    var result;



    //API for old version
    // var projectURL =
    //   `${tool_url}/api/measures/component?componentKey=${projectKey}` +
    //   `&format=json&additionalFields=periods,metrics&pretty=true&metricKeys=blocker_violations,major_violations,ncloc,` +
    //   `violations,test_errors,test_failures,critical_violations,line_coverage,` +
    //   `test_success_density,sqale_rating,sqale_index,reliability_rating,security_rating,` +
    //   `bugs,code_smells,vulnerabilities,skipped_tests,duplicated_lines_density`;



    var projectURL = `${tool_url}/api/measures/component?component=${projectKey}&format=json&additionalFields=periods,metrics&pretty=true&metricKeys=ncloc,complexity,violations,test_errors,test_failures,critical_violations,line_coverage,test_success_density,sqale_rating,sqale_index,reliability_rating,security_rating,bugs,code_smells,vulnerabilities,skipped_tests,duplicated_lines_density`

    try {
      result = await HTTPRequest.make_request(
        projectURL,
        HTTPRequestOptions.requestMethod,
        HTTPRequestOptions.basicAuthToken,
        HTTPRequestOptions.proxyFlag
      );
      //console.log("result------------>", result);
        return result;
    }
    catch (err) {
      //logger.error("HTTp make request error", err.message);
      return "failure";
      //throw new Error(err.message);
    }
  },
};
