var http_request = require("../../service_helpers/HTTP-Request/http_request");
var dotenv = require("dotenv");
dotenv.config();

var http_request_options = {
  request_method: "GET",
  basic_auth_token: "",
  proxy_flag: false,
  req_token: false,
  url_suffix: "",
};

module.exports = {
  getBitbucketKpi: async (
    projectKey,
    repositorySlug,
    bitbucket_url,
    bitbucket_auth_token,
    kpi
  ) => {
    http_request_options.basic_auth_token = bitbucket_auth_token;
    var request_url = `${bitbucket_url}/rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/${kpi}?limit=1000`;

    try {
      var result = await http_request.make_request(
        encodeURI(request_url),
        http_request_options.request_method,
        http_request_options.basic_auth_token,
        http_request_options.proxy_flag,
        http_request_options.req_token,
        http_request_options.url_suffix
      );
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
