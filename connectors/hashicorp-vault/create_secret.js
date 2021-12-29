const axios = require("axios");
var hashicorp_vault_helper = require('../../service_helpers/hashicorp_vault');
var http_request = require('../../service_helpers/HTTP-Request/http_request');
http_request_options = {
  request_method: 'POST',
  basic_auth_token: "",
  proxy_flag: false,
  req_token: true,
  url_suffix: ""
}
module.exports = {
  create_tool_secret: async (application_key, tool_category, tool_secret_data) => {
    try {
      let vault_config = await hashicorp_vault_helper.get_app_vault_config(application_key);
      let options = {}
      if (vault_config.configuration_fields.vault_authentication_method == "Token") {
        options.apiVersion = "v1";
        options.endpoint = vault_config.configuration_fields.vault_url;
        options.token = vault_config.configuration_fields.vault_token;
      }
      else {
        //write for other authentication methods
      }
      var vault = require("node-vault")(options);
      var secretdata = await vault.write(`${application_key}_tools/${tool_category}/${tool_secret_data.tool_name}_${tool_secret_data.tool_instance_name}`, {
        "options": {
          "cas": 0
        },
        "data": tool_secret_data.tool_auth
      });
      return "created";
    } catch (err) {
      throw new Error(err.message);
    }
  },
  create_secret_engine:async(config_body)=>{
      let request_url=config_body.configuration_details.vault_url+"/v1/sys/mounts/"+config_body.application_key+"_tools";
      let request_header={};
      if(config_body.configuration_details.vault_authentication_method=="Token"){
        request_header={
          "X-Vault-Token":config_body.configuration_details.vault_token
        };
        http_request_options.basic_auth_token=config_body.configuration_details.vault_token;
        
      }
      else{
        //write for basic auth method
      }
      let request_body={
        "type": "kv",
        "version":"2"
      };
      try{
        let axios_response = await axios.post(request_url,request_body,{
          headers:request_header
        });
        return "done";
      }catch(error){
        throw new Error(error.message);
      }
  }
}