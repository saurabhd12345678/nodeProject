var http_request = require('../../service_helpers/HTTP-Request/http_request');
var dotenv = require('dotenv');
dotenv.config();

var HTTPRequestOptions = {
    requestMethod: "",
    basicAuthToken: "",
    proxyFlag: false,
    reqToken: false,
    urlSuffix: "",
};
module.exports = {

    create_jira_project: async (plan_obj, jira_url, jira_auth_token,key) => {
        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        HTTPRequestOptions.requestMethod = "POST";
        var requestURL = `${jira_url}/rest/api/2/project`;
 //       var project_key = plan_obj.application_key.slice(0,9).toUpperCase();
 var project_key = key.toUpperCase()
        var project_req_body = {
            key: project_key,
            name: plan_obj.project_name,
            projectTypeKey: "software",
            projectTemplateKey: "com.pyxis.greenhopper.jira:gh-scrum-template",
            description: "Project created thorugh DevOps Onboarding Wizard",
            lead: "admin", //toolAuthhUsername
            assigneeType: "PROJECT_LEAD",
        };

        try {
            let result =
            await http_request.make_request(
                encodeURI(requestURL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                project_req_body
            )
            return ("success");
        }
        catch (error) {

            return {status:"failure", message : error}
        }
    },
    create_jira_project_issue: async (plan_obj, jira_url, jira_auth_token) => {

        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        HTTPRequestOptions.requestMethod = "POST";
        var requestURL = `${jira_url}/rest/api/2/issue`;
        var project_key = plan_obj.pipeline_key.toUpperCase();
        var project_req_body = {
            "fields": {
                "project": {
                    "key": project_key
                },
                "summary": plan_obj.summary,
                "description": "Created this " + plan_obj.issue_type + " through Canvas Devops workflow",
                "issuetype": {
                    "name": plan_obj.issue_type
                }
            }
        };

        try {
            let issue_details = await http_request.make_request(
                encodeURI(requestURL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                project_req_body
            )
            return { status: "success", issue_details: issue_details.body, status_code: issue_details.status_code };
        }
        catch (error) {
            throw error;
        }
    },
    

    create_jira_project_and_get_id: async (plan_obj, jira_url, jira_auth_token) => {

        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        HTTPRequestOptions.requestMethod = "POST";
        var requestURL = `${jira_url}/rest/api/2/project`;
        var project_key = plan_obj.pipeline_key.toUpperCase();
        var project_req_body = {
            key: project_key,
            name: plan_obj.project_name,
            projectTypeKey: "software",
            projectTemplateKey: "com.pyxis.greenhopper.jira:gh-scrum-template",
            description: "Project created thorugh DevOps Onboarding Wizard",
            lead: "admin", //toolAuthhUsername
            assigneeType: "PROJECT_LEAD",
        };

        try {
            let project_details = await http_request.make_request(
                encodeURI(requestURL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                project_req_body
            )
            return { status: "success", id: project_details.body.id };
        }
        catch (error) {
            throw error;
        }
    },
    fetch_jira_roles: async (plan_obj, jira_url, jira_auth_token,project_key) => {
        HTTPRequestOptions.requestMethod = "GET";
        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        var requestURL = `${jira_url}/rest/api/2/project/${project_key.toUpperCase()}/role`;
        try {
            var jira_roles = await http_request.make_request(
                encodeURI(requestURL),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix
            )
            return (jira_roles);
        }
        catch (error) {

            throw new Error(error.message);

        }

    },
    create_jira_project_webhook: async (plan_obj, jira_url, jira_auth_token,key) => {

        HTTPRequestOptions.basicAuthToken = jira_auth_token;
        HTTPRequestOptions.requestMethod = "POST";
        var requestURL = `${jira_url}/rest/webhooks/1.0/webhook`;
       // var project_key =  plan_obj.application_key.slice(0,9).toUpperCase();
        var project_key = key.toUpperCase()
        var project_req_body = {
            "name": project_key + "(CANVAS DevOps)",
            "url": `${process.env.SERVICE_URL}` + "/api/pipeline/webhook/planning",
            "events": [
                // issue related
                "jira:issue_created",
                "jira:issue_updated",
                "jira:issue_deleted",
                "jira:worklog_updated",
                // sprint related
                "sprint_updated",
                "sprint_closed",
                "sprint_started",
                "sprint_created",
                "sprint_deleted",
                // worklog related
                "worklog_created",
                "worklog_updated",
                "worklog_deleted",
                // Feature enabled/disabled... for time tracking
                "option_timetracking_changed",
                // board related
                "board_created",
                "board_updated",
                "board_deleted"
            ],
            "filters": {
                "issue-related-events-section": "Project = " + project_key + " AND  ( issuetype = Epic  OR issuetype = Bug OR issuetype = Task OR issuetype = Sub-task  OR issuetype = Story  )"
            },
            "excludeBody": false
        };

        try {
           var result =  await http_request.make_request(
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
}