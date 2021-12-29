var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require('../../service_helpers/hashicorp_vault');
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
module.exports={
    commit_data:async(bitbucket_tool,commit_id,repo_name,project_key)=>{
        try{
            var bitbucket_auth_token

            var vault_configuration
            var vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                bitbucket_tool.application_key
              );


            if(vault_config_status == true)
            {
                 vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    bitbucket_tool.application_key,
                    bitbucket_tool.tool_category,
                    bitbucket_tool.tool_name,
                    bitbucket_tool.tool_instance_name
                  );
                  if (vault_configuration.auth_type == "password") {

                    bitbucket_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                  } else {
                    bitbucket_auth_token = vault_configuration.auth_token;
                  }
            }
            else{
            if (bitbucket_tool.tool_auth.auth_type == 'password') {

                bitbucket_auth_token = new Buffer.from(
                    bitbucket_tool.tool_auth.auth_username + ':' +
                    bitbucket_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                bitbucket_auth_token = bitbucket_tool.tool_auth.auth_token;
            }
        }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: bitbucket_auth_token,
                proxyFlag: bitbucket_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            }
            var scm_url = `${bitbucket_tool.tool_url}/rest/api/1.0/projects/${project_key}/repos/${repo_name}/commits/${commit_id}`;

            var fetched_results = await HTTPRequest.make_request(encodeURI(scm_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );

          

            return(fetched_results.body);
        }
        catch(error){
            return(error);
        }
    }
}