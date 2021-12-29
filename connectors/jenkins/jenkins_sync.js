var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
const pipeline = require('../../models/pipeline');
var test_results_db = require('../../models/azure_test_data');

var HTTPRequestOptions = {
    requestMethod: "GET",
    basicAuthToken: "",
    proxyFlag: "",
    reqToken: false,
    urlSuffix: "",
    buildURLSuffix: `/api/json?pretty=true&tree=description,displayName,displayNameOrNull,name,url,` +
        `fullDisplayName,builds[*,changeSet[*,items[*]],changeSets[*,items[*]],actions[failCount,skipCount,totalCount,causes[*],parameters[*]]]`,
};


module.exports = {

    buildAggregation: async (continuous_integration_obj, jenkins_url, jenkins_auth_token, ci_proxy_flag) => {
        HTTPRequestOptions.basicAuthToken = jenkins_auth_token;
        HTTPRequestOptions.proxyFlag = ci_proxy_flag;

        var jenkinsBuildURL = jenkins_url + '/job/' + continuous_integration_obj.project_name;
       
        try {
            var result = await HTTPRequest.make_request(jenkinsBuildURL,
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.buildURLSuffix)
               
            return result.body.builds;
        }
        catch (error) {
           
            throw new Error(error.message);
        }



    },
    azureBuildAggregation: async (continuous_integration_obj, pipeline_details, azure_url, azure_auth_token, ci_proxy_flag) => {

        HTTPRequestOptions.basicAuthToken = azure_auth_token;
        HTTPRequestOptions.proxyFlag = ci_proxy_flag;
        let ci_data_azure = [];
        var azureBuildURL = azure_url + "/CanvasdevOpsxAzuredevOps/_apis/build/builds?definitions=" + pipeline_details.definition_id
            + "&name=" + continuous_integration_obj.project_name + "&api-version=6.0";
        
        try {
            var result = await HTTPRequest.make_request(azureBuildURL,
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
            )
           
            for await (let element of result.body.value) {
                let buildID = element.id;
                let response = await module.exports.azureTestResults(buildID, azure_auth_token, ci_proxy_flag, continuous_integration_obj.pipeline_key);
                
                if (element.result == "failed") {
                    element.result = "FAILURE"
                }
                else if (element.result == "succeeded") {
                    element.result = "SUCCESS"
                }
                let date = new Date(element.startTime);
                
                let date2 = new Date(element.finishTime);
                
                let diff = Math.abs(date2 - date);
                
                let ci_data_value = {
                    build_number: element.id, //build no
                    build_cause: "Started by user " + element.requestedFor.displayName, //triggered by  //build_data.actions.causes.shortDescription
                    build_result: element.result, //build_data.result
                    build_fullDisplayName: element.definition.name + "#" + element.id, //jobname#buildno //build_data.fullDisplayName
                    build_url: element.url, //http://10.139.138.202:8080/job/broadRidge123AWS/74/   //build_data.url
                    job_name: element.definition.name,
                    pipeline_key: continuous_integration_obj.pipeline_key,
                    build_duration: diff,
                    job_url: pipeline_details.ci_project_url,
                    build_timestamp: element.startTime, //"timestamp": 1596454260243, //build_data.timestamp,
                    build_commit_set: null, //total number of commits in dat build
                    build_test: {
                        totalCount: null,
                        failCount: null,
                        skipCount: null,
                        testsResult: null
                    }
                }
                

                ci_data_azure.push(ci_data_value);
            }
            
          
            return ci_data_azure;
        }
        catch (error) {
            throw new Error(error.message);
        }



    },
    azureTestResults: async (buildID, azure_auth_token, ci_proxy_flag, pipeline_key) => {

        HTTPRequestOptions.basicAuthToken = azure_auth_token;
        HTTPRequestOptions.proxyFlag = ci_proxy_flag;
        let ci_data_azure = [];
        var azureBuildURL = "https://vstmr.dev.azure.com/democanvasdevops/4af0e850-5453-4d8d-85ee-18176a836cf1/_apis/testresults/metrics?pipelineId=" + buildID + "&metricNames=2"

        try {
            var result = await HTTPRequest.make_request(azureBuildURL,
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
            )
           
            let a = result.body.resultSummary.resultSummaryByRunState.Completed.aggregatedResultDetailsByOutcome.Passed.duration.split(":");
            
            await test_results_db.findOneAndUpdate({ 'pipeline_key': pipeline_key, 'build_number': buildID },
                {
                    $set: {
                        'pipeline_key': pipeline_key,
                        'build_number': buildID,
                        'total_test': result.body.resultSummary.resultSummaryByRunState.Completed.totalTestCount,
                        'test_result': result.body.resultSummary.resultSummaryByRunState.Completed.aggregatedResultDetailsByOutcome.Passed.outcome,
                        'test_pass_count': result.body.resultSummary.resultSummaryByRunState.Completed.aggregatedResultDetailsByOutcome.Passed.count,
                        'test_duration' : a[2]*1000,
                        'test_fail_count': result.body.resultSummary.resultSummaryByRunState.Completed.totalTestCount - result.body.resultSummary.resultSummaryByRunState.Completed.aggregatedResultDetailsByOutcome.Passed.count
                    }

                }
                , { upsert: true, new: true }).lean();
            

            return "success";
        }
        catch (error) {
            throw new Error(error.message);
        }



    }
}