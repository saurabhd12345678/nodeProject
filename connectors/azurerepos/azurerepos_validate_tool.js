var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require('unirest');
module.exports = {
    validateAzure: async (azure_tool) => {
        try {
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
            await unirest('GET', 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0')
                .headers({
                    'Authorization': 'Basic' + azure_auth_token
                }).then((response) => {
                    resp = response.body.displayName;
                })
            var azure_url = `${azure_tool.tool_url}/${resp}/_apis/projects`;
            var fetched_results = await HTTPRequest.make_request(encodeURI(azure_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );

            return (fetched_results.status_code);
        }
        catch (error) {

            return (error.status_code);
        }
    }
}


