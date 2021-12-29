var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require('unirest');
// module.exports={
//     validate: async(gitlab_tool)=>{
//         try{
//             let gitlab_auth_token
//             if (gitlab_tool.tool_auth.auth_type == 'password') {

//                 gitlab_auth_token = new Buffer.from(
//                     gitlab_tool.tool_auth.auth_username + ':' +
//                     gitlab.tool_auth.auth_password
//                 ).toString('base64');

//             } else {
//                 gitlab_auth_token = gitlab_tool.tool_auth.auth_token;
//             }
//             var HTTPRequestOptions = {
//                 requestMethod: 'GET',
//                 basicAuthToken: gitlab_auth_token,
//                 proxyFlag: gitlab_tool.proxy_required,
//                 reqToken: false,
//                 urlSuffix: ""
//             }
//             var scm_url = `${gitlab_tool.tool_url}/api/v4/issues`;

//             var fetched_results = await HTTPRequest.make_request(encodeURI(scm_url),
//                 HTTPRequestOptions.requestMethod,
//                 HTTPRequestOptions.basicAuthToken,
//                 HTTPRequestOptions.proxyFlag
//             );

//             return(fetched_results.status_code);
//         }
//         catch(error){

//             return(error.status_code);
//         }
//     }
// }
module.exports = {
    validate: async (gitlab_tool) => {
  
            let resp;
            var token = "Bearer" + " " + gitlab_tool.tool_auth.auth_token

            await unirest('GET', `${gitlab_tool.tool_url}/api/v4/issues`)
                .headers({
                    'Authorization': token,
                })
                .then((response) => {
                    resp = response.code
                });
                return resp;
       

    }
}