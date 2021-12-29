var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
module.exports = {
    fetch_users: async (bitbucket_tool) => {
        try {
            let bitbucket_auth_token
            if (bitbucket_tool.tool_auth.auth_type == 'password') {
                bitbucket_auth_token = new Buffer.from(
                    bitbucket_tool.tool_auth.auth_username + ':' +
                    bitbucket_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                bitbucket_auth_token = bitbucket_tool.tool_auth.auth_token;
            }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: bitbucket_auth_token,
                proxyFlag: bitbucket_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            var scm_url = `${bitbucket_tool.tool_url}/rest/api/1.0/users`;
            var fetched_results = await HTTPRequest.make_request(encodeURI(scm_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            return (fetched_results.body.values);
        }
        catch (error) {
            return (error);
        }
    }

   
}