var http_request = require('../../service_helpers/HTTP-Request/http_request');
var dotenv = require('dotenv');
dotenv.config();

var HTTPRequestOptions = {
    requestMethod: "",
    basicAuthToken: "",
    proxyFlag: false,
    reqToken: false,
    urlSuffix: "",
};
module.exports = {
    create_sonarqube_project: async (code_quality_obj, sonarqube_url, sonarqube_auth_token) => {
        HTTPRequestOptions.basicAuthToken = sonarqube_auth_token;
        HTTPRequestOptions.requestMethod = "POST";

        var requestURL = `${sonarqube_url}/api/projects/create` +
       `?project=${code_quality_obj.pipeline_key}&name=${code_quality_obj.project_name}&visibility=private`;


        // var requestURL = `${sonarqube_url}/api/projects/create` +
        //  `?key=${code_quality_obj.pipeline_key}&name=${code_quality_obj.project_name}`;


        var project_req_body = {
            "key": code_quality_obj.pipeline_key,
            "name": code_quality_obj.project_name,
            "description": "Project created using DevOps Onboarding Wizard"
        };
        try {
          var result =  await http_request.make_request(
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
    create_sonarqube_project_webhook: async (code_quality_obj, sonarqube_url, sonarqube_auth_token) => {
        HTTPRequestOptions.basicAuthToken = sonarqube_auth_token;
        HTTPRequestOptions.requestMethod = "POST";

        var requestURL = `${sonarqube_url}/api/webhooks/create?name=CANVAS DevOps Key - ${code_quality_obj.pipeline_key}&project=${code_quality_obj.pipeline_key}&url=${process.env.SERVICE_URL}/api/pipeline/webhook/code_quality`;

        var project_req_body = {};
        try {
            await http_request.make_request(
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
    }
}