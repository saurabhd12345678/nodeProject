var Application = require("../models/application");
module.exports = {
    async get_app_vault_config_status(application_key) {
        try {
            let app_configs = await Application.findOne({ "application_key": application_key }, { "application_configurations": 1 }).lean();
            if(app_configs.application_configurations.length==0){
                return false;
            }
            let app_vault_config = app_configs.application_configurations.find(app_config => app_config.configuration_name == "Vault").configuration_required;
            if(app_vault_config == undefined || app_vault_config == null)
            {
                return false;
            }
            else{
                return app_vault_config;
            }
            
        } catch (err) {
            // throw new Error(err.message);
            return false
        }
    },
    async get_app_vault_config(application_key) {
        try {
            let app_configs = await Application.findOne({ "application_key": application_key }, { "application_configurations": 1 }).lean();
            let app_vault_config = app_configs.application_configurations.find(app_config => app_config.configuration_name == "Vault");
            return app_vault_config;
        } catch (err) {
            throw new Error(err.message);
        }
    }
}