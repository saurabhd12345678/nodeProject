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
    urlSuffix: "",
}


module.exports = {

    getJenkinsXml: async (jenkins_url,job_name,jenkins_auth_token) => {

        var request_url = `${jenkins_url}/job/${job_name}/config.xml`;
        HTTPRequestOptions.requestMethod = "GET";
        HTTPRequestOptions.basicAuthToken = jenkins_auth_token;
        try {
            var xml = await http_request.make_request(
                encodeURI(request_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                {},
            )
            
            return xml;
        }
        catch (error) {

            throw new Error(error.message);
        }
    },


    setJenkinsXml: async (jenkins_url,job_name,jenkins_auth_token,new_xml,crumb) => {

    var request_url1 = `${jenkins_url}/job/${job_name}/config.xml`;
    HTTPRequestOptions.basicAuthToken = jenkins_auth_token;
    HTTPRequestOptions.requestMethod = "POST";

    var headers = {
        "Accept": "application/json",
        'Content-Type': 'application/xml',
        [crumb.body.crumbRequestField]: crumb.body.crumb,
        'Cookie': crumb.cookie,
        is_json :false
    }

    try {
        await http_request.make_request(
            encodeURI(request_url1),
            HTTPRequestOptions.requestMethod,
            HTTPRequestOptions.basicAuthToken,
            HTTPRequestOptions.proxyFlag,
            HTTPRequestOptions.reqToken,
            HTTPRequestOptions.urlSuffix,
            new_xml,
            {},
            headers
        )

        return true;

    } catch (error) {

     throw new Error(error.message);
    }

}





}