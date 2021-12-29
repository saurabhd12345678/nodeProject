var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
module.exports = {
    fetch_users : async(jenkins_tool)=>{
        try{
            let jenkins_auth_token
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                jenkins_tool.application_key
              );


            if(vault_config_status == true)
            {
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
            else{
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
            var jenkins_url = jenkins_tool.tool_url + "/asynchPeople/api/json?pretty=true";
            var fetched_results = await HTTPRequest.make_request(encodeURI(jenkins_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            return(fetched_results.body.users);
        }
        catch(error){
            return(error);
        }
    }
}