var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var ecr = new AWS.ECR({apiVersion: '2015-09-21'});

module.exports={
    get_repositories:async()=>{
        
        try{
            var repositories = await ecr.describeRepositories({}).promise();
          
            return repositories;
        }catch(err){
            throw new Error(err.message);
        }
      
    },
    describe_repository:async(repo_name)=>{
        var repository_names =[];
        repository_names.push(repo_name);
        try{
            var repository_details = await ecr.describeRepositories({repositoryNames:repository_names}).promise();
            return repository_details;
        }catch(err){
            throw new Error(err.message);
        }
    }
}
