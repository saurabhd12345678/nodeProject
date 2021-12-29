
var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var Pipeline = require("../../models/pipeline");
var dotenv = require('dotenv');
const { keys } = require('xstate/lib/utils');
dotenv.config();
var unirest = require('unirest');


var HTTPRequestOptions = {
    proxyFlag: false,
    urlSuffix: "",
    requestMethod: "",
    basicAuthToken: '',
    reqToken: false
}


module.exports = {
    create_jira_project_webhook: async (plan_obj, jira_url, jira_auth_token) => {

        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        HTTPRequestOptions.requestMethod = "POST";
        var requestURL = `${jira_url}/rest/webhooks/1.0/webhook`;
        var project_key = plan_obj.project_key.toUpperCase();
        var project_req_body = {
            "name": project_key + "(CANVAS DevOps Key - " + plan_obj.pipeline_key + ")",
            "url": `${process.env.SERVICE_URL}` + "/api/pipeline/webhook/planning",
            "events": [
                "jira:issue_created",
                "jira:issue_updated",
                "jira:issue_deleted",
                "sprint_updated",
                "sprint_closed",
                "sprint_started",
                "sprint_created"
            ],
            "filters": {
                "issue-related-events-section": "Project = " + project_key + " AND  ( issuetype = Epic  OR issuetype = Bug OR issuetype = Task OR issuetype = Sub-task  OR issuetype = Story  )"
            },
            "excludeBody": false
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
    },
    jiraAggregation: async (plan_obj, tool_details, jira_auth_token, plan_proxy_flag) => {


        var tool_url = tool_details.tool_url;
        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        HTTPRequestOptions.proxyFlag = plan_proxy_flag;
        HTTPRequestOptions.requestMethod = "GET";


        var JQL = `project=${plan_obj.project_key} AND  (issuetype=Epic OR issuetype=Story OR issuetype=Bug OR issuetype=Task)`;
        var URL = `${tool_url}/rest/api/2/search?jql=${JQL}&maxResults=1000&expand=changelog`;



        try {
            var result = await HTTPRequest.make_request(encodeURI(URL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag);

           

            return result.body.issues;
        }
        catch (error) {
            throw new Error(error.message);

        }
    },


    getAllBoard: async (project_key, jira_url, HTTPRequestOptions) => {

        let board_url = `${jira_url}/rest/agile/1.0/board/?project_keyOrId=${project_key}`;
        try {
            let result = await HTTPRequest.make_request(board_url,
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag)

            
            return result.body.values;
        }
        catch (error) {
            throw new Error(error.message);

        }
    },


    getSprintsOfBoards: async (board, HTTPRequestOptions) => {
        try {

            let self = board.self
          

            let result = await HTTPRequest.make_request(self + "/sprint",
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag)

          

            return result.body.values;
        }
        catch (error) {

            throw new Error(error.message);

        }
    },


    getIssueOnSprint: async (project_key, HTTPRequestOptions, jira_url, sprint_id) => {

        var issueJQL = `project=${project_key} AND Sprint=${sprint_id}`;
        var issueURL = `${jira_url}/rest/api/2/search?jql=${issueJQL}`;
        try {
            var issuesResult = await HTTPRequest.make_request(encodeURI(issueURL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag)

        
            return issuesResult.body.issues;
        }
        catch (error) {
            throw new Error(error.message);

        }
    },

    getJiraRole: async (jira_url, jira_auth_token, project_key) => {
        HTTPRequestOptions.requestMethod = "GET";
        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        var requestURL = `${jira_url}/rest/api/2/project/${project_key}/role`;

        try {
            var jira_roles = await HTTPRequest.make_request(
                encodeURI(requestURL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix
            )
            return jira_roles
        }
        catch (error) {
            throw new Error(error.message);

        }
    },
    
    getWorkItemsHistory: async (jira_url, project_id, sprint_id, workitem_id, jira_auth_token) => {
        try {
            let start_date;
            let end_date;
            let diffDays = 0;
            let diffTime = 0;
            await unirest('GET', `${jira_url}/rest/api/2/search?jql=project=${project_id} AND sprint=${sprint_id} AND id=${workitem_id}&expand=changelog`)
                .headers({
                    'Authorization': 'Basic' + " " + jira_auth_token
                })
                .then(async (response) => {
                   
                    let workItemDetails = response.body;
                   
                    if (workItemDetails.issues != undefined) {
                        if (workItemDetails.issues[0].fields.status.name == "Developed" || workItemDetails.issues[0].fields.status.name == "Done") {
                            let history = workItemDetails.issues[0].changelog.histories
                            let history_length = history.length;
                            end_date = new Date(workItemDetails.issues[0].changelog.histories[history_length - 1].created);

                            for await (let hist of history) {
                                if (hist.items[0].fromString == "To Do" && hist.items[0].toString == "In-Progress" || hist.items[0].toString == "In Progress") {
                                    start_date = new Date(hist.created);
                                }
                            }

                        }
                      
                        if (start_date != undefined && end_date != undefined) {
                            diffTime = Math.abs(end_date - start_date);
                            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }
                       
                    }



                });
            return diffDays;
        }
        catch (error) {
            throw new Error(error.message);
        }

    }
}