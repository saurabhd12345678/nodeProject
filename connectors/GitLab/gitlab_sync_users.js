var unirest = require('unirest');
var dotenv = require('dotenv');
const verify_token = require('../../service_helpers/verify_token');
const gitlab_sync_projects = require('../../connectors/GitLab/gitlab_sync_project');
var authorization = require('../Authorization/authorization');
dotenv.config();
var hashicorp_vault_helper = require("../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../connectors/hashicorp-vault/read_secret");
var groups;
var members;
var projects;
var membersarray = [];
module.exports.fetch_gitlab_users = async (gitlab_tool) => {
    try {

        var gitlab_auth_token;
        gitlab_auth_token = await authorization.getAuthToken(gitlab_tool);

        var token = "Bearer" + " " + gitlab_auth_token;

        await unirest('GET', `${gitlab_tool.tool_url}/api/v4/groups`)
            .headers({
                'Authorization': token,

            })
            .then((response) => {
                groups = response.body
            });

        for await (let group of groups) {
            let group_id = group.id;


            await unirest('GET', `${gitlab_tool.tool_url}/api/v4/groups/${group_id}/projects`)
                .headers({
                    'Authorization': token,

                })
                .then((response) => {
                    projects = response.body
                });

            for await (let proj of projects) {
                let project_id = proj.id;
                await unirest('GET', `${gitlab_tool.tool_url}/api/v4/projects/${project_id}/members/all`)
                    .headers({
                        'Authorization': token,

                    })
                    .then((response) => {
                        members = response.body
                    });
                for await (let mem of members) {
                    membersarray.push(mem);
                }
            }
        }
        return membersarray;
    }
    catch (error) {

        throw error;

    }


}

