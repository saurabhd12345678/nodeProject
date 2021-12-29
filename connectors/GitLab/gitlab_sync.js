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
module.exports = {
    create_gitlab_repo_webhook: async (scm_obj, gitlab_url, gitlab_auth_token, scm_proxy_flag) => {

        let request_url = `${gitlab_url}/api/v4/projects/${scm_obj.project_data.project_key}/hooks`;
        // let url = `${process.env.SERVICE_URL}/api/pipeline/webhook/scm/gitlab`;
        // let project_req_body = {
        //     "name": "CANVAS DevOps Key - " + scm_obj.pipeline_key,
        //     "url": "http://7fa9-103-249-250-64.ngrok.io/api/pipeline/webhook/scm/gitlab",
        //     "events": [
        //         "push",
        //         "pull"
        //     ],
        //     "enabled": true,
        //     "merge_requests_events": true

        // }

        try {
            await unirest('POST', request_url)
                .headers({
                    'Authorization': 'Bearer' + " " + gitlab_auth_token,
                    'Content-Type': 'application/json',
                })
                .send(JSON.stringify({
                    "name": scm_obj.pipeline_key,
                    "url":`${process.env.SERVICE_URL}/api/pipeline/webhook/scm/gitlab`,
                    "events": [
                        "push",
                        "pull"
                    ],
                    "enabled": true,
                    "merge_requests_events": true
                }))
                .then((response) => {
                    resp = response.code
                })
            if(resp=="201"){
            return "success";
            }
        }
        catch (error) {
            throw error;

        }

    }
}




