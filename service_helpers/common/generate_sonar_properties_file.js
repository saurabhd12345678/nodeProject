var handlebars = require('handlebars');
var pipeline = require('../../models/pipeline');
var tool_data = require('../../models/tool');
var fs = require('fs');
const tool = require('../../models/tool');
module.exports = {

    generate_sonar_properties_file: async (pipeline_key,application_key) => {
    //async (project_key, project_name, sonar_url, sonar_auth_token) => {
       // var pipeline_data = await pipelines.findOne({ 'pipeline_key': pipeline_key }).lean();



        var pipeline_data = await pipeline.findOne({"pipeline_key": pipeline_key});

        if (pipeline_data.code_quality.creation_status == "SUCCESS") {



        var tool_data = await tool.findOne({"tool_instance_name" : pipeline_data.code_quality.instance_details.instance_name});

        if (tool_data.tool_auth.auth_type == 'password') {
            sonar_auth_token = new Buffer.from(
                tool_data.tool_auth.auth_username + ':' +
                tool_data.tool_auth.auth_password
            ).toString('base64');
        }
        else {
            sonar_auth_token = tool_data.tool_auth.auth_token;
        }
          //will need pipeline_key and application_key as input
          var sonar_template_var = {
            "projectKey": pipeline_data.code_quality.tool_project_key, //pipeline.code_quality.tool_project_key
            "projectName": pipeline_data.code_quality.tool_project_name, //pipeline.code_quality.tool_project_name
            "sonarURL": tool_data.tool_url, //pipeline.code_quality.instance_details.instance_name  => find(tool.tool_instance_name) => tool.tool_url
            "sonarToken": sonar_auth_token //pipeline.code_quality.instance_details.instance_name  => find(tool.tool_instance_name) => tool.tool_auth(generate token from id/pwd)
        }


        handlebars.registerHelper('if', (conditional, options) => {
            if (conditional) {
                return options.fn(this);
            }
        });

        handlebars.registerHelper('escape', (variable) => {
            return variable.replace(/(['"])/g, '\\$1');
        });

        var app_root = process.cwd();
        try {
            var new_url = "/templates/sonar_java_jacoco_template";
            var sonar_source_template = fs.readFileSync(`${app_root}`+`${new_url}`).toString();

        } catch (error) {

            throw new Error(error.message);

        }
        var temp_url = "/templates/generated/sonar-project.properties";

        var sonar_template = handlebars.compile(sonar_source_template);
        var generated_sonar = sonar_template(sonar_template_var);
        var generated_sonar_path = (`${app_root}`+`${temp_url}`);


        try {
            fs.writeFileSync(generated_sonar_path, generated_sonar);
        } catch (error) {

            throw new Error(error.message);
        }

        return ("success");
    }

    }
}
