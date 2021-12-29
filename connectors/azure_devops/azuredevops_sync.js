
var unirest = require('unirest');


var projectId;

module.exports = {
    create_azure_devops_webhook: async (continuous_integration_obj, azuredevops_url, continuous_integration_auth_token, ci_proxy_flag,repository_data) => {

        // console.log("continuous_integration_obj: ",continuous_integration_obj);
        // console.log("azuredevops_url: ",azuredevops_url);
        // console.log("continuous_integration_auth_token: ",continuous_integration_auth_token);
        // console.log("ci_proxy_flag: ",ci_proxy_flag);
        // console.log("repository_data: ",repository_data);

        await unirest('GET', `${azuredevops_url}/_apis/projects?api-version=5.0-preview.3`)
            .headers({
                'Authorization': 'Basic '+continuous_integration_auth_token,
                'Content-Type': 'application/json',
            })
            .then((response) => {
                //console.log("response",response);
                resp = response.body.value;
            
                for (var i = 0; i < resp.length; i++) {
                    if (resp[i]["name"] == repository_data) {
                        projectId = resp[i]["id"];
                        break;
                    }
                }
                // console.log("project Id: ", projectId);

            });


            
            var req = unirest('POST', `${azuredevops_url}/_apis/hooks/subscriptions?api-version=6.0`)
              .headers({
                'Authorization': 'Basic '+continuous_integration_auth_token,
                'Content-Type': 'application/json',
              })
              .send(JSON.stringify({
                "consumerActionId": "httpRequest",
                "consumerId": "webHooks",
                "consumerInputs": {
                  "url":  `${process.env.SERVICE_URL}/api/pipeline/webhook/ci/azuredevops`
                },
                "eventType": "build.complete",
                "publisherId": "tfs",
                "publisherInputs": {
                  "projectId": projectId
                },
                "resourceVersion": "1.0",
                "scope": 1
              }))
              .then((response) => {
                resp = response.code
            })
            

    }
}