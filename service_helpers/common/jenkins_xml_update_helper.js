var http_request = require('../HTTP-Request/http_request');
var pipeline = require('../../models/pipeline');
var tool = require('../../models/tool');
var jenkins_crumb_issuer = require('../../connectors/jenkins/jenkins_crumb_issuer');
var jenkins_update_xml = require('../../connectors/jenkins/jenkins_update_xml')
const xml2js = require('xml2js');
var fs = require('fs');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
fs = require('fs');
var repo_url;
var branch_name;

module.exports = {


    updateJenkinsXml: async (pipeline_key) => {
        try {

            //var jenkins_auth_token;
            let continuous_integration_auth_token
            try {
                var cur_pipeline = await pipeline.findOne({ pipeline_key: pipeline_key })
            }
            catch (error) {


                throw new Error(error.message);
            }

            if (cur_pipeline.continuous_integration.creation_status == "SUCCESS"
                && cur_pipeline.scm.creation_status == "SUCCESS"
                && cur_pipeline.continuous_integration.is_sync == false) {


                try {
                    var tool_details = await tool.findOne({ tool_instance_name: cur_pipeline.continuous_integration.instance_details.instance_name })
                }
                catch (error) {


                    throw new Error(error.message);
                }

                var jenkins_url = tool_details.tool_url;
                var job_name = cur_pipeline.continuous_integration.job_name;
                if (cur_pipeline.scm.instance_details.tool_name == "GitLab") {
                    var srepo_url = cur_pipeline.scm.project_url;;
                    let group_names = srepo_url.split("/");
                    var group_name = group_names[4];
                    repo_url = "https://gitlab.com/" + group_name + "/" + cur_pipeline.scm.repo_name;
                    branch_name = cur_pipeline.scm.branch_name;
                }
                else if (cur_pipeline.scm.instance_details.tool_name == "Azure Repos") {
                    var srepo_url = cur_pipeline.scm.project_url;;
                    let project_names = srepo_url.split("/");
                    var project_name = project_names[3];
                    repo_url = "https://" + project_name + "@dev.azure.com/" + project_name + "/" + cur_pipeline.scm.repo_name + "/_git/" + cur_pipeline.scm.repo_name;
                    //https://democanvasdevops0020@dev.azure.com/democanvasdevops0020/saurabh_trial/_git/saurabh_trial


                    // repo_url = cur_pipeline.scm.repo_url;
                    //ref/heads/testbranch
                    let branches = cur_pipeline.scm.branch_name;
                    let branch = branches.split("/");
                    branch_name = branch[2];

                }
                else if(cur_pipeline.scm.instance_details.tool_name == "Bitbucket") {
                    let split=cur_pipeline.scm.repo_url.split("/");
                   
                    repo_url=split[0]+"//"+split[2]+"/scm/"+split[4]+"/"+cur_pipeline.scm.repo_name + ".git";
                    branch_name = cur_pipeline.scm.branch_name;
                }

                try {
                    let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                        tool_details.application_key
                    );


                    if (vault_config_status == true) {
                        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                            tool_details.application_key,
                            tool_details.tool_category,
                            tool_details.tool_name,
                            tool_details.tool_instance_name
                        );
                        if (vault_configuration.auth_type == "password") {

                            continuous_integration_auth_token = new Buffer.from(
                                vault_configuration.auth_username + ':' +
                                vault_configuration.auth_password
                            ).toString('base64');

                        } else {
                            continuous_integration_auth_token = vault_configuration.auth_token;
                        }
                    }
                    else {
                        if (tool_details.tool_auth.auth_type == 'password') {
                            continuous_integration_auth_token = new Buffer.from(
                                tool_details.tool_auth.auth_username + ':' +
                                tool_details.tool_auth.auth_password
                            ).toString('base64');
                        }
                        else {
                            continuous_integration_auth_token = tool_details.tool_auth.auth_token;
                        }
                    }

                    var xml = await jenkins_update_xml.getJenkinsXml(jenkins_url, job_name, continuous_integration_auth_token);


                } catch (error) {

                    throw new Error(error.message);
                }

                try {
                    xml2js.parseString(xml.body, async (error, result) => {
                        if (error) {

                            throw error.message;
                        }

                        if (branch_name != "master") {
                            result['flow-definition'].definition[0].scm[0].branches[0]['hudson.plugins.git.BranchSpec'][0].name[0] = "*/" + branch_name;
                        }

                        result['flow-definition'].definition[0].scm[0].userRemoteConfigs[0]['hudson.plugins.git.UserRemoteConfig'][0].url[0] = repo_url;
                        if (cur_pipeline.scm.instance_details.tool_name == "GitLab") {
                            result['flow-definition'].definition[0].scm[0].userRemoteConfigs[0]['hudson.plugins.git.UserRemoteConfig'][0].credentialsId = ['gLab_Creds'];
                        }

                        else if (cur_pipeline.scm.instance_details.tool_name == "Azure Repos") {
                            result['flow-definition'].definition[0].scm[0].userRemoteConfigs[0]['hudson.plugins.git.UserRemoteConfig'][0].credentialsId = ['azurePatTest'];
                        }
                        else {
                            result['flow-definition'].definition[0].scm[0].userRemoteConfigs[0]['hudson.plugins.git.UserRemoteConfig'][0].credentialsId = ['scm-creds'];

                        }

                     
                        var builder = new xml2js.Builder();
                        var new_xml = builder.buildObject(result);


                        var crumb = await jenkins_crumb_issuer.issuerJenkinsCrumb(jenkins_url, continuous_integration_auth_token);


                        try {
                            var status = await jenkins_update_xml.setJenkinsXml(jenkins_url, job_name, continuous_integration_auth_token, new_xml, crumb);

                            return status;

                        } catch (error) {

                            throw new Error(error.message);
                        }
                    });
                } catch (error) {


                    throw new Error(error.message);

                }
            }
        }
        catch (error) {

            throw new Error(error.message);
        }





    }
}