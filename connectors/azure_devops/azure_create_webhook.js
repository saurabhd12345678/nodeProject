var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var dotenv = require('dotenv');
var unirest = require('unirest');
const fetch = require("node-fetch");
dotenv.config();
var HTTPRequestOptions = {
    proxyFlag: false,
    urlSuffix: "",
    requestMethod: "",
    basicAuthToken: '',
    reqToken: false
}
var common_headers ={
        'content-type': 'application/json',
        'accept': 'application/json;api-version=6.1-preview.1;excludeUrls=true'
    };
// azure personal Access token is used from env file also the service url is needed to be changed from env file as per requirement 

module.exports.delete_azure_project_webhook = async (project_id, azure_url, azure_auth_token) => {
    let response;
    Auzre_AuthToken_encrypted = "Basic" + " " + new Buffer.from(':' + process.env.AZURE_PERSONAL_ACCESS_TOKEN).toString('base64');

    common_headers['Authorization'] = Auzre_AuthToken_encrypted;
    await unirest('POST', `${azure_url}/_apis/hooks/subscriptions`)
        .headers(
            common_headers
        )
        .send(JSON.stringify({
            "consumerActionId": "httpRequest",
            "consumerId": "webHooks",
            "consumerInputs": {
                "url": `${process.env.SERVICE_URL}/api/webhook/planning/azure `
            },
            "eventType": "workitem.deleted",
            "publisherId": "tfs",
            "publisherInputs": {
                "areaPath": "",
                "workItemType": "",
                "projectId": `${project_id}`
            },
            "resourceVersion": "1.0",
            "scope": 1
        }))
        .then((response) => {
            resp = response.code
        })
    common_headers['Authorization'] = " ";
    return resp;


}

module.exports.create_azure_project_webhookprevious = async (project_id, azure_url, azure_auth_token) => {

    HTTPRequestOptions.basicAuthToken = azure_auth_token;
    HTTPRequestOptions.requestMethod = "POST";
    var requestURL = `${azure_url}/_apis/hooks/subscriptions`;
    var project_id = project_id;
    var project_req_body = {
        "consumerActionId": "httpRequest",
        "consumerId": "webHooks",
        "consumerInputs": {
            "url": `${process.env.SERVICE_URL}` + "/api/webhook/planning/azure"
        },
        "eventType": "workitem.created",
        "publisherId": "tfs",
        "publisherInputs": {
            "areaPath": "",
            "workItemType": "",
            "projectId": `${project_id}`
        },
        "resourceVersion": "1.0",
        "scope": 1
    };

    try {
        await HTTPRequest.make_request(
            encodeURI(requestURL),
            HTTPRequestOptions.requestMethod,
            HTTPRequestOptions.basicAuthToken,
            HTTPRequestOptions.proxyFlag,
            HTTPRequestOptions.reqToken,
            HTTPRequestOptions.urlSuffix,
            project_req_body
        )
        return "success";
    }
    catch (error) {
        throw error;
    }
}
module.exports.create_azure_project_webhook = async (project_id, azure_url, azure_auth_token) => {

    let resp;
    Auzre_AuthToken_encrypted = "Basic" + " " + new Buffer.from(':' + process.env.AZURE_PERSONAL_ACCESS_TOKEN).toString('base64');

    common_headers['Authorization'] = Auzre_AuthToken_encrypted;

    await unirest('POST', `${azure_url}/_apis/hooks/subscriptions`)
        .headers(common_headers
        )
        .send(JSON.stringify({
            "consumerActionId": "httpRequest",
            "consumerId": "webHooks",
            "consumerInputs": {
                "url": `${process.env.SERVICE_URL}/api/webhook/planning/azure `
            },
            "eventType": "workitem.created",
            "publisherId": "tfs",
            "publisherInputs": {
                "areaPath": "",
                "workItemType": "",
                "projectId": `${project_id}`
            },
            "resourceVersion": "1.0",
            "scope": 1
        }))
        .then((response) => {
            resp = response.code
            if (resp == 200) {
                return "Success"
            }
        })
    common_headers['Authorization'] = " ";
    // return resp;
}
module.exports.update_azure_project_webhook = async (project_id, azure_url, azure_auth_token) => {

    let resp;
    Auzre_AuthToken_encrypted = "Basic" + " " + new Buffer.from(':' + process.env.AZURE_PERSONAL_ACCESS_TOKEN).toString('base64');

    common_headers['Authorization'] = Auzre_AuthToken_encrypted;
    await unirest('POST', `${azure_url}/_apis/hooks/subscriptions`)
        .headers(
            common_headers)
        .send(JSON.stringify({
            "consumerActionId": "httpRequest",
            "consumerId": "webHooks",
            "consumerInputs": {
                "url": `${process.env.SERVICE_URL}/api/webhook/planning/azure `
            },
            "eventType": "workitem.updated",
            "publisherId": "tfs",
            "publisherInputs": {
                "areaPath": "",
                "workItemType": "",
                "changedFields": "",
                "projectId": `${project_id}`

            },
            "resourceVersion": "1.0",
            "scope": 1
        }))
        .then((response) => {
            resp = response.code
        })
    common_headers['Authorization'] = " ";
    return resp;
}
