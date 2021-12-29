var http_request = require('../../service_helpers/HTTP-Request/http_request');
var dotenv = require('dotenv');
dotenv.config();
var unirest = require('unirest');

// let http_request_options = {
//     request_method: 'POST',
//     basic_auth_token: "",
//     proxy_flag: false,
//     req_token: false,
//     url_suffix: ""
// }


module.exports = {
    create_azurerepos_project: async (scm_obj, azurerepos_url, azurerepos_auth_token) => {

       // http_request_options.basic_auth_token = azurerepos_auth_token;

        let token = new Buffer.from(
            ':' +
            azurerepos_auth_token
        ).toString('base64');
        // var request_url = `${azurerepos_url}/${scm_obj.Organisation_name}/_apis/projects?api-version=6.0`;
        try {
            await unirest('POST', `${azurerepos_url}/${scm_obj.Organisation_name}/_apis/projects?api-version=6.0`)
                .headers({
                    'Authorization': 'Basic' + token,
                    'Content-Type': 'application/json',
                })
                .send(JSON.stringify({
                    "name": scm_obj.project_name,
                    "visibility": "private",
                    "capabilities":
                    {
                        "versioncontrol":
                            { "sourceControlType": "Git" },
                        "processTemplate": {"templateTypeId":"6b724908-ef14-45cf-84f8-768b5384da45"}
                    }
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
         // create_azurerepos_repo: async (scm_obj, azurerepos_url, azurerepos_auth_token) => {
    //    // http_request_options.basic_auth_token = azurerepos_auth_token;
    //     // var request_url = `${azurerepos_url}/${scm_obj.Organisation_name}/${scm_obj.project_name}/_apis/git/repositories?api-version=6.0`;
    //     // var repo_name = scm_obj.repository_name;
    //     let token = new Buffer.from(
    //         ':' +
    //         azurerepos_auth_token
    //     ).toString('base64');
    //     try {
    //         //var unirest = require('unirest');
    //         await unirest('POST', `${azurerepos_url}/${scm_obj.Organisation_name}/${scm_obj.project_name}/_apis/git/repositories?api-version=6.0`)
    //             .headers({
    //                 'Authorization': 'Basic' + token,
    //                 'Content-Type': 'application/json',
    //             })
    //             .send(JSON.stringify({
    //                 "name": scm_obj.repository_name,
    //                 "parentRepository": scm_obj.project_name,
    //                 "project": scm_obj.project_name
    //             }))
    //             .then((response) => {
    //                 resp = response
    //             });
    //         return resp
    //     }
    //     catch {
    //         throw error;
    //     }
    //}

}