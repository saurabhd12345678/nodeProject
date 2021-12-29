var pipelines = require('../../models/pipeline');
var handlebars = require('handlebars');
var fs = require('fs');
var dotenv = require('dotenv');
var AdmZip = require('adm-zip');
var file_system = require('fs')
var genrate_sonar = require('../../service_helpers/common/generate_sonar_properties_file');

// var appRoot = process.cwd();
// var uploadDir = fs.readdirSync(${appRoot});

dotenv.config();
module.exports = {

    generate_jenkins: async (pipeline_key,application_key) => {
        var stageValues = {
            updateStageValue: "",
            buildStageValue: "",
            unitTestStageValue: "",
            codeAnalysisStageValue: "",
            systemTestingStageValue: "",
            artifactStageValue: "",
            deploymentStageValue: ""
        }
        try {
            var  pipelineName="";
            var scmType="";
            var scmURL="";
            var branchName="";

            var pipeline_data = await pipelines.findOne({ 'pipeline_key': pipeline_key }).lean();

           if (pipeline_data.scm.creation_status == "SUCCESS") {
                stageValues.updateStageValue = "updateStageValue";
                 branchName = pipeline_data.scm.branch_name;
                scmURL = pipeline_data.scm.repo_url;
                scmType = pipeline_data.scm.scm_type;
                pipelineName = pipeline_data.pipeline_name;

            }

            if (pipeline_data.code_quality.creation_status == "SUCCESS") {
                stageValues.codeAnalysisStageValue = "codeAnalysisStageValue";

            }
            // if(scm_obj.code_analysis_data!=false){
            //     stageValues.codeAnalysisStageValue = "codeAnalysisStageValue";
            // }
            var jenkinsTemplateInput = {

                "pipelineName": pipelineName.toLowerCase(),
                "projectKey": pipeline_key,
                "updateStage": stageValues.updateStageValue,
                "scmType": scmType,
                "branchName": branchName,
                "scmCredentialsID": "scm-creds",
                "scmURL": scmURL,
                "buildStage": stageValues.buildStageValue,
                "codeAnalysisStage": stageValues.codeAnalysisStageValue,
                "systemTestingStage": stageValues.systemTestingStageValue,
                "artifactStage": stageValues.artifactStageValue,
                "deploymentStage": stageValues.deploymentStageValue,
                "jenkinsPostURL":  process.env.SERVICE_URL
            };
            var appRoot = process.cwd();
            handlebars.registerHelper('if', function (conditional, options) {
                if (conditional) {
                    return options.fn(this);
                }
            });

            handlebars.registerHelper('escape', function (variable) {
                return variable.replace(/(['"])/g, '\\$1');
            });

            try {
                var jenkinsSourceTemplate =

                    fs.readFileSync(`${appRoot}/templates/jenkinsFileToSend_template`).toString();
            } catch (error) {

                throw new Error(error);
            }
            var jenkinsTemplate = handlebars.compile(jenkinsSourceTemplate);
            var generatedJenkinsCode = jenkinsTemplate(jenkinsTemplateInput);
            var generatedJenkinsfilePath = `${appRoot}/templates/generated/Jenkinsfile`;
            try {
                fs.writeFileSync(generatedJenkinsfilePath, generatedJenkinsCode);
            } catch (error) {

                throw new Error(error);
            }

            return "success";
        }
        catch (error) {
            throw new Error(error.message);
        }

    },

//     get_file_details : async (fileName) => {
//         var appRoot = process.cwd();

//          const file = `${appRoot}\\templates\\generated\\${fileName}` ;

//         return file



// },
generated_files : async (pipeline_key,application_key) => {

    let jenkins_generated = await module.exports.generate_jenkins(pipeline_key,application_key);
    let sonar_generated = await genrate_sonar.generate_sonar_properties_file(pipeline_key,application_key);


}
}