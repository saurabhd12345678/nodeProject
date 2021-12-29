var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
module.exports = {
    validate : async(jira_tool)=>{

        try{
            let jira_auth_token
            if (jira_tool.tool_auth.auth_type == 'password') {
                jira_auth_token = new Buffer.from(
                    jira_tool.tool_auth.auth_username + ':' +
                    jira_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                jira_auth_token = jira_tool.tool_auth.auth_token;
            }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: jira_auth_token,
                proxyFlag: jira_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            };
            var jira_url = jira_tool.tool_url + '/rest/api/2/project';

            var fetched_results = await HTTPRequest.make_request(encodeURI(jira_url),
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