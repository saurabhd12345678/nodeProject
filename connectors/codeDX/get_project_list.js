
var unirest = require('unirest');
var HTTPRequest = require('../../service_helpers/HTTP-Request/http_request');


var HTTPRequestOptions = {
  requestMethod: "",
  basicAuthToken: "",
  proxyFlag: false,
  reqToken: false,
  urlSuffix: ""
};



// var finding_table_data = [];
module.exports = {
  getProjectList: async (codedx_tool) => {

    try {
      var codedx_auth_token = '';


      let header = {
        "Content-Type": contentType,
        // "Authorization": codedx_auth_token,

      }
      if (codedx_tool.tool_auth.auth_type == 'password') {

        codedx_auth_token = "Basic " + Buffer.from(codedx_tool.tool_auth.auth_username + ":" + codedx_tool.tool_auth.auth_password).toString("base64");
        header["Authorization"] = codedx_auth_token;


      } else {

        // codedx_auth_token = "Bearer " + Buffer.from( codedx_tool.tool_auth.token ).toString("base64");
        header["API-Key"] = codedx_tool.tool_auth.auth_token;

      }
      var contentType = 'application/json';
      HTTPRequestOptions.requestMethod = 'GET'
      var fetched_results = await unirest(
        'GET',
        `${codedx_tool.tool_url}/api/projects`
      )
        .headers(header)
        .send(
          JSON.stringify({


          })
        )
      return (fetched_results.raw_body);
    }
    catch (error) {
      return (error.status_code);
    }


  },
}
