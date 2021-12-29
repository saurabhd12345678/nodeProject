var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var unirest = require('unirest');
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
            else {
                if (jira_tool.tool_auth_type == 'password') {

                    jira_auth_token = new Buffer.from(
                        jira_tool.tool_auth_username + ':' +
                        jira_tool.tool_auth_password
                    ).toString('base64');

                } else {
                    jira_auth_token = jira_tool.tool_auth.auth_token;
                }
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
    },
    fetch_project_azureboards: async (tool_info) => {

        try {

            let azure_auth_token;
            var fetched_projects

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
            //         ("2 if");

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
            let auth_username = "";
            if (tool_info.tool_auth_type == 'password') {
                azure_auth_token = new Buffer.from(
                    ':' +
                    tool_info.tool_auth_password
                ).toString('base64');

            }
            else {


                azure_auth_token = new Buffer.from(
                    ':' +
                    tool_info.tool_auth_token
                ).toString('base64');

            }

            

            var azure_projects_url = tool_info.tool_url + "/_apis/projects?api-version=6.0";


            await unirest('GET', azure_projects_url)
                .headers({
                    'Authorization': 'Basic' + "" + azure_auth_token,

                })
                .then((res) => {
                    fetched_projects = res
                });

           
            return (fetched_projects.body.value);
        }
        catch (error) {
          
            return (error);
        }


    },
    fetch_azureboards_project: async (tool_info) => {

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
            //         ("2 if");

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
            let auth_username = "";
            if (tool_info.tool_auth.auth_type == 'password') {
                azure_auth_token = new Buffer.from(
                    auth_username + ':' +
                    tool_info.tool_auth.auth_password
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

            var azure_projects_url = tool_info.tool_url + "/_apis/projects?api-version=6.0";


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


    }
}