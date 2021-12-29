var http_request = require('../../service_helpers/HTTP-Request/http_request');
var pipeline = require('../../models/pipeline');
var tool = require('../../models/tool');
var jenkins_crumb_issuer = require('./jenkins_crumb_issuer')
const xml2js = require('xml2js');
var fs = require('fs');


var HTTPRequestOptions = {
    requestMethod: "",
    basicAuthToken: "",
    proxyFlag: false,
    reqToken: false,
    urlSuffix: ""
};


module.exports = {
    createJenkinsProject: async (continuous_integration_obj, jenkins_url, jenkins_auth_token) => {
        HTTPRequestOptions.requestMethod = "GET";
        HTTPRequestOptions.basicAuthToken = jenkins_auth_token;
        
        var crumb = await jenkins_crumb_issuer.issuerJenkinsCrumb(jenkins_url, jenkins_auth_token);
        
        var request_url = `${jenkins_url}/job/Generation/job/DSL_JOB_CREATOR/buildWithParameters?token=test&${crumb.body.crumbRequestField}=${crumb.body.crumb}&project_name=${continuous_integration_obj.project_name}`;

        try {

            await http_request.make_request(
                encodeURI(request_url),
                HTTPRequestOptions.requestMethod,
                jenkins_auth_token,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix
            )
            return "success";

        }
        catch (error) {
            throw new Error(error.message);
        }
    },
}