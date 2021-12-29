var existing_scm = require("../../models/existing_scm_projects");

const logger = require('../../configurations/logging/logger');
var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var HTTPRequestOptions = {
    proxyFlag: "",
    urlSuffix: "",
    requestMethod: "",
    basicAuthToken: "",
    reqToken: false
};
var scm_sync_db_save = require('../../service_helpers/common/scm_sync_db_save');
module.exports = {
    create_bitbucket_repo_webhook: async (scm_obj, bitbucket_url, bitbucket_auth_token, scm_proxy_flag) => {
        HTTPRequestOptions.basicAuthToken = bitbucket_auth_token;
        HTTPRequestOptions.proxyFlag = scm_proxy_flag;
        HTTPRequestOptions.requestMethod = "POST";
        let request_url = `${bitbucket_url}/rest/api/1.0/projects/${scm_obj.project_data.project_key}/repos/${scm_obj.repository_name}/webhooks`;
        let project_req_body = {
            "name": "CANVAS DevOps Key - " + scm_obj.pipeline_key,
            "url": `${process.env.SERVICE_URL}/api/pipeline/webhook/scm/bitbucket`,
            "events": [
                "repo:modified",
                "repo:refs_changed",
                "pr:deleted"
            ],
            "enabled": true
        }

        try {
            await HTTPRequest.make_request(
                encodeURI(request_url),
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag,
                HTTPRequestOptions.reqToken,
                HTTPRequestOptions.urlSuffix,
                project_req_body)

            return "success";
        }
        catch (error) {
            throw error;

        }

    },
    bitbucketCommitAggregation: async (scm_obj, tool_url, scm_auth_token, scm_proxy_flag) => {
        HTTPRequestOptions.basicAuthToken = scm_auth_token;
        HTTPRequestOptions.proxyFlag = scm_proxy_flag;
        HTTPRequestOptions.requestMethod = "GET";
        let type = "commit";
        let repo_url =
            `${tool_url}/rest/api/1.0` +
            `/projects/${scm_obj.project_data.project_key}` +
            `/repos/${scm_obj.repository_name}` +
            `/commits?until=refs/heads/${scm_obj.branch_name}`;
       
        let isLastPage = false;
        let pageStart = 0;

        try {
            let commits_done = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url);
            if (commits_done == "success") {
                let pulls_done = await module.exports.bitbucketPullAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag);
                if (pulls_done == "success") {
                    let users_done = await module.exports.bitbucketUserAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag);
                    if (users_done == "success") {
                        return users_done;
                    }
                }
            }
        }
        catch (err) {
           
            logger.error("bitbucketCommitAggregation ", err);
        }
    },
    bitbucketCommitAggregationWorkFlow: async (scm_obj, tool_url, scm_auth_token, scm_proxy_flag,tool_id) => {


        let project_data = {
            "project_repo_url": "",
            "project_id": "",
            "project_key": ""
        }
        let project_details=[];
        project_details= await existing_scm.findOne({ scm_project_name: scm_obj.project_name,tool_id:tool_id }).lean();
      
        project_data.project_id = project_details.scm_project_id;
        project_data.project_key = project_details.scm_project_key;
        // project_details.repos.forEach(repo => {
        //     if (repo.scm_repo_name == scm_obj.repository_name)
        //         project_data.project_repo_url = repo.scm_repo_self;
        // });
        for (let repo of project_details.repos) {
            if (repo.scm_repo_name == scm_obj.repository_name)
                project_data.project_repo_url = repo.scm_repo_self;
        }
        scm_obj.project_data = project_data;



        HTTPRequestOptions.basicAuthToken = scm_auth_token;
        HTTPRequestOptions.proxyFlag = scm_proxy_flag;
        HTTPRequestOptions.requestMethod = "GET";
        let type = "commit";
        let repo_url =
            `${tool_url}/rest/api/1.0` +
            `/projects/${scm_obj.project_key}` +
            `/repos/${scm_obj.repository_name}` +
            `/commits?until=refs/heads/${scm_obj.branch_name}`;
        let isLastPage = false;
        let pageStart = 0;

        try {
            let commits_done = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type);
            if (commits_done == "success") {
                let pulls_done = await module.exports.bitbucketPullAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag);
                if (pulls_done == "success") {
                    let users_done = await module.exports.bitbucketUserAggregation(scm_obj, tool_url, scm_auth_token, scm_proxy_flag);
                    if (users_done == "success") {
                        return users_done;
                    }
                }
            }
        }
        catch (err) {
            logger.error("bitbucketCommitAggregation ", err.message);
        }
    },
    requestPagination: async (repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url) => {
        var toolurl = tool_url;
        var token = scm_auth_token;
        if (isLastPage == true) {
            return "success";
        }
        else {
            let commits = [];
            let URl = ""
            if (type == "user") {
                URl = repo_url + "?start=" + pageStart;
            }
            else {
                URl = repo_url + "&start=" + pageStart;
            }

            try {
                //=================================
                let result = await module.exports.getCommitData(URl, HTTPRequestOptions)

                if (result != null) {
                    let isLastPage = result.body.isLastPage;
                    let pageStart = result.body.nextPageStart;
                    if (type == "commit") {
                        let commits = result.body.values;
                        let type = "commit";
                        let commit_status = await scm_sync_db_save.saveCommits(commits, scm_obj, token, toolurl);
                        if (commit_status == "success") {
                            let pagination_status = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url);
                            return pagination_status;
                        }

                    }
                    else if (type == "pull") {
                        let pulls = result.body.values;
                        let type = "pull";
                        let pull_status = await scm_sync_db_save.savePull(pulls, scm_obj);
                        if (pull_status == "success") {
                          
                            let pagination_status = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url);
                            return pagination_status;
                        }

                    }
                    else if (type == "user") {
                        let users = result.body.values;
                        let type = "user";
                        let user_status = await scm_sync_db_save.saveUsers(users, scm_obj);
                        if (user_status == "success") {
                            let pagination_status = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url);
                            return pagination_status;
                        }

                    }
                }
                else {
                    return "success";
                }
            }
            catch (err) {
               
                logger.error("requestPagination ", err);
                throw err
            }
        }
    },
    bitbucketPullAggregation: async (scm_obj, tool_url, scm_auth_token, scm_proxy_flag) => {
        HTTPRequestOptions.basicAuthToken = scm_auth_token;
        HTTPRequestOptions.proxyFlag = scm_proxy_flag;
        HTTPRequestOptions.requestMethod = "GET";
        let type = "pull";
        let repo_url =
            `${tool_url}/rest/api/1.0` +
            `/projects/${scm_obj.project_data.project_key}` +
            `/repos/${scm_obj.repository_name}/pull-requests?state=ALL`;
        let isLastPage = false;
        let pageStart = 0;

        try {
            let pull_done = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url);
            if (pull_done == "success") {
                return pull_done;
            }
        }
        catch (err) {
            logger.error("bitbucketPullAggregation ", err.message);
        }
    },
    bitbucketUserAggregation: async (scm_obj, tool_url, scm_auth_token, scm_proxy_flag) => {
        HTTPRequestOptions.basicAuthToken = scm_auth_token;
        HTTPRequestOptions.proxyFlag = scm_proxy_flag;
        HTTPRequestOptions.requestMethod = "GET";
        let type = "user";

        let repo_url =
            `${tool_url}/rest/api/1.0` +
            `/projects/${scm_obj.project_data.project_key}/permissions/users`;
        let isLastPage = false;
        let pageStart = 0;
        try {
            let user_done = await module.exports.requestPagination(repo_url, isLastPage, pageStart, HTTPRequestOptions, scm_obj, type, scm_auth_token, tool_url);
            if (user_done == "success") {
                return user_done;
            }
        }
        catch (err) {
            logger.error("bitbucketUserAggregation ", err);
        }
    },
    getCommitData: async (url, HTTPRequestOptions) => {
        try {
            let result = await HTTPRequest.make_request(
                url,
                HTTPRequestOptions.requestMethod,
                HTTPRequestOptions.basicAuthToken,
                HTTPRequestOptions.proxyFlag
            )
            return result
        }

        catch (error) {
            if (error.status_code == 404) {
                return null
            }

        }
    }
}