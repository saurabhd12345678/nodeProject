var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
module.exports = {
    fetch_projects: async (jira_tool) => {
        try {

        

            let jira_auth_token
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                jira_tool.application_key
            );


            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    jira_tool.application_key,
                    jira_tool.tool_category,
                    jira_tool.tool_name,
                    jira_tool.tool_instance_name
                );
                if (vault_configuration.auth_type == "password") {

                    
                    jira_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                } else {
                    jira_auth_token = vault_configuration.auth_token;
                }
            }
            else if (jira_tool.tool_auth_type == 'password') {
                    
    
                        jira_auth_token = new Buffer.from(
                            jira_tool.tool_auth_username + ':' +
                            jira_tool.tool_auth_password
                        ).toString('base64');
                    }
                    else if (jira_tool.tool_auth.auth_type == 'password') {
                        
    
                        jira_auth_token = new Buffer.from(
                                    jira_tool.tool_auth.auth_username + ':' +
                                    jira_tool.tool_auth.auth_password
                                ).toString('base64');
                             }
                             else {
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
           
            return (fetched_results.body);
        }
        catch (error) {
            return (error);
        }
    }
}