var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require('unirest');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var scm_sync_db_save = require('../../service_helpers/common/scm_sync_db_save');
var authorization = require('../Authorization/authorization');

module.exports.fetch_projects = async (gitlab_tool) => {
    try {
        var gitlab_auth_token
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);

        var token = "Bearer" + " " + gitlab_auth_token;
        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/projects?visibility=private`)

            .headers({
                'Authorization': token,

            })
            .then((response) => {
                resp = response.body
            });
        return resp;

    }
    catch (error) {
        return (error);
    }
}
module.exports.fetch_groups = async (gitlab_tool) => {
    try {
        var gitlab_auth_token

        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);

        var token = "Bearer" + " " + gitlab_auth_token;

        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/groups`)
            .headers({
                'Authorization': token,

            })
            .then((response) => {
                resp = response.body
            });
        return resp;
    }
    catch (error) {

        return (error);
    }
}


module.exports.fetch_usernamespace_projects = async (gitlab_tool) => {
    try {
        var gitlab_auth_token
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);


        var token = "Bearer" + " " + gitlab_auth_token;

        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/projects?visibility=private`)
            .headers({
                'Authorization': token,

            })
            .then((response) => {
                resp = response.body
            });
        return resp;
    }
    catch (error) {

        return (error);
    }
}

module.exports.fetchGroupsWithAccess = async (gitlab_tool) => {
    try {
        var gitlab_auth_token
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);

        var token = "Bearer" + " " + gitlab_auth_token;


        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/groups?top_level_only=true&min_access_level=30`)
            .headers({
                'Authorization': token,

            })
            .then((response) => {
                resp = response.body
            });
        return resp;

    }
    catch (error) {

        throw error;
    }
}

module.exports.fetch_repositories = async (gitlab_tool, gitlab_project_id) => {
    try {
        let gitlab_auth_token
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);

        let resp;
        var token = "Bearer" + " " + gitlab_auth_token;
        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/projects/${gitlab_project_id}/repository/tree`)
            .headers({
                'Authorization': token,
            })
            .then((response) => {
                resp = response.body
            });
        return resp;
    }
    catch (error) {

        return (error);
    }
}
module.exports.fetch_projectsusingGroup = async (gitlab_tool, gitlab_project_id) => {
    try {
        let gitlab_auth_token
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);
        let resp;
        let response_api;
        let code;
        let resp_projects = [];
        var token = "Bearer" + " " + gitlab_auth_token;
        var unirest = require('unirest');
        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/groups/${gitlab_project_id}/projects`)
            .headers({
                'Authorization': token,
            })
            .then((response) => {
                // console.log("response of repos----->", response.body);
                code = response.code;
                response_api = response.body;
            });
        if (code == "404") {
            let gitlab_projects = await module.exports.fetch_usernamespace_projects(gitlab_tool);
            for await (let proj of gitlab_projects) {
                let proj_obj = {
                    id: proj.id,
                    name: proj.name,
                    web_url: proj.web_url
                }
                resp_projects.push(proj_obj);
            }
            resp = resp_projects;
        }
        else if (code == "200") {
            resp = response_api;
        }
        return resp;
    }
    catch (error) {
        return (error);
    }
}

module.exports.fetch_branches = async (gitlab_tool, gitlab_project_id) => {
    try {

        let gitlab_auth_token;
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);

        var token = "Bearer" + " " + gitlab_auth_token;

        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/projects/${gitlab_project_id}/repository/branches?per_page=900`)
            .headers({
                'Authorization': token,

            })
            .then((response) => {
                resp = response.body
            });

        return resp;
    }
    catch (error) {

        return (error);
    }
}

module.exports.gitlabCommitAggregation = async (scm_obj, tool_url, scm_auth_token) => {

    try {
        var token = "Bearer" + " " + scm_auth_token;
        var commits;
        var pulls;
        console.log("scm obj--->", scm_obj);
        await unirest('GET', `${tool_url}/api/v4/projects/${scm_obj.project_data.project_key}/repository/commits?ref_name=${scm_obj.branch_name}&per_page=900&with_stats=true`)
            .headers({
                'Authorization': token,
                'Content-Type': 'application/json',

            })
            .then((response) => {
                commits = response.body
            });
        if (commits != []) {
            console.log("commits in aggre--->", commits);
            let status = await scm_sync_db_save.saveGitLabCommits(commits, scm_obj);
            if (status == 'success') {


                await unirest('GET', `${tool_url}/api/v4/projects/${scm_obj.project_data.project_key}/merge_requests?state=all`)
                    .headers({
                        'per_page': '999',
                        'Authorization': token,

                    })
                    .then((response) => {
                        pulls = response.body
                    });
                if (pulls != []) {
                    let status2 = await scm_sync_db_save.saveGitlabPull(pulls, scm_obj);
                    if (status2 == 'success') {
                        return 'success'
                    }
                    else {
                        return 'failed';
                    }
                }


            }

        }
        else {
            return 'failed';
        }


    }
    catch (error) {

        throw error
    }
}


module.exports.updategitlabCommitAggregation = async (scm_obj, tool_url, scm_auth_token) => {

    try {
        var token = "Bearer" + " " + scm_auth_token;
        var commits;
        var pulls;

        await unirest('GET', `${tool_url}/api/v4/projects/${scm_obj.tool_project_key}/repository/commits?ref_name=${scm_obj.branch_name}&per_page=900&with_stats=true`)
            .headers({
                'Authorization': token,
                'Content-Type': 'application/json',

            })
            .then((response) => {

                commits = response.body
            });

        if (commits != []) {
            let status = await scm_sync_db_save.updateGitLabCommits(commits, scm_obj);
            if (status == 'success') {


                await unirest('GET', `${tool_url}/api/v4/projects/${scm_obj.tool_project_key}/merge_requests?state=all`)
                    .headers({
                        'per_page': '999',
                        'Authorization': token,

                    })
                    .then((response) => {
                        pulls = response.body
                    });
                if (pulls != []) {
                    let status2 = await scm_sync_db_save.updateGitlabPull(pulls, scm_obj);
                    if (status2 == 'success') {
                        return 'success'
                    }
                    else {
                        return 'failed';
                    }
                }


            }

        }
        else {
            return 'failed';
        }


    }
    catch (error) {
        return "failed";
        //throw error
    }
}

module.exports.gitlabworklowCommitAggregation = async (scm_obj, tool_url, scm_auth_token) => {

    try {
        var token = "Bearer" + " " + scm_auth_token;
        var commits;
        var pulls;
        await unirest('GET', `${tool_url}/api/v4/projects/${scm_obj.project_key}/repository/commits?ref_name=${scm_obj.branch_name}&per_page=900`)
            .headers({
                'Authorization': token,
                'Content-Type': 'application/json',

            })
            .then((response) => {
                commits = response.body
            });
        if (commits != []) {
            let status = await scm_sync_db_save.saveGitLabWorkflowCommits(commits, scm_obj);
            if (status == 'success') {


                await unirest('GET', `${tool_url}/api/v4/projects/${scm_obj.project_key}/merge_requests?state=all`)
                    .headers({
                        'per_page': '999',
                        'Authorization': token,

                    })
                    .then((response) => {
                        pulls = response.body
                    });
                if (pulls != []) {
                    let status2 = await scm_sync_db_save.saveGitlabWoorkflowPull(pulls, scm_obj);
                    if (status2 == 'success') {
                        return 'success'
                    }
                    else {
                        return 'failed';
                    }
                }


            }

        }
        else {
            return 'failed';
        }


    }
    catch (error) {

        throw error
    }
}

