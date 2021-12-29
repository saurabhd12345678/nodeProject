var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');


module.exports = {
    assign_role: async (user_info) => {
        try {
            HTTPRequestOptions.basicAuthToken = sonarqube_auth_token;

            //var login = user_info.login //required
            /*
            Possible values for global permissions: admin, profileadmin, gateadmin, scan, provisioning
            Possible values for project permissions admin, codeviewer, issueadmin, scan, user
            */
           // var permission = user_info.permission //required
            //var projectId = user_info.projectId //optional
           // var projectKey = user_info.projectKey // optional
           let sonarqube_auth_token
            if (user_info.instance_details.tool_auth.auth_type == 'password') {

                sonarqube_auth_token = new Buffer.from(
                    user_info.instance_details.tool_auth.auth_username + ':' +
                    user_info.instance_details.tool_auth.auth_password
                ).toString('base64');

            } else {
                sonarqube_auth_token = user_info.instance_details.tool_auth.auth_token;
            }


            var adduser_req_body = {
                "login": user_info.login,
                "permission": user_info.permission,
                "projectId": user_info.projectId,
                "projectKey" : user_info.projectKey
            }

            var HTTPRequestOptions = {
                requestMethod: 'POST',
                basicAuthToken: sonarqube_auth_token,
                proxyFlag: false,
                reqToken: false,
                urlSuffix: ""
            }
            var sonarqube_url = `${user_info.tool_url}/api/permissions/add_user`;
            var fetched_results = await HTTPRequest.make_request(encodeURI(sonarqube_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                adduser_req_body
            );
            return (fetched_results.status_code);

        }
        catch (error) {
            return (error);
        }
    }
}