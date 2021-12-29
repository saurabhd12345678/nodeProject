
const { exception } = require('console');
var logger = require('../../../configurations/logging/logger');
var template = require('../../../models/template');

module.exports = {


    /**
        *function returns list of available template for given application key
        * @param {string} application_key
        */
    get_all_templates : async (application_key) => {
        try{

            var template_data = await template.find({
                application_key : application_key,
            })


                logger.info(`Successfully loaded ${template_data.length} templates for ${application_key}`);
                return (template_data);

        }
        catch (error) {
            throw error
        }
    },

    
    /**
        *function save new template 
        * @param {object} template_data
        */
    save_custom_template: async (template_data) => {

        if (template_data.is_custom == true) {

            var application_key = template_data.application_key;
            if ( application_key != null  && application_key != undefined && application_key != '') {
                var template_entry = new template(template_data);

                try {
                    await template.create(template_entry);
                    return ("Template saved successfully");
                }
                catch (error) {
                    logger.error(error);

                    let err = new Error('Failed:Could not save Template');
                    throw err;
                }
            }
            else {
                err = new Error('Need to enter Application Details first');
                throw err;
            }
        }
        else {
            err = new Error('Not custom template');
            throw err;
        }

    }
}