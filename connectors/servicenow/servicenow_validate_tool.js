var HTTPRequest = require("../../service_helpers/HTTP-Request/http_request");
module.exports = {
  validate: async (servicenow_tool) => {
    try {
      let servicenow_auth_token
      if (servicenow_tool.tool_auth.auth_type == "password") {
        servicenow_auth_token = new Buffer.from(
          servicenow_tool.tool_auth.auth_username +
            ":" +
            servicenow_tool.tool_auth.auth_password
        ).toString("base64");
      } else {
        servicenow_auth_token = servicenow_tool.tool_auth.auth_token;
      }
      var HTTPRequestOptions = {
        requestMethod: "GET",
        basicAuthToken: servicenow_auth_token,
        proxyFlag: servicenow_tool.proxy_required,
        reqToken: false,
        urlSuffix: "",
      };

      var servicenow_url = servicenow_tool.tool_url + "/api/now/table/incident";

      
      var fetched_results = await HTTPRequest.make_request(
        encodeURI(servicenow_url),
        HTTPRequestOptions.requestMethod,
        HTTPRequestOptions.basicAuthToken,
        HTTPRequestOptions.proxyFlag
      );
      return fetched_results.status_code;
    } catch (error) {
      return error.status_code;
    }
  },
};
