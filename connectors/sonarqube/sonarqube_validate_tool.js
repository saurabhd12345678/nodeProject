var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
module.exports = {
    validate: async(sonarqube_tool)=>{
        try{
            let sonarqube_auth_token
            if (sonarqube_tool.tool_auth.auth_type == 'password') {

                sonarqube_auth_token = new Buffer.from(
                    sonarqube_tool.tool_auth.auth_username + ':' +
                    sonarqube_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                sonarqube_auth_token = sonarqube_tool.tool_auth.auth_token;
            }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: sonarqube_auth_token,
                proxyFlag: sonarqube_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            };
            var sonar_url=sonarqube_tool.tool_url+"/api/components/search?qualifiers=TRK";
            var fetched_results = await HTTPRequest.make_request(encodeURI(sonar_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            return(fetched_results.status_code);
        }
        catch(error){
            return(error.status_code);
        }
    }
}