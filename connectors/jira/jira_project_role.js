var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
module.exports = {
    assign_role : async(user_info)=>{
        try{
            let jira_auth_token
            if (user_info.instance_details.tool_auth.auth_type == 'password') {

                jira_auth_token = new Buffer.from(
                    user_info.instance_details.tool_auth.auth_username + ':' +
                    user_info.instance_details.tool_auth.auth_password
                ).toString('base64');

            } else {
                jira_auth_token = user_info.instance_details.tool_auth.auth_token;
            }
            var HTTPRequestOptions = {
                requestMethod: 'POST',
                basicAuthToken: jira_auth_token,
                proxyFlag: user_info.instance_details.proxy_required,
                reqToken: false,
                urlSuffix: ""
            };
            var jira_url = user_info.instance_details.tool_url + `/rest/api/2/project/${user_info.tool_project_key}/role/${user_info.project_role_id}`;
            var user = new Array(user_info.user_name);
            var request_body={
                "user":user
            }
            var fetched_results = await HTTPRequest.make_request(encodeURI(jira_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                request_body
            );
            return(fetched_results);
        }
        catch(error){

            throw new Error(error);
        }
    }
}