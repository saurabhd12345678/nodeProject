var pipeline = require('../../models/pipeline');
var application = require('../../models/application');
var user = require('../../models/user');
var generate_pipeline_key = require('./generate_pipeline_key');
var logger = require('../../configurations/logging/logger');

module.exports = {
    save_pipeline_details: async (pipeline_details, pipeline_key) => {
        var pipe_data, pipeline_id;
        let pipeline_type = pipeline_details.pipeline_type == undefined ? "PIPELINE_STANDARD" : pipeline_details.pipeline_type;
        try {
            pipe_data = await pipeline.findOneAndUpdate({
                "pipeline_key": pipeline_key
            }, {
                "$set": {
                    "pipeline_name": pipeline_details.pipeline_name,
                    "pipeline_key": pipeline_key,
                    "application_key": pipeline_details.application_key,
                    "pipeline_description": pipeline_details.pipeline_description,
                    "pipeline_type": pipeline_type
                },
            }, { upsert: true, setDefaultsOnInsert: true, new: true })
            pipeline_id = pipe_data._id;
            try {
                let application_name = await module.exports.save_pipeline_in_application(pipeline_details.application_key, pipeline_id);
                if (application_name.length != 0) {
                    try {
                        return pipeline_key
                      //  data_saved_to_user = await module.exports.save_pipeline_in_user(pipeline_details.user_name, pipeline_key, pipeline_details.pipeline_name, application_name);
                        // if (data_saved_to_user == "success") {
                        //     return (pipeline_key);
                        // }
                    }
                    catch (error) {

                        throw new Error(error.message);
                    }
                }
            }
            catch (error) {

                throw new Error(error.message);
            }
        }
        catch (error) {
            logger.error('error.message save info = ', error.message);
            let err = new Error(error.message);
            throw err;
        }
    },
    /**
     * application_key,pipeline_id
     */
    save_pipeline_in_application: async (application_key, pipeline_id) => {
        try {
            let application_name
            var application_data = await application.findOneAndUpdate(
                { 'application_key': application_key },
                {
                    "$push": {
                        "pipelines": pipeline_id
                    }
                },
                {
                    upsert: true, new: true
                })
            application_name = application_data.application_name;
            return (application_name);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    save_pipeline_in_user: async (user_name, pipeline_key, pipeline_name, application_name) => {
        try {
            await user.findOneAndUpdate(
                { 'user_name': user_name, 'user_allocation.application_name': application_name },
                {
                    "$push": {
                        "user_allocation.$.pipelines": {
                            "pipeline_key": pipeline_key,
                            "pipeline_name": pipeline_name
                        }
                    }
                }, { new: true }
            )
            return ("success");
        } catch (error) {
            throw new Error(error.message);
        }
    },

    getPipelineDetails: async (pipeline_key) => {
        try {


            var pipeline_details = await pipeline.aggregate([
                {
                    $match:
                    {
                        pipeline_key: pipeline_key
                    }

                },

                {
                    $project: {
                        "pipeline_name": 1,
                        "pipeline_description": 1,
                        "pipeline_key": 1,
                        "application_key": 1,
                        "onboarded": 1,
                        //plan
                        "plan.creation_status": 1,
                        "plan.configured": 1,
                        "plan.tool_project_name": 1,
                        "plan.instance_details.tool_name": 1,
                        "plan.instance_details.instance_name": 1,
                        "plan.is_sync": 1,
                        //scm
                        "scm.creation_status": 1,
                        "scm.configured": 1,
                        "scm.repo_name": 1,
                        "scm.tool_project_name": 1,
                        "scm.instance_details.tool_name": 1,
                        "scm.instance_details.instance_name": 1,
                        "scm.branch_name": 1,
                        "scm.is_sync": 1,
                        //code_quality
                        "code_quality.creation_status": 1,
                        "code_quality.configured": 1,
                        "code_quality.tool_project_name": 1,
                        "code_quality.instance_details.tool_name": 1,
                        "code_quality.instance_details.instance_name": 1,
                        "code_quality.is_sync": 1,
                        //code_security
                        "code_security.creation_status": 1,
                        "code_security.configured": 1,
                        "code_security.tool_project_name": 1,
                        "code_security.instance_details.tool_name": 1,
                        "code_security.instance_details.instance_name": 1,
                        "code_security.is_sync": 1,
                        //artifactory
                        "artifactory.creation_status": 1,
                        "artifactory.configured": 1,
                        "artifactory.tool_project_name": 1,
                        "artifactory.instance_details.tool_name": 1,
                        "artifactory.instance_details.instance_name": 1,
                        "artifactory.is_sync": 1,
                        //continuous_integration
                        "continuous_integration.creation_status": 1,
                        "continuous_integration.configured": 1,
                        "continuous_integration.tool_project_name": 1,
                        "continuous_integration.instance_details.tool_name": 1,
                        "continuous_integration.instance_details.instance_name": 1,
                        "continuous_integration.is_sync": 1,

                    }
                }
            ])
            return (pipeline_details);
        }
        catch (error) {
            throw error;
        }

    },
    save_tool_in_application: async (application_key, tool_name, tool_instance_name) => {
        await application.findOneAndUpdate({ 'application_key': application_key }).lean();



    },
    getPipelineType: async (pipeline_key) => {
        
        var pipeline_data = await pipeline.findOne({pipeline_key:pipeline_key}).lean();
        
        //console.log("debugging Goutham ", pipeline_data);
        if(pipeline_data!= null){
        return pipeline_data.pipeline_type;
        }
        else{
            return pipeline_data;
        }
        
    }
}