var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

module.exports={
            
    get_vpc:async()=>{
        try{
            var aws_vpcs = await ec2.describeVpcs({}).promise();
            return aws_vpcs;
        }catch(err){
            throw new Error(err.message);
        }
      
    },
    get_subnets:async(vpc_id)=>{
        var subnet_params={
            Filters: [
                {
               Name: "vpc-id", 
               Values: [
                vpc_id
               ]
              }
             ]
        };
        try{
            var aws_subnets = await ec2.describeSubnets(subnet_params).promise();
            return aws_subnets;
        }catch(err){
            throw new Error(err.message);
        }
    },
    get_securityGroups:async(vpc_id)=>{
        var params={
            Filters: [
                {
                  Name: 'vpc-id',
                  Values: [
                    vpc_id,
                    /* more items */
                  ]
                },
                /* more items */
              ]
        }
        try{
            var aws_securityGroups = await ec2.describeSecurityGroups(params).promise();
            return aws_securityGroups;
        }catch(err){
            throw new Error(err.message);
        }
    }
}
