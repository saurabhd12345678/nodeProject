var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
module.exports = {
    validate : async(jenkins_tool)=>{
        try{
            let jenkins_auth_token
            if (jenkins_tool.tool_auth.auth_type == 'password') {

                jenkins_auth_token = new Buffer.from(
                    jenkins_tool.tool_auth.auth_username + ':' +
                    jenkins_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                jenkins_auth_token = jenkins_tool.tool_auth.auth_token;
            }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: jenkins_auth_token,
                proxyFlag: jenkins_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            var jenkins_url = jenkins_tool.tool_url + "/api/json?pretty=true";
            var fetched_results = await HTTPRequest.make_request(encodeURI(jenkins_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            return(fetched_results.status_code);
        }
        catch(error){
            return(error.status_code);
        }
    },

    validateAzure : async(azure_tool)=>{
        try{
            let azure_auth_token
            azure_tool.tool_auth.auth_username = "";
            //azure_tool.tool_auth.auth_password = azure_tool.tool_auth.auth_token;
            
            if (azure_tool.tool_auth.auth_type == 'password') {

                azure_auth_token = new Buffer.from(
                    azure_tool.tool_auth.auth_username + ':' +
                    azure_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                
                azure_auth_token = new Buffer.from(
                    azure_tool.tool_auth.auth_username + ':' +
                    azure_tool.tool_auth.auth_token
                ).toString('base64');
            }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: azure_auth_token,
                proxyFlag: azure_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            var azure_url = azure_tool.tool_url + "/_apis/projects";
            var fetched_results = await HTTPRequest.make_request(encodeURI(azure_url),
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