var http_request = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require('unirest');
var dotenv = require('dotenv');
dotenv.config();
const existing_scm_projects = require('../../models/existing_scm_projects');


module.exports.create_gitlab_project = async (scm_obj, gitlab_url, gitlab_auth_token) => {
    try {
        await unirest('POST', `${gitlab_url}/api/v4/projects`)
            .headers({
                'Authorization': 'Bearer' + ' ' + gitlab_auth_token,
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({
                "name": scm_obj.project_name,
                "description": "Project created using DevOps Onboarding Wizard"
            }))
            .then((response) => {
                resp = response
            });

        return resp
    }
    catch (error) {
        return (error);
    }

}
module.exports.create_gitlab_project_in_given_namespace = async (tool_obj, tool_url, gitlab_auth_token) => {
    try {

        await unirest('POST', `${tool_url}/api/v4/projects?namespace_id=${tool_obj.groupname}`)
            .headers({
                'Authorization': 'Bearer' + ' ' + gitlab_auth_token,
                'Content-Type': 'application/json',

            })
            .send(JSON.stringify({
                "name": tool_obj.project_name
            }))
            .then((response) => {
                resp = response
            });
        return resp
    }
    catch {

        throw error;
    }
}
