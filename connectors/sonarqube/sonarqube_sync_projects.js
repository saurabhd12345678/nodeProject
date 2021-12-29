var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
module.exports = {
    fetch_projects : async(sonarqube_tool)=>{
        try{
            let sonarqube_auth_token
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                sonarqube_tool.application_key
              );


            if(vault_config_status == true)
            {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                    sonarqube_tool.application_key,
                    sonarqube_tool.tool_category,
                    sonarqube_tool.tool_name,
                    sonarqube_tool.tool_instance_name
                  );
                  if (vault_configuration.auth_type == "password") {

                    sonarqube_auth_token = new Buffer.from(
                        vault_configuration.auth_username + ':' +
                        vault_configuration.auth_password
                    ).toString('base64');

                  } else {
                    sonarqube_auth_token = vault_configuration.auth_token;
                  }
            }
            else{
            if (sonarqube_tool.tool_auth.auth_type == 'password') {

                sonarqube_auth_token = new Buffer.from(
                    sonarqube_tool.tool_auth.auth_username + ':' +
                    sonarqube_tool.tool_auth.auth_password
                ).toString('base64');

            } else {
                sonarqube_auth_token = sonarqube_tool.tool_auth.auth_token;
            }
        }
            var HTTPRequestOptions = {
                requestMethod: 'GET',
                basicAuthToken: sonarqube_auth_token,
                proxyFlag: sonarqube_tool.proxy_required,
                reqToken: false,
                urlSuffix: ""
            };
            var sonar_url=sonarqube_tool.tool_url+"/api/components/search?qualifiers=TRK&ps=500";
            var fetched_results = await HTTPRequest.make_request(encodeURI(sonar_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            );
            return(fetched_results.body.components);
        }
        catch(error){
            return(error);
        }
    }
}