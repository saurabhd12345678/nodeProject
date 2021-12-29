
var unirest = require('unirest');
var finding_table_data = [];
module.exports = {
    getCodeDxFindingTableData: async (project_id,api_key,base_url) => {



        try {
//

      // http://54.87.195.230
          var url = `${base_url}/api/projects/${project_id}/findings/table`


 await unirest('POST', url)
//'a01aa79e-be78-4f38-8df8-17c20ec0a6ce'

  .headers({
    'API-Key': api_key,
    'Content-Type': 'application/json',

  })
  .send(JSON.stringify({}))
  .then((response) => {


    finding_table_data=  response.raw_body;
                })
                return finding_table_data;
        }
        catch (error) {

            throw new Error(error.message);
        }
    },
}