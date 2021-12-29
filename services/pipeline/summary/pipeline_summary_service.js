var logger = require('../../../configurations/logging/logger');
var ci_datas = require('../../../models/ci_data');
var scm_datas = require('../../../models/scm_data');
var code_analysis = require('../../../models/code_analysis');
var planning_datas = require('../../../models/planning_data');
var sprints = require('../../../models/sprint');
var applications = require('../../../models/application');
module.exports = {

    
    /**
        *function returns pipeline summary
        * @param {String} pipeline_key
        */
    summary_pipeline_data: async (pipeline_key) => {

        try {
            var i = 1;
            var ci_data = await ci_datas.aggregate([
                {
                    $match:
                    {
                        pipeline_key: pipeline_key
                    }
                },
                { $sort: { build_number: -1 } },
                {
                    $lookup:
                    {
                        from: "pipelines",
                        localField: "pipeline_key",
                        foreignField: "pipeline_key",
                        as: "pipeline_details"
                    }
                },
                {
                    $unwind: "$pipeline_details"
                },
                {
                    $addFields: {
                        "build_new_timestamp": { $dateToString: { format: "%d-%m-%YT%H:%M", date: "$build_timestamp" } },
                        "number_of_commits": { $cond: { if: { $isArray: "$build_commit_set" }, then: { $size: "$build_commit_set" }, else: "-" } },
                        "total_build_duration": { $divide: ["$build_duration", (1000 * 60)] },
                        "epics": 0,
                        "bugs": 0,
                        "stories": 0,
                        "functional_test": 0,
                        "code_coverage": 0,
                        "technical_debt": 0,
                        "vulnerabilities": 0,
                        "delta_build_duration": 1,
                        "repo_name": "$pipeline_details.scm.repo_name"

                    }
                },
                {
                    $project: {

                        "pipeline_key": 1,
                        "build_cause": 1,
                        "build_result": 1,
                        "job_name": 1,
                        "job_url": 1,
                        "build_number": 1,
                        "number_of_commits": 1,
                        "total_build_duration": 1,
                        build_time: { $split: ["$build_new_timestamp", "T"] },
                        "build_test": 1,
                        "delta_build_duration": 1,
                        "bugs": 1,
                        "stories": 1,
                        "functional_test": 1,
                        "code_coverage": 1,
                        "technical_debt": 1,
                        "vulnerabilities": 1,
                        "epics": 1,
                        "repo_name": 1,

                    }
                }
            ])


            for (i = 0; i < ci_data.length; i++) {
                if (ci_data[i].build_result != "IN PROGRESS" && ci_data[i].build_result != "INVALID" && ci_data[i].build_result != undefined && ci_data[i].build_result != null && ci_data[i].build_result != "INVALID" ) {
                    // ci_data[i].build_cause = ci_data[i].build_cause.slice(16, ci_data[i].build_cause.length); // trimming started by used in table
                    if (i == (ci_data.length - 1)) {
                        ci_data[i].delta_build_duration = "-";
                    }
                    else {
                        var delta = (ci_data[i].total_build_duration) - (ci_data[i + 1].total_build_duration);
                        ci_data[i].delta_build_duration = delta.toFixed(2);
                    }
                }
                else{
                    ci_data[i].delta_build_duration = 0;
                }
            }

            return (ci_data);
        }
        catch (error) {
            throw error
        }
    },
    checkPipeline: async (application_key) => {

        try {
            let application_response = await applications.findOne({'application_key' : application_key});
            
            if(application_response.pipelines.length >= 1){
                return true;
            }
            else{
                return false;
            }         
        }
        catch (error) {

            throw error
        }
    }



}