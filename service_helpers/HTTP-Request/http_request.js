var request = require('request');
var path = require("path");
var http_proxy = "http://10618631:Prisha123@airinlxwproxy.nmumarl.lntinfotech.com:8080/";
var urlSuffix = "";
var acceptableStatusCodes = [200, 201, 202, 203, 204, 302];
var self = module.exports = {

    HTTP_METHODS: {
        GET: "GET",
        PUT: "PUT",
        POST: "POST",
        DELETE: "DELETE"
    },



    // Generic request function ===================================
    make_request: (url, requestMethod, basicAuthToken, proxyFlag,
        reqToken = false, urlSuffix = "", reqBody = {}, queryStr = {}, headers) => {
        return new Promise((resolve, reject) => {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

            var requestURL = url + urlSuffix;
            var options = {
                method: requestMethod,
                url: requestURL,
                rejectUnhauthorized: false,
                qs: queryStr,
                json: true,
                timeout: 120000
            };

            if(  headers != undefined )
            {
                options.json=headers.is_json?true:false;
            }

            if(  headers != undefined )
            {
                options.json=headers.is_json?true:false;
            }

            if (requestMethod === self.HTTP_METHODS.POST ||
                requestMethod === self.HTTP_METHODS.PUT) {
                options.body = reqBody;


            }

            if (reqToken === false) {

                if (basicAuthToken !== undefined && headers === undefined) {
                    options.headers = {
                        "Authorization": "Basic " + basicAuthToken,
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "X-Atlassian-Token": "no-check"
                    };

                } else {
                    options.headers = {
                        "Authorization": "Basic " + basicAuthToken,
                        "Jenkins-Crumb": headers['Jenkins-Crumb'],
                        "Content-Type": headers['Content-Type'],
                        "Accept": headers['Accept'],
                        "X-Atlassian-Token": "no-check",
                        'Cookie': headers['Cookie']

                    };


                }
            }
            else {

                // if (basicAuthToken !== undefined && headers === undefined) {
                    options.headers = {
                        "Authorization": "Bearer " + basicAuthToken,
                        "X-ExperimentalApi": "opt-in",
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    };
                // }
                // } else {
                //     options.headers = {
                //         "Authorization": "Bearer " + basicAuthToken,
                //         "X-ExperimentalApi": "opt-in",
                //         "Accept": "application/json",
                //         "Content-Type": "application/json"
                //     };
                

                // }
            }

            if (proxyFlag === true) {
                options.proxy = http_proxy;
                options.strictSSL = false;
            }
        
            request(options, (error, response, body) => {

                //no error
                if (!error &&
                    (acceptableStatusCodes.indexOf(response.statusCode) >= 0)) {
                       var cookie;
                    if (response.headers["set-cookie"] != undefined)
                    {
                        cookie=response.headers["set-cookie"][0]
                    }
                    var result = {
                        "status_code": response.statusCode,
                        "body": body,
                        "cookie": cookie
                    };

                    return resolve(result);

                } else {

                    var errorBody = JSON.stringify(body);
                    if (!error) {
                        error = new Error(`${response.statusCode} : ${errorBody}`);
                    }
                    var return_object;
                    if (response != undefined || response != null) {
                        if (response.statusCode) {
                            return_object = {
                                "status_code": response.statusCode,
                                "error": error
                            }
                        }
                        else {
                            return_object = {
                                "status_code": 500,
                                "error": error
                            }
                        }
                    }
                    else {
                        return_object = {
                            "status_code": 500,
                            "error": error
                        }
                    }
                    return reject(return_object);
                }

            }); //end post request

        });


    },





    make_request_urlencoded: (url, requestMethod, proxyFlag, urlencodedForm,
        reqToken = false, urlSuffix = "", reqBody = {}, queryStr = {}, headers) => {

        return new Promise((resolve, reject) => {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

            var requestURL = url + urlSuffix;
            var options = {
                method: requestMethod,
                url: requestURL,
                rejectUnhauthorized: false,
                qs: queryStr,
                json: true,
                form: urlencodedForm
            };

            if (requestMethod === self.HTTP_METHODS.POST ||
                requestMethod === self.HTTP_METHODS.PUT) {
                options.body = reqBody;


            }

            if (proxyFlag === true) {
                options.proxy = http_proxy;
                options.strictSSL = false;
            }

            options.headers = {

                "X-ExperimentalApi": "opt-in",
                "Accept": "*/*",
                "Content-Type": "application/x-www-form-urlencoded"
            };

            //make_request

            request(options, (error, response, body) => {

                //no error
                if (!error &&
                    (acceptableStatusCodes.indexOf(response.statusCode) >= 0)) {

                    var result = body;

                    return resolve(result);

                } else {
                    var errorBody = JSON.stringify(body);
                    if (!error) {
                        error = new Error(`${response.statusCode} : ${errorBody}`);
                    }


                    return reject(error);
                }

            }); //end post request

        });


    }
    // End Generic request function ===================================


}