var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var ecs = new AWS.ECS({ apiVersion: '2014-11-13' });
var ec2 = new AWS.EC2({ apiVersion: '2014-11-13' });
module.exports={
    get_clusters:async()=>{

        // AWS.config.update({region: 'us-east-1'});
        //  ecs = new AWS.ECS({ apiVersion: '2014-11-13' });

        // AWS.config.setRe  region="us-east-1";
        //var s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'us-west-2'});
        var list_params ={};
        try{
          var cluster_list = await ecs.listClusters(list_params).promise();
          cluster_list.clusterArns.unshift("Select Option");
   
          return cluster_list;
        }catch(err){
            throw new Error(err.message);
        }   
    },
    run_task:async(cluster_name,family,revision)=>{
        var run_params={
            cluster:cluster_name,
            taskDefinition:`${family}:${revision}`,
            launchType:'EC2',
            count:1
        };
        try{
            var result = ecs.runTask(run_params).promise();
            return result;
        }
        catch(err){
            throw new Error(err.message);
        }
    },
    describe_container_instances:async()=>{
        var params = {
            cluster: "arn:aws:ecs:us-east-1:421775237038:cluster/ecs-test-1", 
            containerInstances: [
               "arn:aws:ecs:us-east-1:421775237038:container-instance/ecs-test-1/10a4c0c290684985b25c3d0eeb4adb4e"
            ]
           };
        try{
            var result = ecs.describeContainerInstances(params).promise();
            return result;
        }
        catch(err){
            throw new Error(err.message);
        }
    },
    describe_ec2_instance:async()=>{
        var params = {
            InstanceIds: [
               "i-0506e81156a66a4b0"
            ]
           };
        try{
            var result = ec2.describeInstances(params).promise();
            return result;
        }
        catch(err){
            throw new Error(err.message);
        }
    },
    run_task_fargate:async(cluster_name,family,revision,subnet_id,sg_id)=>{
        var run_params={
            cluster:cluster_name,
            taskDefinition:`${family}:${revision}`,
            launchType:'FARGATE',
            count:1,
            networkConfiguration: {
                awsvpcConfiguration: {
                  subnets: [ /* required */
                    subnet_id
                    /* more items */
                  ],
                  assignPublicIp: "ENABLED",
                  securityGroups: [
                    sg_id,
                    /* more items */
                  ]
                }
              }
        };
        try{
            var result = ecs.runTask(run_params).promise();
            return result;
        }
        catch(err){
            throw new Error(err.message);
        }
    }
}