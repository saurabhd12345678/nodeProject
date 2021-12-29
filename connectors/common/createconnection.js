var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../hashicorp-vault/read_secret");
module.exports = {
    getToken: async(bitbucket_tool)=>{
        try{

            var bitbucket_auth_token
            let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                bitbucket_tool.application_key
              );


            if(vault_config_status == true)
            {
                let vault_configuration = await hashicorp_vault_config.read_tool_secret(
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
const obj=  { bitbucket_auth_token:bitbucket_auth_token,
proxyFlag : bitbucket_tool.proxy_required,
tool_url : bitbucket_tool.tool_url
}
        return obj;


    }
    catch(error){
        return(error);
    }
    }
}