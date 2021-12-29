var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var scm_sync_db_save = require('../../service_helpers/common/scm_sync_db_save');
var unirest = require('unirest');
var authorization = require('../Authorization/authorization');

module.exports = {
    fetch_projects: async (azurerepos_tool) => {
        try {
            var azurerepos_auth_token
            azurerepos_auth_token = await authorization.getAzureAuthToken(azurerepos_tool);

            var azuretoken = new Buffer.from(
                ':' +
                azurerepos_auth_token
            ).toString('base64');

            await unirest('GET', 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0')
                .headers({
                    'Authorization': 'Basic' + azuretoken,
                }).then((response) => {
                    resp = response.body.displayName;
                })

            await unirest('POST', `${azurerepos_tool.tool_url}/${resp}/_apis/Contribution/HierarchyQuery`)
                .headers({
                    'accept': 'application/json;api-version=5.0-preview.1;excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true',
                    'content-type': 'application/json',
                    'Authorization': 'Basic' + azuretoken,
                })
                .send(JSON.stringify({ "contributionIds": ["ms.vss-features.my-organizations-data-provider"], "dataProviderContext": { "properties": { "sourcePage": { "url": "https://dev.azure.com/democanvasdevops", "routeId": "ms.vss-tfs-web.suite-me-page-route", "routeValues": { "view": "projects", "controller": "ContributedPage", "action": "Execute", "serviceHost": "694b5e83-f366-4f0d-bf9d-f816dd4d993b (democanvasdevops)" } } } } }))
                .then((response) => {
                    console.log("response",response);
                    resp = response.body.dataProviders["ms.vss-features.my-organizations-data-provider"].organizations;
                });
               console.log("resp:   ",resp);
            return resp;
        }
        catch (error) {
           
            return (error);
        }
    },
    fetch_repositories: async (azurerepos_tool, azurerepos_project_name) => {
        try {
            var azurerepos_auth_token
            azurerepos_auth_token = await authorization.getAzureAuthToken(azurerepos_tool);
            let azuretokentwo = new Buffer.from(
                ':' +
                azurerepos_auth_token
            ).toString('base64');


            // var unirest = require('unirest');
            await unirest('GET', `${azurerepos_tool.tool_url}/${azurerepos_project_name}/_apis/git/repositories?api-version=6.0`)
                .headers({
                    'Authorization': 'Basic' + azuretokentwo,
                })
                .then((response) => {
                    resp = response.body.value;
                });
            return resp;
        }
        catch (error) {
            return (error);
        }
    },

    fetch_branches: async (azurerepos_tool, azurerepos_project_name, azurerepos_repo_name, azurerepos_repo_id) => {
        try {
            var azurerepos_auth_token
            azurerepos_auth_token = await authorization.getAzureAuthToken(azurerepos_tool);

            let azuretokenthree = new Buffer.from(
                ':' +
                azurerepos_auth_token
            ).toString('base64');
            
            await unirest('GET', `${azurerepos_tool.tool_url}/${azurerepos_project_name}/${azurerepos_repo_name}/_apis/git/repositories/${azurerepos_repo_id}/refs?api-version=5.0`)
                .headers({
                    'Authorization': 'Basic' + azuretokenthree,

                })
                .then((response) => {
                    resp = response.body.value;
                   
                });
               
            return resp;
        }
        catch (error) {
            return (error);
        }
    },

    azurereposCommitAggregation: async (scm_obj, tool_url, scm_auth_token) => {

        try {

            var token = new Buffer.from(
                ':' +
                scm_auth_token
            ).toString('base64');

            var commits = [];
            var pulls;
            await unirest('GET', `${tool_url}/${scm_obj.project_name}/${scm_obj.repository_name}/_apis/git/repositories/${scm_obj.project_data.project_id}/commits?api-version=6.0`)
                .headers({
                    'Authorization': 'Basic' + token,

                })
                .then((response) => {
                    commits = response.body.value;
                });
            if (commits != []) {
                let status = await scm_sync_db_save.saveazurereposCommits(commits, scm_obj);
                if (status == 'success') {


                    await unirest('GET', `${tool_url}/${scm_obj.project_name}/${scm_obj.repository_name}/_apis/git/repositories/${scm_obj.project_data.project_id}/pullrequests?api-version=6.0`)
                        .headers({
                            'Authorization': 'Basic' + token,

                        })
                        .then((response) => {
                            pulls = response.body.value;
                        });
                    if (pulls != []) {
                        let status2 = await scm_sync_db_save.saveazurereposPull(pulls, scm_obj);
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
    },
    UpdateazurereposCommitAggregation: async (scm_obj, tool_url, scm_auth_token) => {

        try {

            var token = new Buffer.from(
                ':' +
                scm_auth_token
            ).toString('base64');

            var commits = [];
            var pulls;
            await unirest('GET', `${tool_url}/${scm_obj.tool_project_name}/${scm_obj.repo_name}/_apis/git/repositories/${scm_obj.tool_project_key}/commits?api-version=6.0`)
                .headers({
                    'Authorization': 'Basic' + token,

                })
                .then((response) => {
                    commits = response.body.value;
                });
            if (commits != []) {
                let status = await scm_sync_db_save.UpdateazurereposCommits(commits, scm_obj);
                if (status == 'success') {


                    await unirest('GET', `${tool_url}/${scm_obj.tool_project_name}/${scm_obj.repo_name}/_apis/git/repositories/${scm_obj.tool_project_key}/pullrequests?api-version=6.0`)
                        .headers({
                            'Authorization': 'Basic' + token,

                        })
                        .then((response) => {
                            pulls = response.body.value;
                        });
                    if (pulls != []) {
                        let status2 = await scm_sync_db_save.updateazurereposPull(pulls, scm_obj);
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
            //throw error.message;
        }
    }
}