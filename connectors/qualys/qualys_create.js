var http_request = require('../../service_helpers/HTTP-Request/http_request');
var unirest = require('unirest');
var dotenv = require('dotenv');
const xml2js = require('xml2js');
var existing_dast_projects = require('../../models/existing_dast_projects')
dotenv.config();
 

let http_request_options = {
    request_method: 'POST',
    basic_auth_token: "",
    proxy_flag: false,
    req_token: false,
    url_suffix: ""
}


module.exports = {
    create_qualys_project: async (dast_obj, qualys_url, qualys_auth_token,tool_details) => {

        let qualys_project_name = dast_obj.project_name//dast_obj;
        let qualys_project_url = dast_obj. qualys_project_url;// dast_obj
      
        try {


           unirest('POST', `${qualys_url}/qps/rest/3.0/create/was/webapp`)
                .headers({
                    'Authorization': 'Basic' + " " + qualys_auth_token,
                    'Content-Type': 'application/xml'
                })
                .send(`<ServiceRequest>\r\n <data>\r\n <WebApp>\r\n <name><![CDATA[${qualys_project_name}]]></name>\r\n <url><![CDATA[${qualys_project_url}]]></url>\r\n </WebApp>\r\n </data>\r\n</ServiceRequest>`)
                .then(async(response) => {
                    resp = response.body;
                   
                    await xml2js.parseString(resp, (err, result) => {
                        
                        if (err) {
                            throw err;
                        }
                        json = JSON.stringify(result);

                    });
                    let json_data = JSON.parse(json);



  
                  let qualys_project_id = json_data.ServiceResponse.data[0].WebApp[0].id[0];
                   
                    let new_qualys_project = new existing_dast_projects({
                    dast_project_id : qualys_project_id,
                    dast_project_key: qualys_project_id,
                    dast_project_name : qualys_project_name,
                    tool_id: tool_details._id,
                    dast_tool:"Qualys"
                    });

                    await existing_dast_projects.create(new_qualys_project)
                    return "success";
               
                  });

        }
        catch (error) {
         
            throw new Error(error.message);

        }

    },

}
