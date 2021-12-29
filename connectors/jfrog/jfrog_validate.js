var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require("unirest");

module.exports = {
    validate: async(jfrog_tool)=>{
        try{
            var jfrog_auth_token='';
            if (jfrog_tool.tool_auth.auth_type == 'password') {

         
                jfrog_auth_token = "Basic " + Buffer.from( jfrog_tool.tool_auth.auth_username + ":" + jfrog_tool.tool_auth.auth_password ).toString("base64");
            } else {
               
                jfrog_auth_token = "Bearer " + Buffer.from( jfrog_tool.tool_auth.auth_username + ":" + jfrog_tool.tool_auth.auth_password ).toString("base64");
            }
            var contentType = 'application/json';
            HTTPRequestOptions.requestMethod='GET'

            var fetched_results = await unirest(
                'GET',
                `${jfrog_tool.tool_url}/artifactory/artifactory-build-info/`
              )
                .headers({
                  "Content-Type": contentType,
                  "Authorization": jfrog_auth_token,
        
                })
                .send(
                  JSON.stringify({
                    
                  
                  })
                )
 return(fetched_results.status);
        }
        catch(error){
            return(error.status_code);
        }
    }
}