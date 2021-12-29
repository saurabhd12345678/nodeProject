var fs = require('fs');
var path = require('path');
var pipeline = require('../models/pipeline');
var child_process = require('child_process');
var spawn = require('child_process').spawn;
var hashicorp_vault_helper = require("../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../connectors/hashicorp-vault/read_secret");
var flag = 0;
module.exports = {
    runGitCommands :function (bitbucketURL, project_name,user_name,password) {

        return new Promise(function (resolve, reject) {
            let appRoot = process.cwd();
            let jsonPath = path.join(appRoot, 'gitCommand.bat');
            //let jsonPath = path.join(appRoot, 'gitCommand.sh');
             const bat = child_process.spawn(jsonPath, [bitbucketURL, project_name,user_name,password]);

            bat.stdout.on('data', (data) => {
                // this will display the steps it performs in script

            });
            bat.stderr.on('data', (data) => {
                flag = 1;

            });
            let exitCode = new Promise(function (resolve, reject) {
                bat.on('exit', (code) => {
                    resolve(code);
                });
            }).then(data => {
                resolve(data);
            });

        });
    },
    pushFilesToBitbucket : async(pipeline_key, scm_obj, tool_details) => {
        // return new Promise(function (resolveMain, reject) {
        //     var toolPromise = new Promise((resolve, reject) => {
            let temp_url
            let final_repo_url
        try{
          let pipeline_detail = await
                pipeline.aggregate([
                    {
                        "$match": { pipeline_key: pipeline_key }
                    },
                    {
                        $unwind: "$scm"
                    },
                    {
                        $unwind: "$scm.instance_details"
                    },
                    {
                        $lookup: {
                            from: "tools",
                            localField: "scm.instance_details.instance_id",
                            foreignField: "_id",
                            as: "tool_data"
                        }
                    },
                    {
                        $unwind: "$tool_data"
                    }, {
                        $project: {
                            '_id': 1,
                            'tool_auth': "$tool_data.tool_auth",
                            'repo_url': "$scm.repo_url",
                            'tool_project_name': "$scm.tool_project_name"
                        }
                    }
                ])
                // .then(resp =>{
                //     resolve(resp);
                // }).catch(err =>{
                //     reject(err);
            //     // })
            // })
            // toolPromise.then(pipeline_detail => {
                let pipeline_details = pipeline_detail[0];


                let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
                    tool_details.application_key
                  );


                if(vault_config_status == true)
                {

                    let vault_configuration = await hashicorp_vault_config.read_tool_secret(
                        tool_details.application_key,
                        tool_details.tool_category,
                        tool_details.tool_name,
                        tool_details.tool_instance_name
                      );
                      if (vault_configuration.auth_type == "password") {

                        let repo_url = pipeline_details.repo_url;
                        let user_name = vault_configuration.auth_username;
                        let password = vault_configuration.auth_password
                        temp_url = repo_url.split("//");

                        final_repo_url = `${temp_url[0]}//${user_name}:${password}@${temp_url[1]}`;
                        await module.exports.runGitCommands(final_repo_url, pipeline_details.tool_project_name,user_name,password)
                        // .then(data => {
                        //     resolveMain(data);
                        // });

                      }

                }
                else{

                if (pipeline_details.tool_auth.auth_type == "password") {
                    let repo_url = pipeline_details.repo_url;
                    let user_name = pipeline_details.tool_auth.auth_username;
                    let password = pipeline_details.tool_auth.auth_password;
                     temp_url = repo_url.split("//");

                    final_repo_url = `${temp_url[0]}//${user_name}:${password}@${temp_url[1]}`;
                    await module.exports.runGitCommands(final_repo_url, pipeline_details.tool_project_name,user_name,password)
                    // .then(data => {
                    //     resolveMain(data);
                    // });

                }
            }
            // }

            // )

        // });
        }
        catch(e){
           throw e
        }
    }

}

