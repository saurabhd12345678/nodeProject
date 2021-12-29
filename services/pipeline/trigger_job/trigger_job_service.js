var tools = require('../../../models/tool');
var pipelines = require('../../../models/pipeline');
var jenkins_job_build = require('../../../connectors/jenkins/jenkins_build_trigger')
var ci_datas = require('../../../models/ci_data');
var hashicorp_vault_helper = require("../../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../../connectors/hashicorp-vault/read_secret");
var ci_sync_db_save = require("../../../service_helpers/common/ci_sync_db_save");
module.exports = {


    /**
        * function trigger jenkins job
        * @param {String} pipeline_key
        * @param {String} application_key
        * @param {String} user_name
        */
    trigger_job: async (pipeline_key, application_key, user_name) => {
        var ci_data;
        let continuous_integration_auth_token
        try {
            ci_data = await pipelines.findOne({ pipeline_key: pipeline_key },
                { _id: 0, continuous_integration: 1 }).lean();

        }
        catch (error) {
            throw new Error(`Pipeline Key ${pipeline_key} does not exist`);
        }
        if (ci_data != null) {
            if (ci_data.continuous_integration.configured == true) {
                let instance_name = ci_data.continuous_integration.instance_details.instance_name;
                var job_name = ci_data.continuous_integration.job_name;
                try {
                    var tool_details = await tools.findOne({ tool_instance_name: instance_name }).lean();
                }
                catch (error) {
                    throw new Error(error);
                }
                var tool_url = tool_details.tool_url;

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

                        continuous_integration_auth_token = Buffer.from(
                            vault_configuration.auth_username + ':' +
                            vault_configuration.auth_password
                        ).toString('base64');

                    } else {
                        continuous_integration_auth_token = vault_configuration.auth_token;
                    }
                }
                else {
                    if (tool_details.tool_auth.auth_type == 'password') {
                        continuous_integration_auth_token = Buffer.from(
                            tool_details.tool_auth.auth_username + ':' +
                            tool_details.tool_auth.auth_password
                        ).toString('base64');
                    }
                }
                try {
                    try {
                        // wrong_url = "http://54.225.135.212:8081"; - to test invalid scenario
                        var build_number = await jenkins_job_build.getLatestBuildNumber(tool_url, continuous_integration_auth_token, job_name);

                        await ci_datas.findOneAndUpdate(
                            {
                                pipeline_key: pipeline_key,
                                build_number: build_number
                            },
                            {
                                $set: {
                                    'build_number': build_number,
                                    'job_name': job_name,
                                    'build_result': "IN PROGRESS",
                                    'build_cause': user_name,
                                    'build_fullDisplayName': user_name,
                                    'build_url': "NA",
                                    'job_url': ci_data.continuous_integration.job_url,
                                    'build_timestamp': new Date(),
                                    'pipeline_key': pipeline_key,
                                    'build_duration': 0, //it should be duration
                                    'build_test': {
                                        'totalCount': 0,
                                        'failCount': 0,
                                        'skipCount': 0,
                                        'testsResult': 0,
                                    },
                                    'build_commit_set': ["NA"],

                                }
                            },
                            {
                                upsert: true,
                                new: true
                            }).lean();

                    }
                    catch (error) {

                        throw new Error(`Jenkins job could not be started`);
                    }
                    try {
                        // wrong_url = "http://54.225.135.212:8081";    to test invalid scenario
                        var bulid_status = await jenkins_job_build.buildJob(tool_url, continuous_integration_auth_token, job_name);
                        if (bulid_status == "SUCCESS") {
                            await ci_datas.findOneAndUpdate(
                                {
                                    pipeline_key: pipeline_key,
                                    build_number: build_number
                                },
                                {
                                    $set: {
                                        'build_result': "SUCCESS"
                                    }
                                },
                                {
                                    upsert: true,
                                    new: true
                                });

                            return ('Jenkins job has been started');
                        }
                        else if (bulid_status == "INVALID") {

                            await ci_datas.findOneAndUpdate(
                                {
                                    pipeline_key: pipeline_key,
                                    build_number: build_number
                                },
                                {
                                    $set: {
                                        'build_result': "INVALID"
                                    }
                                },
                                {
                                    upsert: true,
                                    new: true
                                }).lean();
                            return ('Jenkins job could not be started');
                        }
                    }
                    catch (error) {

                        await ci_datas.findOneAndUpdate(
                            {
                                pipeline_key: pipeline_key,
                                build_number: build_number
                            },
                            {
                                $set: {
                                    'build_result': "INVALID"
                                }
                            },
                            {
                                upsert: true,
                                new: true
                            }).lean();
                        throw new Error(`Jenkins job could not be started`);

                    }
                }

                catch (error) {
                    throw error;
                }

            }

            else {
                throw new Error("Please configure your Jenkins Job First");
            }
        }
        else {
            throw new Error(`Pipeline Key ${pipeline_key} does not exist`);
        }
    }
}