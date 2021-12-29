var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var eks = new AWS.EKS({apiVersion: '2017-11-01'});
module.exports={
    get_clusters:async()=>{
        let list_params={};
        try{
            var cluster_list = await eks.listClusters(list_params).promise();
            return cluster_list;
        }catch(err){
            throw new Error(err.message);
        }   
    }
}