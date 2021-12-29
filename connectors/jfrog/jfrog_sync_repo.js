var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var unirest = require("unirest");

module.exports = {
    getAllRepos: async(jfrog_tool)=>{
        try{
            var jfrog_auth_token='';
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
              jira_tool.application_key
            );
          
          
          if(vault_config_status == true)
          {
              let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                  jira_tool.application_key,
                  jira_tool.tool_category,
                  jira_tool.tool_name,
                  jira_tool.tool_instance_name
                );
                if (vault_configuration.auth_type == "password") {
                 
                  jfrog_auth_token = "Basic " + Buffer.from( vault_configuration.auth_username + ":" + vault_configuration.auth_password ).toString("base64");
                  
                } else {
                  jfrog_auth_token = vault_configuration.auth_token;
                }
          }
          else{
            if (jfrog_tool.tool_auth.auth_type == 'password') {
                jfrog_auth_token = "Basic " + Buffer.from( jfrog_tool.tool_auth.auth_username + ":" + jfrog_tool.tool_auth.auth_password ).toString("base64");
            } else {
                jfrog_auth_token = "Bearer " + Buffer.from( jfrog_tool.tool_auth.auth_username + ":" + jfrog_tool.tool_auth.auth_password ).toString("base64");
            }
          }
            var contentType = 'application/json';
            HTTPRequestOptions.requestMethod='GET'

            var fetched_results = await unirest(
                'GET',
                `${jfrog_tool.tool_url}/artifactory/api/repositories/`
              )
                .headers({
                  "Content-Type": contentType,
                  "Authorization": jfrog_auth_token,
        
                })
                .send(
                  JSON.stringify({
                    
                  
                  })
                )
 return(fetched_results.body);
        }
        catch(error){
            return(error.status_code);
        }
    }
}