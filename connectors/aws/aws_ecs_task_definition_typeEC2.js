var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var ecs = new AWS.ECS({ apiVersion: '2014-11-13' });

module.exports = {
    create_task_definiton: async (task_definition_name,container_name,image,memory,container_port,host_port) => {
        var create_params = {
            family: task_definition_name,
            requiresCompatibilities: [
                "EC2"
            ],
            containerDefinitions: [
                {
                    name: container_name,
                    image: image,
                    memory: memory,
                    portMappings: [
                        {
                            containerPort: container_port,
                            hostPort: host_port,
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