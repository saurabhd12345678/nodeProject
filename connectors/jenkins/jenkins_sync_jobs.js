var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
module.exports = {
    fetch_jobs: async (jenkins_tool) => {
        try {
            let jenkins_auth_token
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                jenkins_tool.application_key
            );


            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    jenkins_tool.application_key,
                    jenkins_tool.tool_category,
                    jenkins_tool.tool_name,
                    jenkins_tool.tool_instance_name
                );
                if (vault_configuration.auth_type == "password") {

                    jenkins_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                } else {
                    jenkins_auth_token = vault_configuration.auth_token;
                }
            }
            else {
                if (jenkins_tool.tool_auth.auth_type == 'password') {

                    jenkins_auth_token = new Buffer.from(
                        jenkins_tool.tool_auth.auth_username + ':' +
                        jenkins_tool.tool_auth.auth_password
                    ).toString('base64');

                } else {
                    jenkins_auth_token = jenkins_tool.tool_auth.auth_token;
                }
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
          
            return (fetched_results.body.jobs);
        }
        catch (error) {
            return (error);
        }
    },
    fetch_project_jira: async (tool_info) => {

        try {
            
            let azure_auth_token
            // let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
            //     tool_info.application_key
            // );


            // if (vault_config_status == true) {
            //     let vault_configuration = await hashicorp_vault_config.read_tool_secret(
            //         tool_info.application_key,
            //         tool_info.tool_category,
            //         tool_info.tool_name,
            //         tool_info.tool_instance_name
            //     );
            

            //     if (vault_configuration.auth_type == "password") {
            

            //         azure_auth_token = new Buffer.from(
            //             vault_configuration.auth_username + ':' +
            //             vault_configuration.auth_password
            //         ).toString('base64');

            //     } else {
                    

                    // azure_auth_token = vault_configuration.auth_token;
                // }
            // }
            // else {
                
                // let tool_info.auth_username="";
                let auth_username="";
                if (tool_info.tool_auth_type == 'password') {
                    
                    azure_auth_token = new Buffer.from(
                        auth_username + ':' +
                        tool_info.tool_auth_password
                    ).toString('base64');

                } 
                else {

                    azure_auth_token = tool_info.tool_auth_token;
                    
                }
        
                
            // }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: azure_auth_token,
                proxyFlag: tool_info.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }

            var azure_projects_url = tool_info.tool_url + '/rest/api/2/project';
           

            var fetched_projects = await HTTPRequest.make_request(encodeURI(azure_projects_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            
            return (fetched_projects.body.value);

        }

        catch (error) {
            return (error);
        }


    },

   
    fetch_jobs_azure: async (azure_tool) => {
      // console.log("azure tool: ",azure_tool);
        try {
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                azure_tool.application_key
            );


            if (vault_config_status == true) {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    azure_tool.application_key,
                    azure_tool.tool_category,
                    azure_tool.tool_name,
                    azure_tool.tool_instance_name
                );
                if (vault_configuration.auth_type == "password") {

                    azure_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                } else {
                    azure_auth_token = vault_configuration.auth_token;
                }
            }
            else {
                if (azure_tool.tool_auth.auth_type == 'password') {

                    azure_auth_token = new Buffer.from(
                        azure_tool.tool_auth.auth_username + ':' +
                        azure_tool.tool_auth.auth_password
                    ).toString('base64');

                } else {
                    azure_auth_token = azure_tool.tool_auth.auth_token;
                }
            }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: azure_auth_token,
                proxyFlag: azure_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            var azure_url = azure_tool.tool_url + `/${azure_tool.repository_data}/_apis/pipelines?api-version=6.0-preview.1`;

            var fetched_results = await HTTPRequest.make_request(encodeURI(azure_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );

            return (fetched_results.body.value);
        }
        catch (error) {
           // console.log(error);
            return (error);
        }
    }
}