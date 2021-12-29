var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var ecs = new AWS.ECS({ apiVersion: '2014-11-13' });

module.exports = {
    create_task_definiton: async (task_definition_name,cpu_value,container_name,image,memory_limit,container_port,execution_role_arn) => {
        var create_params = {
            family: task_definition_name,
            requiresCompatibilities: [
                "FARGATE"
            ],
            networkMode: "awsvpc",
            cpu:cpu_value,
            memory:memory_limit,
            executionRoleArn:execution_role_arn,
            containerDefinitions: [
                {
                    name: container_name,
                    image: image,
                    portMappings: [
                        {
                            containerPort: container_port,
                            protocol: 'tcp'
                        },
                    ]
                }
            ]
        }
      
        try{
            let result = ecs.registerTaskDefinition(create_params).promise();
            return result;
        }catch(err){
            throw new Error(err.message);
        }
        


    }
}