var http_request = require("../../service_helpers/HTTP-Request/http_request");
var jenkins_crumb_issuer = require("./jenkins_crumb_issuer");

module.exports = {
  buildJob: async (jenkins_url, jenkins_auth_token, job_name) => {
    let HTTPRequestOptions = {
      requestMethod: "POST",
      basicAuthToken: jenkins_auth_token,
      proxyFlag: false,
      reqToken: false,
      urlSuffix: "",
    };
    let crumb = await jenkins_crumb_issuer.issuerJenkinsCrumb(
      jenkins_url,
      jenkins_auth_token
    );

    let headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      [crumb.body.crumbRequestField]: crumb.body.crumb,
      Cookie: crumb.cookie,
      is_json: true,
    };

    // console.log("jenkins_url : ", jenkins_url);
    // console.log("job_name : ", job_name);

    let request_url = `${jenkins_url}/job/${job_name}/build?${crumb.body.crumbRequestField}=${crumb.body.crumb}`;
    try {
      let response = await http_request.make_request(
        encodeURI(request_url),
        HTTPRequestOptions.requestMethod,
        HTTPRequestOptions.basicAuthToken,
        HTTPRequestOptions.proxyFlag,
        HTTPRequestOptions.reqToken,
        HTTPRequestOptions.urlSuffix,
        {},
        {},
        headers
      );

      var jenkins_build_trigger_status = response.status_code;
      var jenkins_build_trigger_res;

      if (jenkins_build_trigger_status == "201") {
        jenkins_build_trigger_res = "SUCCESS";
        // console.log("jenkins build triggered");
      }
       else {
        jenkins_build_trigger_res = "INVALID";
        // console.log("jenkins build not triggered");
      }

      return jenkins_build_trigger_res;
      
    } catch (error) {
      throw new Error(error);
    }
  },

  buildJobWithParameters: async (
    jenkins_url,
    jenkins_auth_token,
    job_name,
    job_parameters
  ) => {
    try {
      let HTTPRequestOptions = {
        requestMethod: "POST",
        basicAuthToken: jenkins_auth_token,
        proxyFlag: false,
        reqToken: false,
        urlSuffix: "",
      };
      let crumb = await jenkins_crumb_issuer.issuerJenkinsCrumb(
        jenkins_url,
        jenkins_auth_token
      );

      let headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        [crumb.body.crumbRequestField]: crumb.body.crumb,
        Cookie: crumb.cookie,
        is_json: true,
      };

      let request_url = `${jenkins_url}/job/${job_name}/buildWithParameters?`;

      // Object.keys(job_parameters).forEach(function (key) {
      //     request_url = request_url.concat(`${key}=${job_parameters[key]}&`);
      // });
      for (let key of Object.keys(job_parameters)) {
        request_url = request_url.concat(`${key}=${job_parameters[key]}&`);
      }
      request_url = request_url.substring(0, request_url.length - 1);

      try {
        await http_request.make_request(
          encodeURI(request_url),
          HTTPRequestOptions.requestMethod,
          HTTPRequestOptions.basicAuthToken,
          HTTPRequestOptions.proxyFlag,
          HTTPRequestOptions.reqToken,
          HTTPRequestOptions.urlSuffix,
          {},
          {},
          headers
        );

        return "success";
      } catch (error) {
        throw new Error(error);
      }
    } catch (error) {
      throw new Error(error);
    }
  },
  getLatestBuildNumber: async (
    jenkins_tool_url,
    jenkins_auth_token,
    job_name
  ) => {
    try {
      let HTTPRequestOptions = {
        requestMethod: "GET",
        basicAuthToken: jenkins_auth_token,
        proxyFlag: false,
        reqToken: false,
        urlSuffix: "",
      };
      let crumb = await jenkins_crumb_issuer.issuerJenkinsCrumb(
        jenkins_tool_url,
        jenkins_auth_token
      );

      let headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        [crumb.body.crumbRequestField]: crumb.body.crumb,
        Cookie: crumb.cookie,
        is_json: true,
      };

      // var request_url = `${jenkins_url}/job/${job_name}/buildWithParameters?`;

      let jenkins_url =
        jenkins_tool_url + "/job/" + job_name + "/" + "/api/json?pretty=true";

      try {
        let latest_build = await http_request.make_request(
          encodeURI(jenkins_url),
          HTTPRequestOptions.requestMethod,
          HTTPRequestOptions.basicAuthToken,
          HTTPRequestOptions.proxyFlag,
          HTTPRequestOptions.reqToken,
          HTTPRequestOptions.urlSuffix,
          {},
          {},
          headers
        );

        // return latest_build.body.lastBuild.number;
        return latest_build.body.nextBuildNumber;
      } catch (error) {
        throw new Error(error);
      }
    } catch (error) {
      return error;
    }
  },
};
