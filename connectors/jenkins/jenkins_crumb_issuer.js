var http_request = require('../../service_helpers/HTTP-Request/http_request');


module.exports = {


    issuerJenkinsCrumb: async (jenkins_url,jenkins_auth_token) => {

        var HTTPRequestOptions = {
            requestMethod: "GET",
            basicAuthToken: jenkins_auth_token,
            proxyFlag: false,
            reqToken: false,
            urlSuffix: "",
        };
        var request_url = `${jenkins_url}/crumbIssuer/api/json`;
    
         try {
           var crumb =await   http_request.make_request(
                encodeURI(request_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                { },
                )
                return crumb;

           } catch (error) {
            throw error;
        }

    }
}