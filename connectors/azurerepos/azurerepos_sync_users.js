var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require('unirest');
var authorization = require('../Authorization/authorization');
module.exports = {
    fetch_users: async (azurerepos_tool, azurerepos_project_name) => {
        try {
            var azurerepos_auth_token
            azurerepos_auth_token = await authorization.getAzureAuthToken(azurerepos_tool);
            let token = new Buffer.from(
                ':' +
                azurerepos_auth_token
            ).toString('base64');

            let str = azurerepos_tool.tool_url;
            const myArr = str.split("/");
            const url = myArr[2]
            //var scm_url = `https://vssps.${url}/${azurerepos_project_name}/_apis/graph/users?api-version=6.0-preview.1`;

            await unirest('GET', `https://vssps.${url}/${azurerepos_project_name}/_apis/graph/users?api-version=6.0-preview.1`)
                .headers({
                    'Authorization': 'Basic' + token,
                })
                .then((response) => {
                    resp = response.body.value;
                    
                });
            return resp;
        }
        catch (error) {
            return (error);
        }
    }


}