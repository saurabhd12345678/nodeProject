var hashicorp_vault_helper = require('../../service_helpers/hashicorp_vault');
module.exports = {
  read_tool_secret: async (application_key, tool_category, tool_name, tool_instance_name) => {
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
      let vault_tool_category = "";
      
      switch (tool_category) {
        case "Source Control":
          vault_tool_category = "Source_Control"
          break;
        case "Planning":
          vault_tool_category = "Planning"
          break;
        case "Code Analysis":
          vault_tool_category = "Code_Analysis"
          break
        case "Continuous Integration":
          vault_tool_category = "Continuous_Integration"
          break
        case "Code Security":
          vault_tool_category = "Code_Security"
          break
        case "Continuous Deployment":
          vault_tool_category = "Continuous_Deployment"
          break
        case "ITSM":
          vault_tool_category = "ITSM"
          break
        case "Artifactory Management":
          vault_tool_category = "Artifactory_Management"
          break
      }
      var secretdata = await vault.read(`${application_key}_tools/${vault_tool_category}/${tool_name}_${tool_instance_name}`);
      
      return secretdata.data.data;
      
    } catch (err) {
      
      throw new Error(err.message);
    }
  }
}