var http_request = require('../../service_helpers/HTTP-Request/http_request');
var dotenv = require('dotenv');
dotenv.config();

let http_request_options = {
    request_method: 'POST',
    basic_auth_token: "",
    proxy_flag: false,
    req_token: false,
    url_suffix: ""
}


module.exports = {
    create_bitbucket_project: async (scm_obj, bitbucket_url, bitbucket_auth_token) => {

        http_request_options.basic_auth_token = bitbucket_auth_token;
        var request_url = `${bitbucket_url}/rest/api/1.0/projects`;
        http_request_options.request_method='POST';
        var project_req_body = {
            "key": scm_obj.pipeline_key,
            "name": scm_obj.project_name,
            "description": "Project created using DevOps Onboarding Wizard"
        }

        try {

            await http_request.make_request(
                encodeURI(request_url),
                http_request_options.request_method,
                http_request_options.basic_auth_token,
                http_request_options.proxy_flag,
                http_request_options.req_token,
                http_request_options.url_suffix,
                project_req_body)

            return "success";
        }
        catch (error) {

            throw new Error(error.message);

        }

    },
    create_bitbucket_repo: async (scm_obj, bitbucket_url, bitbucket_auth_token) => {
        http_request_options.basic_auth_token = bitbucket_auth_token;
        var request_url = `${bitbucket_url}/rest/api/1.0/projects/${scm_obj.pipeline_key}/repos`;
        var repo_name = scm_obj.repository_name;
        var project_req_body = {
            "name": repo_name,
            "scmId": "git",
            "forkable": true
        }

        try {
            await http_request.make_request(
                encodeURI(request_url),
                http_request_options.request_method,
                http_request_options.basic_auth_token,
                http_request_options.proxy_flag,
                http_request_options.req_token,
                http_request_options.url_suffix,
                project_req_body)

            var bitbucket_repo_url = (`${bitbucket_url}/scm/${scm_obj.pipeline_key}/${repo_name}.git`)
                .toLowerCase();
            return bitbucket_repo_url;
        }
        catch (error) {
            throw new Error(error.message);

        }

    },
    create_bitbucket_repo_webhook: async (scm_obj, bitbucket_url, bitbucket_auth_token) => {
        http_request_options.basic_auth_token = bitbucket_auth_token;
        var request_url = `${bitbucket_url}/rest/api/1.0/projects/${scm_obj.pipeline_key}/repos/${scm_obj.repository_name}/webhooks`;
        var project_req_body = {
            "name": "CANVAS DevOps Key - " + scm_obj.pipeline_key,
            "url": `${process.env.SERVICE_URL}/api/pipeline/webhook/scm/bitbucket`,
            "events": [
                "repo:modified",
                "repo:refs_changed",
                "pr:deleted",
                "pr:opened",
                "pr:merged"
            ],
            "enabled": true
        }

        try {
               await http_request.make_request(
                encodeURI(request_url),
                http_request_options.request_method,
                http_request_options.basic_auth_token,
                http_request_options.proxy_flag,
                http_request_options.req_token,
                http_request_options.url_suffix,
                project_req_body)


            return "success";
        }
        catch (error) {
            throw error;

        }

    }
}
