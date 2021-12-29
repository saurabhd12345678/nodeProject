var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
module.exports.getAuthToken = async (gitlab_tool) => {
    var gitlab_auth_token
    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
        gitlab_tool.application_key
    );


    if (vault_config_status == true) {
        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
            gitlab_tool.application_key,
            gitlab_tool.tool_category,
            gitlab_tool.tool_name,
            gitlab_tool.tool_instance_name
        );
        if (vault_configuration.auth_type == "password") {

            gitlab_auth_token = new Buffer.from(
                vault_configuration.auth_username + ':' +
                vault_configuration.auth_password
            ).toString('base64');

        } else {
            gitlab_auth_token = vault_configuration.auth_token;
        }
    }
    else {
        if (gitlab_tool.tool_auth.auth_type == 'password') {

            gitlab_auth_token = new Buffer.from(
                gitlab_tool.tool_auth.auth_username + ':' +
                gitlab_tool.tool_auth.auth_password
            ).toString('base64');

        } else {
            if (gitlab_tool.tool_name == "GitLab") {
                let token = gitlab_tool.tool_auth.auth_token;
                let pretoken = token.split(":");
                gitlab_auth_token = pretoken[1];
               

            }
            else {
                gitlab_auth_token = gitlab_tool.tool_auth.auth_token;
            }

        }
    }
    return gitlab_auth_token;
}

module.exports.getAzureAuthToken = async (azurerepos_tool) => {

    var azurerepos_auth_token
    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
        azurerepos_tool.application_key
    );

    if (vault_config_status == true) {
        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
            azurerepos_tool.application_key,
            azurerepos_tool.tool_category,
            azurerepos_tool.tool_name,
            azurerepos_tool.tool_instance_name
        );
        if (vault_configuration.auth_type == "password") {

            azurerepos_auth_token = new Buffer.from(
                vault_configuration.auth_username + ':' +
                vault_configuration.auth_password
            ).toString('base64');

        } else {
            azurerepos_auth_token = vault_configuration.auth_token;
        }
    }
    else {
        if (azurerepos_tool.tool_auth.auth_type == 'password') {

            azurerepos_auth_token = new Buffer.from(
                azurerepos_tool.tool_auth.auth_username + ':' +
                azurerepos_tool.tool_auth.auth_password
            ).toString('base64');

        } else {
            azurerepos_auth_token = azurerepos_tool.tool_auth.auth_token;
        }
    }

    return azurerepos_auth_token;
}