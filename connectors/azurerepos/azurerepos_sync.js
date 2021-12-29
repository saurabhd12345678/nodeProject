var existing_scm = require("../../models/existing_scm_projects");

var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var HTTPRequestOptions = {
    proxyFlag: "",
    urlSuffix: "",
    requestMethod: "",
    basicAuthToken: "",
    reqToken: false
};
var unirest = require('unirest');
var scm_sync_db_save = require('../../service_helpers/common/scm_sync_db_save');
var unirest = require('unirest');
var projectId;
module.exports = {
    create_azure_repo_webhook: async (scm_obj, azurerepo_url, azurerepo_auth_token, scm_proxy_flag) => {

        let request_url = `${azurerepo_url}/${scm_obj.project_name}/_apis/hooks/subscriptions?api-version=6.0`;
        let create_url = `${process.env.SERVICE_URL}/api/webhook/planning/azure`;

        // console.log("scm_obj",scm_obj);
        // console.log("azurerepo_url",azurerepo_url);
        // console.log("azurerepo_auth_token",azurerepo_auth_token);
        // console.log("scm_proxy_flag",scm_proxy_flag);
        // console.log("project id",scm_obj.project_data.project_id);
        let azuretoken = new Buffer.from(':' + azurerepo_auth_token).toString('base64');
        await unirest('GET', `${azurerepo_url}/${scm_obj.project_name}/_apis/projects?api-version=5.0-preview.3`)
            .headers({
                'Authorization': 'Basic' + azuretoken,//dGVzdDpleWtsaGtsNHJvMmJ1Y2d4bmNqNndnaWFpaHp1YmJyeXN5eTVpdGlvY2dpc3FsaHhpdWlx',
                'Content-Type': 'application/json',
            })
            .then((response) => {
                //console.log("response",response);
                resp = response.body.value;

                for (var i = 0; i < resp.length; i++) {
                    if (resp[i]["name"] == scm_obj.repository_name) {
                        projectId = resp[i]["id"];
                        break;
                    }
                }
               // console.log("project Id: ", projectId);

            });


        await unirest('POST', `${azurerepo_url}/${scm_obj.project_name}/_apis/hooks/subscriptions?api-version=6.0`)
            .headers({
                'Authorization': 'Basic' + azuretoken,//dGVzdDpleWtsaGtsNHJvMmJ1Y2d4bmNqNndnaWFpaHp1YmJyeXN5eTVpdGlvY2dpc3FsaHhpdWlx',
                'Content-Type': 'application/json',
            })
            .send(JSON.stringify({
                "consumerActionId": "httpRequest",
                "consumerId": "webHooks",
                "consumerInputs": {
                    "url": `${process.env.SERVICE_URL}/api/pipeline/webhook/scm/azurerepos`
                },
                "eventType": "git.push",
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



        await unirest('POST', `${azurerepo_url}/${scm_obj.project_name}/_apis/hooks/subscriptions?api-version=6.0`)
            .headers({
                'Authorization': 'Basic' + azuretoken,//dGVzdDpleWtsaGtsNHJvMmJ1Y2d4bmNqNndnaWFpaHp1YmJyeXN5eTVpdGlvY2dpc3FsaHhpdWlx',
                'Content-Type': 'application/json',
            })
            .send(JSON.stringify({
                "consumerActionId": "httpRequest",
                "consumerId": "webHooks",
                "consumerInputs": {
                    "url": `${process.env.SERVICE_URL}/api/pipeline/webhook/scm/azurerepos`
                },
                "eventType": "git.pullrequest.created",
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

        if (resp == "200") {
            return "success";
        }



    }
}