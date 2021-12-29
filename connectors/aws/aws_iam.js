var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var iam = new AWS.IAM({apiVersion: '2010-05-08'});

module.exports={
    get_iam_roles:async()=>{
        var params = {
            // Marker: 'STRING_VALUE',
            // MaxItems: 'NUMBER_VALUE',
            // PathPrefix: 'STRING_VALUE'
          };
        try{
            var iam_roles = await iam.listRoles().promise();
            return iam_roles;
        }catch(err){
            throw new Error(err.message);
        }
    }
}
