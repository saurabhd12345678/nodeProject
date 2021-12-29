var applications = require('../../models/application');
var tools = require('../../models/tool');
const application = require('../../models/application');
const existing_scm_users = require('../../models/existing_scm_users');
const existing_planning_users = require('../../models/existing_planning_users');
const existing_code_quality_users = require('../../models/existing_code_analysis_users');
const existing_ci_users = require('../../models/existing_continuous_integration_users');
const pipelines = require('../../models/pipeline');
const jira_project_roles = require('../../connectors/jira/jira_project_role');
const bitbucket_project_role = require('../../connectors/bitbucket/bitbucket_project_role');
const sonarqube_project_role = require('../../connectors/sonarqube/sonarqube_project_role')
const users = require('../../models/user');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const { isError } = require('util');
const { ConnectionStates } = require('mongoose');
var token_method = require("../../service_helpers/verify_token");

   module.exports.get_tools = async (application_key) => {
        try {
            let fetched_application = await applications.findOne({ 'application_key': application_key }).lean();
            let tool_object = [{
                "tool_name": fetched_application.application_name,
                "tool_user_count": fetched_application.users.length,
                "application_key": fetched_application.application_key,
                "is_application": true
            }];
            for await (let tool of fetched_application.tools) {
                tool_object.push({
                    "tool_name": tool.tool_name,
                    "tool_user_count": tool.tool_user_count,
                    "tool_instance_name": tool.tool_instance_name,
                    "is_application": false
                });
            }

            return (tool_object);

        }
        catch (error) {
            throw new Error(error.message);
        }

    },
    module.exports.get_tool_users = async (tool_details) => {
        try {

            if (tool_details.application_key != undefined && tool_details.tool_name == undefined && tool_details.tool_instance_name == undefined) {
                let fetched_application = await applications.findOne({ 'application_key': tool_details.application_key }).lean();
                let application_users = fetched_application.users.map(function (user) {

                    return ({
                        "user_display_name": user.user_display_name,
                        "user_name": user.user_name,
                        "user_roles": user.user_role,
                        "user_mail":user.user_email
                    });
                });
                return (application_users);
            }
            else if (tool_details.application_key != undefined && tool_details.tool_name != undefined && tool_details.tool_instance_name != undefined) {
                let users_object = [];
                for await (let tool_instance of tool_details.tool_instance_name) {
                    let fetched_tool = await tools.findOne({ 'tool_name': tool_details.tool_name, 'application_key': tool_details.application_key, 'tool_instance_name': tool_instance }).lean();
                    for await (let user of fetched_tool.tool_users) {
                        let user_roles = [];
                        for await (let allocation of user.user_allocation) {
                            user_roles = user_roles.concat(allocation.role_name);
                        }
                        user_roles = user_roles.filter((x, i, a) => a.indexOf(x) == i);
                        users_object.push({
                            "user_display_name": user.user_display_name,
                            "user_name": user.user_name,
                            "user_roles": user_roles
                        });
                    }
                }

                return (users_object);
            }
            else {
                throw new Error("Please check your inputs");
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
    },
    module.exports.get_user_detail =  async (application_key, user_name, user_type, tool_name) => {
       
        if (user_type == "application") {
            let fetched_users = await application.findOne({ "application_key": application_key }, { 'users': 1, _id: 0 }).lean();

            let user_details = fetched_users.users.find(fetched_user => fetched_user.user_name == user_name);

            if (user_details != undefined) {
                return user_details
            }
            else {
                throw new Error("User not found in the application");
            }

        }
        else if (user_type == "tool") {
            let fetched_tools = await tools.find({ 'application_key': application_key, 'tool_name': tool_name }, { _id: 0 }).lean();
            let user_details = {
                "user_name": "",
                "user_display_name": "",
                "user_email": "",
                "user_allocation": []

            };
            for await (let fetched_tool of fetched_tools) {
                let user = fetched_tool.tool_users.find(tool_user => tool_user.user_name == user_name);
                if (user != undefined) {
                    user_details["user_name"] = user.user_name;
                    user_details.user_display_name = user.user_display_name;
                    user_details.user_email = user.user_email;
                    user_details.user_allocation.push({
                        "instance_name": fetched_tool.tool_instance_name,
                        "instance_allocations": user.user_allocation
                    });
                }
                else {
                    continue;
                }
            }
            return (user_details);
        }
        else {
            throw new Error("user-type not found");
        }
    },
    module.exports.get_tool_instances = async (application_key, tool_name) => {
        let fetched_tools = await tools.find({ 'application_key': application_key, 'tool_name': tool_name }, { 'tool_instance_name': 1, _id: 0 }).lean();
        let tool_instance_names = fetched_tools.map(fetched_tool => fetched_tool.tool_instance_name);
        if (tool_instance_names.length > 0) {
            return tool_instance_names
        }
        else {
            throw new Error("No Instances Found");
        }
    },
    module.exports.get_fields_info = async (application_key, tool_name, tool_instance_name, user_type) => {
        if (user_type == "application") {
            let fetched_users = await users.find({}, { _id: 0, user_name: 1, user_id: 1, user_mail: 1 }).lean();
            return ({
                "users": fetched_users,
                "roles": ["administrator", "developer"]
            });
        }
        else {
            switch (tool_name.toLowerCase()) {
                case "bitbucket": {
                    let required_tool = await tools.findOne({ 'application_key': application_key, 'tool_name': tool_name, 'tool_instance_name': tool_instance_name }, { _id: 1 }).lean();
                    let existing_users = await existing_scm_users.find({ 'application_key': application_key, 'scm_tool': tool_name, 'tool_id': required_tool._id }).populate({
                        path: 'tool_id',
                        model: 'tool',
                        match: {
                            'tool_instance_name': tool_instance_name
                        }
                    }).lean();
                    let instance_users = existing_users.map(existing_user => {
                        const temp_user = {};
                        temp_user["user_name"] = existing_user.scm_user_name;
                        temp_user["user_display_name"] = existing_user.scm_user_display_name;
                        temp_user["user_email"] = existing_user.scm_user_email;
                        return temp_user;
                    });
                    let fetched_pipelines = await pipelines.find({ 'application_key': application_key, 'scm.instance_details.instance_name': tool_instance_name }).lean();
                    let instance_projects = [];
                    for await (let fetched_pipeline of fetched_pipelines) {
                        let temp_project = {}
                        temp_project["project_name"] = fetched_pipeline.scm.tool_project_name;
                        temp_project["project_key"] = fetched_pipeline.scm.tool_project_key;
                        temp_project["project_roles"] = fetched_pipeline.scm.instance_details.tool_roles;
                        instance_projects.push(temp_project);
                    }
                    return ({
                        "instance_name": tool_instance_name,
                        "instance_users": instance_users,
                        "instance_projects": instance_projects
                    });
                }
                case "jira": {
                    let required_tool = await tools.findOne({ 'application_key': application_key, 'tool_name': tool_name, 'tool_instance_name': tool_instance_name }, { _id: 1 }).lean();
                    let existing_users = await existing_planning_users.find({ 'application_key': application_key, 'planning_tool': tool_name, 'tool_id': required_tool._id }).populate({
                        path: 'tool_id',
                        model: 'tool',
                        match: {
                            'tool_instance_name': tool_instance_name
                        }
                    }).lean();
                    let instance_users = existing_users.map(existing_user => {
                        const temp_user = {};
                        temp_user["user_name"] = existing_user.planning_user_name;
                        temp_user["user_display_name"] = existing_user.planning_user_display_name;
                        temp_user["user_email"] = existing_user.planning_user_email;
                        return temp_user;
                    });
                    let fetched_pipelines = await pipelines.find({ 'application_key': application_key, 'plan.instance_details.instance_name': tool_instance_name }, {}).lean();
                    let instance_projects = [];
                    for await (let fetched_pipeline of fetched_pipelines) {
                        let temp_project = {}
                        temp_project["project_name"] = fetched_pipeline.plan.tool_project_name;
                        temp_project["project_key"] = fetched_pipeline.plan.tool_project_key;
                        temp_project["project_roles"] = fetched_pipeline.plan.instance_details.tool_roles;
                        instance_projects.push(temp_project);
                    }
                    return ({
                        "instance_name": tool_instance_name,
                        "instance_users": instance_users,
                        "instance_projects": instance_projects
                    });
                }
                case "sonarqube": {
                    let required_tool = await tools.findOne({ 'application_key': application_key, 'tool_name': tool_name, 'tool_instance_name': tool_instance_name }, { _id: 1 }).lean();
                    let existing_users = await existing_code_quality_users.find({ 'application_key': application_key, 'code_analysis_tool': tool_name, 'tool_id': required_tool._id }).populate({
                        path: 'tool_id',
                        model: 'tool',
                        match: {
                            'tool_instance_name': tool_instance_name
                        }
                    }).lean();
                    let instance_users = existing_users.map(existing_user => {
                        const temp_user = {};
                        temp_user["user_name"] = existing_user.code_analysis_login;
                        temp_user["user_display_name"] = existing_user.code_analysis_user_name;
                        temp_user["user_email"] = existing_user.code_analysis_user_email;
                        return temp_user;
                    });
                    let fetched_pipelines = await pipelines.find({ 'application_key': application_key, 'code_quality.instance_details.instance_name': tool_instance_name }).lean();
                    let instance_projects = [];
                    for await (let fetched_pipeline of fetched_pipelines) {
                        let temp_project = {}
                        temp_project["project_name"] = fetched_pipeline.code_quality.tool_project_name;
                        temp_project["project_key"] = fetched_pipeline.code_quality.tool_project_key;
                        temp_project["project_roles"] = fetched_pipeline.code_quality.instance_details.tool_roles;
                        instance_projects.push(temp_project);
                    }
                    return ({
                        "instance_name": tool_instance_name,
                        "instance_users": instance_users,
                        "instance_projects": instance_projects
                    });
                }
                case "jenkins": {
                    let required_tool = await tools.findOne({ 'application_key': application_key, 'tool_name': tool_name, 'tool_instance_name': tool_instance_name }, { _id: 1 }).lean();
                    let existing_users = await existing_ci_users.find({ 'application_key': application_key, 'ci_tool': tool_name, 'tool_id': required_tool._id }).populate({
                        path: 'tool_id',
                        model: 'tool',
                        match: {
                            'tool_instance_name': tool_instance_name
                        }
                    }).lean();
                    let instance_users = existing_users.map(existing_user => {
                        const temp_user = {};
                        temp_user["user_name"] = "";
                        temp_user["user_display_name"] = existing_user.ci_user_full_name;
                        temp_user["user_email"] = "";
                        return temp_user;
                    });
                    let fetched_pipelines = await pipelines.find({ 'application_key': application_key, 'continuous_integration.instance_details.instance_name': tool_instance_name }).lean();
                    let instance_projects = [];
                    for await (let fetched_pipeline of fetched_pipelines) {
                        let temp_project = {}
                        temp_project["project_name"] = fetched_pipeline.continuous_integration.job_name;
                        temp_project["project_key"] = fetched_pipeline.continuous_integration.tool_project_key;
                        temp_project["project_roles"] = fetched_pipeline.continuous_integration.instance_details.tool_roles;
                        instance_projects.push(temp_project);
                    }
                    return ({
                        "instance_name": tool_instance_name,
                        "instance_users": instance_users,
                        "instance_projects": instance_projects
                    });
                }
                default: {
                    throw new Error("Tool name doesn't exist");
                }
            }
        }

    },
    module.exports.assign_user = async (user_info) => {
        if (user_info.user_type == "application") {
            let fetched_applications = await applications.findOne({ 'application_key': user_info.application_key, 'users': { $elemMatch: { 'user_name': user_info.user_name } } });
            if (fetched_applications == null) {
                try {
                    let application_user_object = {
                        "user_name": user_info.user_name,
                        "user_display_name": user_info.user_display_name,
                        "user_email": user_info.user_email.toLowerCase(),
                        "user_role": new Array(user_info.project_role_name)
                    }
                    let app = await applications.findOneAndUpdate({ 'application_key': user_info.application_key }, { $push: { 'users': application_user_object } }, { upsert: false, new: true }).lean();
                    let pipes = await pipelines.aggregate([
                        {
                            "$match": {
                                "_id": { $in: app.pipelines }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                pipeline_key: 1,
                                pipeline_name: 1,
                                role_name: []
                            }
                        }]);
                    let user_object = {
                        "role_name": new Array(user_info.project_role_name),
                        "application_key": user_info.application_key,
                        "application_name": app.application_name,
                        pipelines: pipes
                    };
                    let add_user = await users.findOneAndUpdate({
                        'user_id': user_info.user_name,
                        'user_allocation': {
                            "$not": {
                                "$elemMatch": {
                                    "application_name": user_object.application_name
                                }
                            }
                        }
                    },
                        { $push: { 'user_allocation': user_object } });
                    return add_user;
                } catch (err) {

                    throw new Error("User is already assigned a role in the project");
                }
            }
            else {


                throw new Error("User is already assigned a role in the project");
            }
        }
        else {
            switch (user_info.tool_name) {
                case "Jira": {
                    let instance_details = await tools.findOne({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name });
                    user_info["instance_details"] = instance_details;
                    let assignment_status = await jira_project_roles.assign_role(user_info);
                    if (assignment_status != undefined) {
                        let check_user = instance_details.tool_users.find(user => user.user_name == user_info.user_name);
                        if (check_user == undefined) {
                            let update_object = {
                                "user_name": user_info.user_name,
                                "user_email": user_info.user_email,
                                "user_display_name": user_info.user_display_name,
                                "user_allocation": [
                                    {
                                        "role_name": user_info.project_role_name,
                                        "project_name": user_info.tool_project_name,
                                        "project_key": user_info.tool_project_key
                                    }
                                ]
                            }

                          await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name }, {
                                $push: { 'tool_users': update_object }
                            });
                            return "Successfully assigned role to the user";

                        }
                        else {
                            check_user.user_allocation.push({
                                "role_name": user_info.project_role_name,
                                "project_name": user_info.tool_project_name,
                                "project_key": user_info.tool_project_key
                            });
                           await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name, 'tool_users.user_name': user_info.user_name }, {
                                $addToSet: { 'tool_users.$.user_allocation': check_user.user_allocation }
                            });
                            return "Successfully assigned role to the user";
                        }

                    }
                    else {
                        throw new Error("Error assigning role to the user");
                    }
                }
                case "Bitbucket": {
                    let instance_details = await tools.findOne({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name });
                    user_info["instance_details"] = instance_details;
                    let assignment_status = await bitbucket_project_role.assign_role(user_info);
                    if (assignment_status == 204) {
                        let check_user = instance_details.tool_users.find(user => user.user_name == user_info.user_name);
                        if (check_user == undefined) {
                            let update_object = {
                                "user_name": user_info.user_name,
                                "user_email": user_info.user_email,
                                "user_display_name": user_info.user_display_name,
                                "user_allocation": [
                                    {
                                        "role_name": user_info.project_role_name,
                                        "project_name": user_info.tool_project_name,
                                        "project_key": user_info.tool_project_key
                                    }
                                ]
                            }

                            await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name }, {
                                $push: { 'tool_users': update_object }
                            });
                            return "Successfully assigned role to the user";

                        }
                        else {
                            check_user.user_allocation.push({
                                "role_name": user_info.project_role_name,
                                "project_name": user_info.tool_project_name,
                                "project_key": user_info.tool_project_key
                            });
                           await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name, 'tool_users.user_name': user_info.user_name }, {
                                $addToSet: { 'tool_users.$.user_allocation': check_user.user_allocation }
                            });
                            return "Successfully assigned role to the user";
                        }
                    }
                    else {
                        throw new Error("Error assigning role to the user")
                    }

                }
                case "Sonarqube": {
                    let instance_details = await tools.findOne({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name });
                    user_info["instance_details"] = instance_details;
                    //assign role check
                    let assignment_status = await sonarqube_project_role.assign_role(user_info)
                    if (assignment_status == 204) {
                        let check_user = instance_details.tool_users.find(user => user.user_name == user_info.user_name);
                        if (check_user == undefined) {
                            let update_object = {
                                "user_name": user_info.user_name,
                                "user_email": user_info.user_email,
                                "user_display_name": user_info.user_display_name,
                                "user_allocation": [
                                    {
                                        "role_name": user_info.project_role_name,
                                        "project_name": user_info.tool_project_name,
                                        "project_key": user_info.tool_project_key
                                    }
                                ]
                            }

                           await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name }, {
                                $push: { 'tool_users': update_object }
                            });
                            return "Successfully assigned role to the user";

                        }
                        else {
                            check_user.user_allocation.push({
                                "role_name": user_info.project_role_name,
                                "project_name": user_info.tool_project_name,
                                "project_key": user_info.tool_project_key
                            });
                            await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name, 'tool_users.user_name': user_info.user_name }, {
                                $addToSet: { 'tool_users.$.user_allocation': check_user.user_allocation }
                            });
                            return "Successfully assigned role to the user";
                        }
                    }
                    else {
                        throw new Error("Error assigning role to the user")
                    }

                }
                case "Jenkins": {
                    let instance_details = await tools.findOne({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name });
                    user_info["instance_details"] = instance_details;
                    //assign role
                    if (assignment_status == 204) {
                        let check_user = instance_details.tool_users.find(user => user.user_name == user_info.user_name);
                        if (check_user == undefined) {
                            let update_object = {
                                "user_name": user_info.user_name,
                                "user_email": user_info.user_email,
                                "user_display_name": user_info.user_display_name,
                                "user_allocation": [
                                    {
                                        "role_name": user_info.project_role_name,
                                        "project_name": user_info.tool_project_name,
                                        "project_key": user_info.tool_project_key
                                    }
                                ]
                            }

                            await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name }, {
                                $push: { 'tool_users': update_object }
                            });
                            return "Successfully assigned role to the user";

                        }
                        else {
                            check_user.user_allocation.push({
                                "role_name": user_info.project_role_name,
                                "project_name": user_info.tool_project_name,
                                "project_key": user_info.tool_project_key
                            });
                            await tools.findOneAndUpdate({ 'application_key': user_info.application_key, 'tool_instance_name': user_info.tool_instance_name, 'tool_name': user_info.tool_name, 'tool_users.user_name': user_info.user_name }, {
                                $addToSet: { 'tool_users.$.user_allocation': check_user.user_allocation }
                            });
                            return "Successfully assigned role to the user";
                        }
                    }
                    else {
                        throw new Error("Error assigning role to the user")
                    }

                }
                default: {
                    throw new Error("tool name doesn't exist");
                }
            }
        }

    },

    module.exports.save_user_from_organisation = async (user) => {
        try {

            let user_allocation = []
            let userObject = {
                "user_id": user.ps_number,
                "user_name": user.name,
                "user_mail": user.email,
                "user_allocation": user_allocation,
                "user_password":"admin",
                "security_question" : "admin",
                "security_answer" : "admin",

            }
            let check_user = await users.findOne({ "user_id": user.ps_number })
            
            if (check_user == null) {
            
                await users.findOneAndUpdate({ "user_id": user.ps_number }, {
                    $set: userObject
                },
                    {
                        new: true,
                        upsert: true
                    })
             
                return false

            } else {
             
                return true
            }



        } catch (error) {
           
            throw new Error(error.message);
        }

    },
    module.exports.edit_user_information = async (user) => {
        try {

            let updated_role_project = []
            let user_data = await users.findOne({ "user_mail": user.user_mail })

            let user_allocation = user_data.user_allocation


            // await user_allocation.forEach(project => {
            //     if (project.application_key == user.application_key) {

            //         project.role_name[0] = user.role_name

            //     }
            //     updated_role_project.push(project)

            // });
            for await (let project of user_allocation){
                    if (project.application_key == user.application_key) {

                    project.role_name[0] = user.role_name

                }
                updated_role_project.push(project)


            }

            await users.findOneAndUpdate(
                { "user_mail": user.user_mail, "user_allocation.application_key": user.application_key },
                { "user_allocation": updated_role_project }
            )

            let application_data = await application.findOne({ "application_key": user.application_key })
            let users_array = application_data.users
            let updated_user_array = []

            await users_array.filter(userdata => {
                if (userdata.user_email == user.user_mail) {
                    userdata.user_role[0] = user.role_name

                }
                updated_user_array.push(userdata)
            })
           await applications.findOneAndUpdate(
                { "application_key": user.application_key },
                { "users": updated_user_array }
            )


            return "User Data Edited Succesfully"


        } catch (error) {

            throw new Error(error.message);
        }

    },

    module.exports.delete_user_information = async (user) => {
        try {
            let applicationData = await applications.findOne({
                application_key: user.application_key,
              });
            for (let temp of user.user_id_list) {


              let userData = await users.find({ user_id: temp });
              let userArray = [];

              for (let applicationUser of applicationData.users) {
                if (applicationUser.user_name != temp) {
                  userArray.push(applicationUser);
                }
              }

              let userAllocationArray = [];

              for (let userProject of userData[0].user_allocation) {
                if (userProject.application_key != user.application_key) {
                  userAllocationArray.push(userProject);
                }
              }

              await applications.update(
                { application_key: user.application_key },
                {
                  $set: {
                    users: userArray,
                  },
                }
              );

              await users.update(
                { user_id: temp },
                {
                  $set: {
                    user_allocation: userAllocationArray,
                  },
                }
              );


            }
        return "User Succesfully Deleted from Project";} catch (error) {
            throw new Error(error.message);
        }

    }

