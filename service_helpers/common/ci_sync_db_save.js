var ci_datas = require("../../models/ci_data");
var tool = require("../../models/tool");
const pipeline = require("../../models/pipeline");
var get_build_details = require("../../connectors/jenkins/jenkins_webhook");
var ci_build_data = require('../../models/ci_data');
module.exports = {
    saveCiData: async (builds, continuous_integration_obj) => {
        let build_result

        if (builds.length != 0) {
            for await (let build of builds) {
                let buildActions = build.actions;

                let buildCause, totalCount, failCount, skipCount, testsResult;
                for await (let buildAction of buildActions) {
                    switch (buildAction._class) {
                        case 'hudson.model.CauseAction':
                            let causes = buildAction.causes;

                            for await (let cause of causes) {
                                if (cause._class === 'hudson.model.Cause$UserIdCause') {
                                    buildCause = cause.shortDescription;
                                }
                            }
                            break;

                        case 'hudson.tasks.junit.TestResultAction':
                            totalCount = Number(buildAction.totalCount);
                            failCount = Number(buildAction.failCount);
                            skipCount = Number(buildAction.skipCount);

                            if (failCount === 0) {
                                testsResult = 'PASS';
                            } else {
                                testsResult = 'FAIL';
                            }

                            break;

                        default:
                            break;
                    }

                }
                if (build.changeSet) {
                    let changeSets = build.changeSet;
                    var commitIDs = [];

                    if (changeSets.items) {
                        let commitItems = changeSets.items;
                        if (commitItems.length != 0) {
                            for await (let commitItem of commitItems) {

                                commitIDs.push(commitItem.commitId);
                            }
                        }
                    }
                } else {
                    let changeSets = build.changeSets;
                     var commitIDs = [];
                    if (changeSets.length != 0) {

                        for await (let changeSet of changeSets) {
                            if (changeSet.items) {
                                let commitItems = changeSet.items;
                                if (commitItems.length != 0) {
                                    for await (let commitItem of commitItems) {
                                        commitIDs.push(commitItem.commitId);
                                    }
                                }
                            }

                        }
                    }
                }
                let build_test = {

                    "totalCount": totalCount,
                    "failCount": failCount,
                    "skipCount": skipCount,
                    "testsResult": testsResult
                }


                if (build.result == null) {
                    build_result = 'ABORTED';

                }
                else {
                    build_result = build.result;
                }
                try {
                    await ci_datas.findOneAndUpdate({ 'pipeline_key': continuous_integration_obj.pipeline_key, 'build_number': build.number },
                        {
                            $set: {
                                'pipeline_key': continuous_integration_obj.pipeline_key,
                                'job_name': continuous_integration_obj.project_name,
                                'build_number': build.number,
                                'build_fullDisplayName': build.fullDisplayName,
                                'build_cause': buildCause,
                                'build_result': build_result,
                                'build_url': build.url,
                                'build_timestamp': build.timestamp,
                                'build_duration': build.duration,
                                'build_test': build_test,
                                'build_commit_set': commitIDs,
                                'job_url': continuous_integration_obj.project_url
                            }

                        }
                        , { upsert: true, new: true }).lean();

                }
                catch (error) {
                  
                    throw error;
                }

            }

            return "success";
        }
        else {
            return "success";
        }

    },
    saveCiAzureData: async (builds, continuous_integration_obj) => {
        let build_result
        if (builds.length != 0) {
            for await (let build of builds) {

                try {
                    await ci_datas.findOneAndUpdate({ 'pipeline_key': continuous_integration_obj.pipeline_key, 'build_number': build.number },
                        {
                            $set: {
                                'pipeline_key': continuous_integration_obj.pipeline_key,
                                'job_name': continuous_integration_obj.project_name,
                                'build_number': build.build_number,
                                'build_fullDisplayName': build.build_fullDisplayName,
                                'build_cause': build.build_cause,
                                'build_result': build.build_result,
                                'build_url': build.build_url,
                                'build_timestamp': build.build_timestamp,
                                'build_duration': build.build_duration,
                                'build_test': build.build_test,
                                'build_commit_set': build.build_commit_set,
                                'job_url': continuous_integration_obj.project_url
                            }

                        }
                        , { upsert: true, new: true }).lean();

                }
                catch (error) {
                    throw error;
                }

            }

            return "success";
        }
        else {
            return "success";
        }

    },
    save_build_data: async (
        pipeline_key,
        build_number,
        job_name,
        code_analysis_id
    ) => {
        try {

            let fetched_pipeline = await pipeline.findOne({
                pipeline_key: pipeline_key,
            });
            let fetched_tool = await tool
                .findOne({
                    tool_name:
                        fetched_pipeline.continuous_integration.instance_details.tool_name,
                    tool_instance_name:
                        fetched_pipeline.continuous_integration.instance_details
                            .instance_name,
                })
                .lean();
            let build_details = await get_build_details.get_build_details(
                build_number,
                job_name,
                fetched_tool
            );
            let buildCause, totalCount, failCount, skipCount, testsResult;
            let buildActions = build_details.actions;
            for await (let buildAction of buildActions) {
                switch (buildAction._class) {
                    case "hudson.model.CauseAction":
                        let causes = buildAction.causes;

                        for await (let cause of causes) {
                            if (cause._class === "hudson.model.Cause$UserIdCause") {
                                buildCause = cause.shortDescription;
                            }
                        }
                        break;

                    case "hudson.tasks.junit.TestResultAction":
                        totalCount = Number(buildAction.totalCount);
                        failCount = Number(buildAction.failCount);
                        skipCount = Number(buildAction.skipCount);

                        if (failCount === 0) {
                            testsResult = "PASS";
                        } else {
                            testsResult = "FAIL";
                        }

                        break;

                    default:
                        break;
                }
            }
            let commitIDs = [];
            if (build_details.changeSet) {
                let changeSets = build.changeSet;

                if (changeSets.items) {
                    let commitItems = changeSets.items;
                    if (commitItems.length != 0) {
                        for (let commitItem of commitItems) {
                            commitIDs.push(commitItem.commitId);
                        }
                    }
                }
            } else {
                let changeSets = build_details.changeSets;

                if (changeSets.length != 0) {
                    for await (let changeSet of changeSets) {
                        if (changeSet.items) {
                            let commitItems = changeSet.items;
                            if (commitItems.length != 0) {
                                for await (let commitItem of commitItems) {
                                    commitIDs.push(commitItem.commitId);
                                }
                            }
                        }
                    }
                }
            }
            let build_status = "UNSTABLE";
            if (build_details.result == null) {
                build_status = "UNSTABLE";
            } else {
                build_status = build_details.result;
            }

            await ci_build_data.findOneAndUpdate(
                {
                    build_number: build_number,
                    job_name: job_name,
                    pipeline_key: pipeline_key,
                },
                {
                    build_number: build_number,
                    build_cause: buildCause,
                    build_result: build_status,
                    build_fullDisplayName: build_details.fullDisplayName,
                    build_url: build_details.url,
                    job_name: job_name,
                    job_url: fetched_pipeline.continuous_integration.job_url,
                    build_timestamp: build_details.timestamp,
                    pipeline_key: pipeline_key,
                    build_duration: build_details.estimatedDuration, //it should be duration
                    build_test: {
                        totalCount: totalCount,
                        failCount: failCount,
                        skipCount: skipCount,
                        testsResult: testsResult,
                    },
                    build_commit_set: commitIDs,
                    code_analysis_id: code_analysis_id
                },
                { upsert: true }
            );
            return "done";
        } catch (error) {
            throw error;
        }
    },
    jenkins_save_build_data: async (
        pipeline_key,
        build_number,
        job_name
    ) => {
        try {

            let fetched_pipeline = await pipeline.findOne({
                pipeline_key: pipeline_key,
            });
            let fetched_tool = await tool
                .findOne({
                    tool_name:
                        fetched_pipeline.continuous_integration.instance_details.tool_name,
                    tool_instance_name:
                        fetched_pipeline.continuous_integration.instance_details
                            .instance_name,
                })
                .lean();
           
            let build_details = await get_build_details.get_build_details(
                build_number,
                job_name,
                fetched_tool
            );
            let buildCause, totalCount = 0, failCount = 0, skipCount = 0, testsResult;
            let totalCountft = 0, failCountft = 0, skipCountft = 0, testsResultft;
            let buildActions = build_details.actions;
            for await (let buildAction of buildActions) {
                switch (buildAction._class) {
                    case "hudson.model.CauseAction":
                        let causes = buildAction.causes;

                        for await (let cause of causes) {
                            if (cause._class === "hudson.model.Cause$UserIdCause") {
                                buildCause = cause.shortDescription;
                            }
                        }
                        break;

                    case "hudson.tasks.junit.TestResultAction":
                        totalCount = Number(buildAction.totalCount);
                        failCount = Number(buildAction.failCount);
                        skipCount = Number(buildAction.skipCount);

                        if (failCount === 0) {
                            testsResult = "PASS";
                        } else {
                            testsResult = "FAIL";
                        }

                        break;
                    case "hudson.plugins.testng.TestNGTestResultBuildAction":
                       
                        totalCountft = Number(buildAction.totalCount);
                        failCountft = Number(buildAction.failCount);
                        skipCountft = Number(buildAction.skipCount);
                       

                        if (failCount === 0) {
                            testsResultft = "PASS";
                        } else {
                            testsResultft = "FAIL";
                        }

                        break;

                    default:
                        break;
                }
            }
            let commitIDs = [];
            if (build_details.changeSet) {
                let changeSets = build.changeSet;

                if (changeSets.items) {
                    let commitItems = changeSets.items;
                    if (commitItems.length != 0) {
                        for (let commitItem of commitItems) {
                            commitIDs.push(commitItem.commitId);
                        }
                    }
                }
            } else {
                let changeSets = build_details.changeSets;

                if (changeSets.length != 0) {
                    for await (let changeSet of changeSets) {
                        if (changeSet.items) {
                            let commitItems = changeSet.items;
                            if (commitItems.length != 0) {
                                for await (let commitItem of commitItems) {
                                    commitIDs.push(commitItem.commitId);
                                }
                            }
                        }
                    }
                }
            }
            let build_status = "UNSTABLE";
            if (build_details.result == null) {
                build_status = "UNSTABLE";
            } else {
                build_status = build_details.result;
            }

            await ci_build_data.findOneAndUpdate(
                {
                    build_number: build_number,
                    job_name: job_name,
                    pipeline_key: pipeline_key,
                },
                {
                    build_number: build_number,
                    build_cause: buildCause,
                    build_result: build_status,
                    build_fullDisplayName: build_details.fullDisplayName,
                    build_url: build_details.url,
                    job_name: job_name,
                    job_url: fetched_pipeline.continuous_integration.job_url,
                    build_timestamp: build_details.timestamp,
                    pipeline_key: pipeline_key,
                    build_duration: build_details.estimatedDuration, //it should be duration
                    build_test: {
                        unit_test: {
                            totalCount: totalCount,
                            failCount: failCount,
                            skipCount: skipCount,
                            testsResult: testsResult
                        },
                        functional_test: {
                            totalCount: totalCountft,
                            failCount: failCountft,
                            skipCount: skipCountft,
                            testsResult: testsResultft
                        }
                    },
                    build_commit_set: commitIDs,
                },
                { upsert: true }
            );
           
            return "done";
        } catch (error) {
            throw error;
        }
    },
};
