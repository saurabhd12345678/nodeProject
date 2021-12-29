var unirest = require('unirest');
const xml2js = require('xml2js');

module.exports.fetch_projects = async (qualys_tool) => {
    let json;
    var qualys_auth_token = new Buffer.from(
        qualys_tool.tool_auth.auth_username + ':' +
        qualys_tool.tool_auth.auth_password
    ).toString('base64');
try{
   let response = await unirest('POST', `https://qualysapi.qg1.apps.qualys.in/qps/rest/3.0/search/was/webapp`)
        .headers({
            'Authorization': 'Basic' + " " + qualys_auth_token
        })
        // .then((response) => {
            resp = response.body;
             await xml2js.parseString(resp, (err, result) => {
                if (err) {
                    throw err;
                }

               json = JSON.stringify(result);
              
            });
           let json_data = JSON.parse(json);
           let qualys_projects = (json_data.ServiceResponse.data[0].WebApp);
          
            
            return (qualys_projects);
        }
    

    catch (error) {
        throw new Error(error.message);
      }
       
}
