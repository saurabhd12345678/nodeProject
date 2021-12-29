var unirest = require('unirest');
const xml2js = require('xml2js');
const qualys_save = require('../../services/pipeline/webhooks/webhook_service');
const qualys_db_save = require('../../services/pipeline/webhooks/webhook_service');
module.exports.fetch_id = async (qualys_tool, pipeline_key) => {

    var qualys_auth_token = new Buffer.from(
        qualys_tool.tool_auth.auth_username + ':' +
        qualys_tool.tool_auth.auth_password
    ).toString('base64');
    try {

        let response = await unirest('POST', 'https://qualysapi.qg1.apps.qualys.in/qps/rest/3.0/search/was/wasscan')
            .headers({
                'Authorization': 'Basic' + " " + qualys_auth_token,
                'Content-Type': 'application/xml'
            })
            .send("<ServiceRequest>\r\n <filters>\r\n <Criteria field=\"status\" operator=\"EQUALS\">FINISHED</Criteria>\r\n <Criteria field=\"webApp.id\" operator=\"EQUALS\">10368459</Criteria> \r\n </filters>\r\n</ServiceRequest>")

        let resp = response.body;
        await xml2js.parseString(resp, (err, result) => {
            if (err) {
                throw err;
            }

            json = JSON.stringify(result);

        });


        let json_data = JSON.parse(json);
        
        let scan_data = json_data.ServiceResponse.data[0].WasScan;

        scan_data.sort((a, b) => {
            let da = new Date(a.launchedDate),
                db = new Date(b.launchedDate);
            return db - da;
        });

        let qualys_data_by_id = await module.exports.fetch_data(scan_data[0].id, qualys_auth_token,pipeline_key);
       
        qualys_db_save.qualys_data_api_save(qualys_data_by_id);
        
        return (qualys_data_by_id);


    }


    catch (error) {
        throw new Error(error.message);
    }

}

module.exports.fetch_data = async (qualys_id, qualys_auth_token) => {

    try {


        let response = await unirest('GET', `https://qualysapi.qg1.apps.qualys.in/qps/rest/3.0/get/was/wasscan/${qualys_id}`)
            .headers({
                'Authorization': 'Basic' + " " + qualys_auth_token
            })

        let resp = response.body;

        await xml2js.parseString(resp, (err, result) => {
            if (err) {
                throw err;
            }

            json = JSON.stringify(result);

        });
        let json_data = JSON.parse(json);
        return (json_data);

    }


    catch (error) {
        throw new Error(error.message);
    }

}