var jenkinsapi = require('jenkins-api');
const logger = require('../../configurations/logging/logger');
module.exports = {
    trigger_jenkins_job: async (pipeline_key, tool_url, continuous_integration_auth_token, job_name) => {

        var jenkinsIntermediateURL = tool_url.split("//");
        var jenkinsURL = jenkinsIntermediateURL[0] + '//' + continuous_integration_auth_token + '@' + jenkinsIntermediateURL[1];

        let jenkins = jenkinsapi.init(jenkinsURL);
        jenkins.build(job_name, function (err, data) {
            if (err) {
                logger.error('trigger_jenkins_job', err);
                return err;
            }
        });
        return "success";
    },

    trigger_jenkins_job_with_parameters: async (pipeline_key, tool_url, continuous_integration_auth_token, job_name, job_parameters) => {

        var jenkinsIntermediateURL = tool_url.split("//");
        var jenkinsURL = jenkinsIntermediateURL[0] + '//' + continuous_integration_auth_token + '@' + jenkinsIntermediateURL[1];

        let jenkins = jenkinsapi.init(jenkinsURL);
        jenkins.build_with_params(job_name, job_parameters, function (err, data) {
            if (err) {
                logger.error('trigger_jenkins_job_with_parameters', err);
                return err;
            }
        });
        return "success";
    }
}