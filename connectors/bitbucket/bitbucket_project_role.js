var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
module.exports = {
    assign_role: async(user_info)=>{
        try{
            let bitbucket_auth_token
            if (user_info.instance_details.tool_auth.auth_type == 'password') {

                bitbucket_auth_token = new Buffer.from(
                    user_info.instance_details.tool_auth.auth_username + ':' +
                    user_info.instance_details.tool_auth.auth_password
                ).toString('base64');

            } else {
                bitbucket_auth_token = user_info.instance_details.tool_auth.auth_token;
            }
            var HTTPRequestOptions = {
                requestMethod: 'PUT',
                basicAuthToken: bitbucket_auth_token,
                proxyFlag: user_info.instance_details.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            var scm_url = `${user_info.instance_details.tool_url}/rest/api/1.0/projects/${user_info.tool_project_key}/permissions/users?name=${user_info.user_name}&permission=${user_info.project_role_name}`;
            var fetched_results = await HTTPRequest.make_request(encodeURI(scm_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            return(fetched_results.status_code);
        }
        catch(error){
            return(error);
        }
    }
}