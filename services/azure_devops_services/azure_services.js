const { response } = require('express');
var unirest = require('unirest');
var planning_datas = require("../../models/planning_data");
var application_data = require('../../models/application');
var tool_detail = require('../../models/tool');
var sprints = require("../../models/sprint")
var token_method = require("../../service_helpers/verify_token");
const { forEach } = require('async');
const application_list = require('../../service_helpers/application_list');
var tool = require('../../models/tool');
var Application = require('../../models/application');
const azure_sync_projects = require('../../connectors/azure_devops/azure_project_sync');
var azure_create_webhook = require('../../connectors/azure_devops/azure_create_webhook');
const existing_planning_projects = require('../../models/existing_planning_projects');





var unirest = require('unirest');


module.exports.sync_azure_projects = async (
    tool_info
) => {

    var azure_projects = await azure_sync_projects.fetch_project_azureboards(
        tool_info
    );
    return azure_projects;
},

    // get_azure_projects: async () => {
    //     let projects_array = []

    //     try {

    //         var req = await unirest('GET', 'https://dev.azure.com/democanvasdevops/_apis/projects?api-version=6.0')
    //             .headers({
    //                 'Authorization': 'Basic OnB6eHNnamdjMnNxeGo3dXdtNXRvY29lb3YyejR2dGFxY2d0Z3M2bjRzMmM3d2Z5NHpuc3E=',
    //             })

    //             .then((response) => {
    //                 projects_array = response.raw_body
    //             })

    //         return projects_array;
    //     }
    //     catch (error) {
    //         throw new Error(error.message);
    //     }
    // },

    module.exports.save_plan_azure_application = async (plan_obj) => {
        try {


            let applicationData = await Application.findOne({ "application_key": plan_obj.application_key })

            let tool_detail = await tool.findOne({ "tool_instance_name": plan_obj.instance_name, "application_key": plan_obj.application_key })

            let plandatas = await existing_planning_projects.findOneAndUpdate({ "tool_id": tool_detail._id },
                {
                    "$set":
                    {
                        "planning_tool": tool_detail.tool_name,
                        "planning_project_id": plan_obj.project_key,
                        "planning_project_key": plan_obj.project_key,
                        "planning_project_name": plan_obj.project_name,
                        "planning_self": (`${tool_detail.tool_url}/_apis/projects/${plan_obj.project_key}`)
                    }
                },
                { upsert: true, new: true }
            )

            let planArray = [];
            let checkFlag = true



            let planObject = {

                "creation_status": "SUCCESS",

                "project_url": (`${tool_detail.tool_url}/${plan_obj.project_name}`),

                // "project_url":" https://dev.azure.com/democanvasdevops/CanvasdevOpsxAzuredevOps",
                //.toLowerCase(),
                "configured": true,//create=true
                "tool_project_key": plan_obj.project_key,
                "tool_project_name": plan_obj.project_name,
                "create_webhook": plan_obj.create_webhook,
                "instance_details": {
                    "tool_name": tool_detail.tool_name,
                    "instance_name": tool_detail.tool_instance_name,
                    "instance_id": tool_detail._id,
                    "tool_roles": []

                }
            }

            if (plan_obj.create_webhook) {
                await module.exports.create_azure_webhooks(plan_obj.project_key, tool_detail.tool_url, tool_detail.tool_auth.auth_token)
            }
            planArray.push(planObject)


            let result = await Application.findOneAndUpdate({
                "application_key": plan_obj.application_key
            },
                {
                    $set: {
                        plan: planArray
                    }
                }, {
                upsert: true
            })

            return "success";

        }
        catch (err) {

            err = new Error(`Error Updating project ${project_key}`)
            throw err;

        }
    }


module.exports.delete_azure_webhook = async (project_id, azure_url, azure_auth_token) => {
    try {
        var result = await azure_create_webhook.delete_azure_project_webhook(project_id, azure_url, azure_auth_token)

        return result;
    }
    catch (err) {

        throw error;


    }
}

module.exports.create_azure_webhooks = async (project_id, azure_url, azure_auth_token) => {
    try {
        var update = await azure_create_webhook.update_azure_project_webhook(project_id, azure_url, azure_auth_token)
        var create = await azure_create_webhook.create_azure_project_webhook(project_id, azure_url, azure_auth_token)
        var del = await azure_create_webhook.delete_azure_project_webhook(project_id, azure_url, azure_auth_token)

        return "Success";
    }
    catch (err) {

        throw error;

    }
}

module.exports.update_azure_webhook = async (project_id, azure_url, azure_auth_token) => {
    try {
        var result = await azure_create_webhook.update_azure_project_webhook(project_id, azure_url, azure_auth_token)

        return result;
    }
    catch (err) {

        throw error;
    }
}


const get_workitem_id_from_project = async (project_name, azure_auth_token, tool_url) => {
    let workitem_id_array = []
    var project = `'${project_name}'`
    try {

        var unirest = require('unirest');
        var req = await unirest('POST', `${tool_url}/${project_name}/_apis/wit/wiql?api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token, //OmV3d3N6Zmx2a2d3NTN4eG5mN2tqcXR6YjRnbmRraHVkd212enJoamg1bHlybm43YjZ0a3E=
                'Content-Type': 'application/json',
            })
            .send(JSON.stringify({
                "query": `SELECT [Id] from WorkItems WHERE [System.TeamProject] = ${project}`
            }))
            .then((response) => {
                workitem_id_array = response.body.workItems

            });
        return workitem_id_array;


    }
    catch (error) {
        throw new Error(error.message);
    }
}

const get_sprint_details = async (project_name, tool_url, azure_auth_token) => {
    let team_name;

    try {
        var unirest = require('unirest');
        var req = await unirest('GET', `${tool_url}/_apis/projects/${project_name}?api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
                //'Cookie': 'VstsSession=%7B%22PersistentSessionId%22%3A%223d0f2606-4edd-4ac9-be72-6fdbb8bd5a6d%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22SignInState%22%3A%7B%7D%7D'
            })
            .then((response) => {
                team_name = response.body.defaultTeam.name

            })
        
            return team_name;
    }
    catch (error) {
        return "failure";
        //throw new Error(error.message);
    }

}

const get_sprint_data = async (team_name, tool_url, azure_auth_token) => {
    let sprint_data = [];

    try {
        8
        var unirest = require('unirest');
        var req = await unirest('GET', `${tool_url}/_apis/projects/${team_name}?api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
                'Cookie': 'VstsSession=%7B%22PersistentSessionId%22%3A%227a94c867-10f9-4be3-b113-617ce9b50d89%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22SignInState%22%3A%7B%7D%7D'
            })
            .then((response) => {
                sprint_data = response.body

            })
        return sprint_data;

    }
    catch (error) {
        throw new Error(error.message);
    }

}

const get_sprints_list = async (project_name, team_name, tool_url, azure_auth_token) => {
    let sprints_list = [];

    try {
        var unirest = require('unirest');
        var req = await unirest('GET', `${tool_url}/${project_name}/${team_name}/_apis/work/teamsettings/iterations?api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
                'Cookie': 'VstsSession=%7B%22PersistentSessionId%22%3A%227a94c867-10f9-4be3-b113-617ce9b50d89%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22SignInState%22%3A%7B%7D%7D'
            })
            .then((response) => {
                sprints_list = response.body

            })
        return sprints_list;

    }
    catch (error) {
        throw new Error(error.message);
    }

}

const getspillover = async (work_id, project_name, azure_auth_token, tool_url, application_key) => {

    let respppp = [];
    let spill = false;
    // let azuretoken = new Buffer.from(':' + azure_auth_token).toString('base64');
    // https://dev.azure.com/democanvasdevops/Sprints-Project/_apis/wit/workItems/20/updates/?api-version=6.1-preview.3
    var req = await unirest('GET', `${tool_url}/${project_name}/_apis/wit/workItems/${work_id}/updates/?api-version=6.1-preview.3`)
        .headers({
            'Authorization': 'Basic' + " " + azure_auth_token,
            'Cookie': 'VstsSession=%7B%22PersistentSessionId%22%3A%22fe6411d8-025a-40a9-9bf9-654da7e84f96%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22SignInState%22%3A%7B%7D%7D'

        })
        .then(async (response) => {
            resp = response.body

            try {
                for await (res of resp.value) {

                    if (res.fields["System.IterationPath"] == undefined) {
                        spill = false
                    }
                    else if (res.fields["System.IterationPath"].oldValue != undefined) {
                        spill = true;
                    }
                    else {
                        spill = false
                    }
                }
            }
            catch (error) {
                spill = false;
            }
        });
    return spill;

}

const get_workitem_from_ids = async (temporary_workitem, project_name, azure_auth_token, tool_url, application_key) => {
    let workitem_details = [];
    let diffDays = 0;
    // try{

    // await planning_datas.deleteMany({reporter:"ABCDEF"});
    // }
    // catch (error) {
    //     ("ERROR", error)
    //     throw new Error(error.message);
    // }
    try {
        var unirest = require('unirest');
        var req = await unirest('GET', `${tool_url}/${project_name}/_apis/wit/workitems?ids=${temporary_workitem}&api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
            })
            .then(async (response) => {
                workitem_details = response.body

                for await (current_item of workitem_details.value) {
                    if (current_item.fields["System.State"] == "Done") {
                        let activated_date = new Date(workitem_details.value[0].fields["Microsoft.VSTS.Common.ActivatedDate"]);
                        let closed_date = new Date(workitem_details.value[0].fields["Microsoft.VSTS.Common.ClosedDate"]);

                        if (activated_date != undefined || closed_date != undefined) {
                            var diffTime = Math.abs(closed_date - activated_date);
                            diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                        }

                    }
                    let issue_type = current_item.fields["System.WorkItemType"];
                    if (issue_type.trim() == "ISSUE") {
                        issue_type = "STORY";

                    }
                    var azure_planning_data = {

                        "issue_story_points": current_item.fields["Microsoft.VSTS.Scheduling.StoryPoints"],
                        "issue_sprint": "",
                        "timeoriginalestimate": current_item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"],
                        "timespent": current_item.fields["Microsoft.VSTS.Scheduling.Effort"],
                        "issue_wastage_days": 0,
                        "issue_type": issue_type,
                        "issue_name": current_item.fields["System.Title"],
                        "issue_desc": (current_item.fields['System.Description'] == undefined) ? "description" : current_item.fields['System.Description'], //.slice(5, current_item.fields["System.Description"].length - 5)
                        "application_key": application_key,
                        "issue_id": current_item.id,
                        "issue_key": current_item.id,
                        "actual_start_date": current_item.fields["Microsoft.VSTS.Scheduling.StartDate"],
                        "actual_end_date": current_item.fields["Microsoft.VSTS.Scheduling.FinishDate"],
                        "assigned_to": (current_item.fields['System.AssignedTo'] == undefined) ? "none" : current_item.fields['System.AssignedTo'].displayName,
                        "reporter": (current_item.fields['Microsoft.VSTS.CodeReview.AcceptedBy'] == undefined) ? "none" : current_item.fields['Microsoft.VSTS.CodeReview.AcceptedBy'].displayName,
                        "issue_status": current_item.fields["System.State"],
                        "completionTime": diffDays,
                        "phase": (current_item.fields['Microsoft.VSTS.Common.Activity'] == undefined) ? "none" : current_item.fields['Microsoft.VSTS.Common.Activity'],
                    }

                    await planning_datas.create(azure_planning_data)
                }
            });
        return "Success";
    }
    catch (error) {

        throw new Error(error.message);
    }
}
module.exports.getProjectAreas = async (tool_info) => {
    try {
        var azure_areas = await application_list.getAzureProjectAreas(
            tool_info
        );
        return azure_areas;

    } catch (error) {
        throw new Error(error.message);

    }
},

    module.exports.
        get_work_item_id_azure = async (application_key) => {

            temporary_workitem = "";
            let azure_updates;
            let spill_over = false;
            try {

                let resp = await application_data.findOne({
                    "application_key": application_key,
                })

                let tool_details = await tool_detail.findOne({
                    "application_key": application_key, tool_name: "Azure Boards"
                }).lean();
                azure_auth_token = new Buffer.from(
                    ':' +
                    tool_details.tool_auth.auth_password
                ).toString('base64');


                let project_name = resp.plan[0].tool_project_name;
                let tool_url = tool_details.tool_url;

                let team_name = await get_sprint_details(project_name, tool_url, azure_auth_token);
                let workitem_ids = await get_workitem_id_from_project(project_name, azure_auth_token, tool_url);
                workitem_ids.forEach((element, index) => {
                    if (index == (workitem_ids.length - 1)) {
                        temporary_workitem = temporary_workitem + element.id
                    }
                    else {
                        temporary_workitem = temporary_workitem + element.id + ","
                    }
                });
                var workitem_details_by_id = await get_workitem_from_ids(temporary_workitem, project_name, azure_auth_token, tool_url, application_key);
                if (workitem_details_by_id == "Success") {
                    let items = await planning_datas.find({ application_key: application_key });
                    for await (let item of items) {

                        await unirest('GET', `${tool_url}/${project_name}/_apis/wit/workItems/${item.issue_id}/updates/?api-version=6.1-preview.3`)
                            .headers({
                                'Authorization': 'Basic' + " " + azure_auth_token,
                            })
                            .then((response) => {
                                azure_updates = response.body.value
                            });

                        for await (let update of azure_updates) {
                            if (update.fields["System.State"] != undefined) {

                                if (update.fields["System.State"].newValue == "To Do") {
                                    createdAtDate = new Date(update.fields["System.CreatedDate"].newValue);
                                }
                                else if (update.fields["System.State"].newValue == "Doing" && update.fields["System.State"].oldValue == "To Do") {
                                    doingDate = new Date(update.fields["System.ChangedDate"].newValue);
                                    let lt = Math.abs(doingDate - createdAtDate);

                                    let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

                                    await planning_datas.findOneAndUpdate(
                                        { application_key: application_key, issue_id: item.issue_id },
                                        {
                                            $set: {
                                                lT: diffDay
                                            }
                                        },
                                        { upsert: true });
                                    // latencyTime_array.push(diffDay);

                                }
                                if (update.fields["System.State"].newValue == "Done" && update.fields["System.State"].oldValue == "Doing") {
                                    doneDate = new Date(update.fields["System.ChangedDate"].newValue);
                                    let pt = Math.abs(doneDate - doingDate);

                                    let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));
                                    await planning_datas.findOneAndUpdate(
                                        { application_key: application_key, issue_id: item.issue_id },
                                        {
                                            $set: {
                                                pT: diffDays
                                            }
                                        },
                                        { upsert: true });

                                    // processingTime_array.push(diffDays);

                                }
                            }
                        }

                    }

                }
                // for checking whether work item is spilled over or not
                for await (let work_id of workitem_ids) {
                    spill_over = await getspillover(work_id.id, project_name, azure_auth_token, tool_url, application_key);
                    await planning_datas.findOneAndUpdate({ issue_id: work_id.id, application_key: application_key }, { isSpillOver: spill_over });
                }

                let sprint_list = await get_sprints_list(project_name, team_name, tool_url, azure_auth_token);


                for await (sprint of sprint_list.value) {
                    let epic = [], bug = [], story = [], task = [];
                    //calling the api which will get workitem-ids by sprint id

                    // let sprint_id = sprint.id;               
                    let work_item_ids_as_per_sprint = await get_work_item_ids_as_per_sprint_id(project_name, team_name, tool_url, azure_auth_token, sprint.id);

                    for await (let workitem_id of work_item_ids_as_per_sprint) {

                        let target_data = await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { issue_sprint: sprint.name } });
                        if (target_data.issue_type == "EPIC") {
                            epic.push(workitem_id.target.id)
                            await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { sprint_id: sprint.id });

                        }
                        else if (target_data.issue_type == "BUG") {
                            bug.push(workitem_id.target.id)
                            await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { sprint_id: sprint.id });

                        }
                        else if (target_data.issue_type == "TASK") {
                            task.push(workitem_id.target.id)
                            await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { sprint_id: sprint.id });

                        }

                        else {
                            story.push(workitem_id.target.id)
                            //    to be removed
                            await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { issue_type: "STORY" }, sprint_id: sprint.id });
                        }

                    }

                    //use for loop for those workitems and find the type of workitem from planning_data


                    let azure_sprints_data = {
                        "self": sprint.url,
                        "bugs": bug,
                        "end_date": sprint.attributes.finishDate,
                        "epics": epic,
                        "sprint_active": sprint.attributes.timeFrame == "current" ? true : false,
                        "sprint_id": sprint.id,
                        "sprint_logical_name": sprint.name,
                        "start_date": sprint.attributes.startDate,
                        "stories": story,
                        "tasks": task,
                        "application_key": application_key,
                        "tool_project_key": project_name
                    }
                    await sprints.create(azure_sprints_data);
                    //try to implement findoneandupdate
                }

                return "success";
            }

            catch (error) {
                throw new Error(error.message);
            }

        }


const get_work_item_ids_as_per_sprint_id = async (project_name, team_name, tool_url, azure_auth_token, sprint_id) => {

    let workitem_list = [];

    try {



        var response = await unirest('GET', `${tool_url}/${project_name}/${team_name}/_apis/work/teamsettings/iterations/${sprint_id}/workitems?api-version=6.0-preview.1`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
                'Cookie': 'VstsSession=%7B%22PersistentSessionId%22%3A%223d0f2606-4edd-4ac9-be72-6fdbb8bd5a6d%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22SignInState%22%3A%7B%7D%7D'
            })

        workitem_list = response.body

        return workitem_list.workItemRelations



    }
    catch (error) {

        throw new Error(error.message);
    }






}

module.exports.update_work_item_azure = async (application_key) => {
    let project_name;
    temporary_workitem = "";
    let spill_over = false;

    try {

        let resp = await application_data.findOne({
            "application_key": application_key,
        })

        let tool_details = await tool_detail.findOne({
            "application_key": application_key, tool_name: "Azure Boards"
        })
        azure_auth_token = new Buffer.from(
            ':' +
            tool_details.tool_auth.auth_password
        ).toString('base64');


        project_name = resp.plan[0].tool_project_name;
        let tool_url = tool_details.tool_url;
        let team_name = await get_sprint_details(project_name, tool_url, azure_auth_token);
        if (team_name == "failure") {
            return "failure";
        }
        let items = await planning_datas.find({ application_key: application_key });
        try {
            for await (let item of items) {

                await unirest('GET', `${tool_url}/${project_name}/_apis/wit/workItems/${item.issue_id}/updates/?api-version=6.1-preview.3`)
                    .headers({
                        'Authorization': 'Basic' + " " + azure_auth_token,
                    })
                    .then((response) => {
                        azure_updates = response.body.value
                    });

                for await (let update of azure_updates) {
                    if (update.fields["System.State"] != undefined) {
                        if (update.fields["System.State"].newValue == "To Do") {
                            createdAtDate = new Date(update.fields["System.CreatedDate"].newValue);
                        }
                        else if (update.fields["System.State"].newValue == "Doing" && update.fields["System.State"].oldValue == "To Do") {
                            doingDate = new Date(update.fields["System.ChangedDate"].newValue);
                            let lt = Math.abs(doingDate - createdAtDate);

                            let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

                            await planning_datas.findOneAndUpdate(
                                { application_key: application_key, issue_id: item.issue_id },
                                {
                                    $set: {
                                        lT: diffDay
                                    }
                                },
                                { upsert: true });
                            // latencyTime_array.push(diffDay);

                        }
                        if (update.fields["System.State"].newValue == "Done" && update.fields["System.State"].oldValue == "Doing") {
                            doneDate = new Date(update.fields["System.ChangedDate"].newValue);
                            let pt = Math.abs(doneDate - doingDate);

                            let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));
                            await planning_datas.findOneAndUpdate(
                                { application_key: application_key, issue_id: item.issue_id },
                                {
                                    $set: {
                                        pT: diffDays
                                    }
                                },
                                { upsert: true });

                            // processingTime_array.push(diffDays);

                        }
                    }
                }

            }
        }
        catch (error) {
            throw error
        }




        let workitem_ids = await get_workitem_id_from_project(project_name, azure_auth_token, tool_url);
        workitem_ids.forEach((element, index) => {
            if (index == (workitem_ids.length - 1)) {
                temporary_workitem = temporary_workitem + element.id
            }
            else {
                temporary_workitem = temporary_workitem + element.id + ","
            }
        });
        var workitem_details_by_id = await update_workitem_from_ids(temporary_workitem, project_name, azure_auth_token, tool_url, application_key);

        // for checking whether work item is spilled over or not
        for await (let work_id of workitem_ids) {
            spill_over = await getspillover(work_id.id, project_name, azure_auth_token, tool_url, application_key);
            await planning_datas.findOneAndUpdate({ issue_id: work_id.id, application_key: application_key }, { $set: { isSpillOver: spill_over } }, { upsert: true });
        }

        let sprint_list = await get_sprints_list(project_name, team_name, tool_url, azure_auth_token);

        for await (sprint of sprint_list.value) {
            let epic = [], bug = [], story = [], task = [];
            //calling the api which will get workitem-ids by sprint id

            // let sprint_id = sprint.id;               
            let work_item_ids_as_per_sprint = await get_work_item_ids_as_per_sprint_id(project_name, team_name, tool_url, azure_auth_token, sprint.id);

            for await (let workitem_id of work_item_ids_as_per_sprint) {

                let target_data = await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { issue_sprint: sprint.name } }, { upsert: true });
                if (target_data.issue_type == "EPIC") {
                    epic.push(workitem_id.target.id)
                    await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { sprint_id: sprint.id } }, { upsert: true });

                }
                else if (target_data.issue_type == "BUG") {
                    bug.push(workitem_id.target.id)
                    await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { sprint_id: sprint.id } }, { upsert: true });

                }
                else if (target_data.issue_type == "TASK") {
                    task.push(workitem_id.target.id)
                    await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { sprint_id: sprint.id } }, { upsert: true });

                }
                else if (target_data.issue_type == "STORY") {
                    story.push(workitem_id.target.id)
                    await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { sprint_id: sprint.id } }, { upsert: true });

                }

                else {
                    story.push(workitem_id.target.id)
                    //    to be removed
                    await planning_datas.findOneAndUpdate({ issue_id: workitem_id.target.id, application_key: application_key }, { $set: { issue_type: "STORY" }, sprint_id: sprint.id }, { upsert: true });
                }

            }

            //use for loop for those workitems and find the type of workitem from planning_data


            let azure_sprints_data = {
                "self": sprint.url,
                "bugs": bug,
                "end_date": sprint.attributes.finishDate,
                "epics": epic,
                "sprint_active": sprint.attributes.timeFrame == "current" ? true : false,
                "sprint_id": sprint.id,
                "sprint_logical_name": sprint.name,
                "start_date": sprint.attributes.startDate,
                "stories": story,
                "tasks": task,
                "application_key": application_key,
                "tool_project_key": project_name
            }
            // await sprints.create(azure_sprints_data);
            //try to implement findoneandupdate
            var i = await sprints.findOneAndUpdate(
                { application_key: application_key, sprint_id: sprint.id },
                {
                    $set: {
                        "self": sprint.url,
                        "bugs": bug,
                        "end_date": sprint.attributes.finishDate,
                        "epics": epic,
                        "sprint_active": sprint.attributes.timeFrame == "current" ? true : false,
                        "sprint_id": sprint.id,
                        "sprint_logical_name": sprint.name,
                        "start_date": sprint.attributes.startDate,
                        "stories": story,
                        "tasks": task,
                        "application_key": application_key,
                        "tool_project_key": project_name
                    }
                },
                { upsert: true }
            );
        }

        return "success";
    }

    catch (error) {

        throw new Error(error.message);
    }

}

const update_workitem_from_ids = async (temporary_workitem, project_name, azure_auth_token, tool_url, application_key) => {
    let workitem_details = [];
    let diffDays = 0;
    // try{

    // await planning_datas.deleteMany({reporter:"ABCDEF"});
    // }
    // catch (error) {
    //     ("ERROR", error)
    //     throw new Error(error.message);
    // }
    try {


        var unirest = require('unirest');
        var req = await unirest('GET', `${tool_url}/${project_name}/_apis/wit/workitems?ids=${temporary_workitem}&api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
            })
            .then(async (response) => {
                workitem_details = response.body

                for await (current_item of workitem_details.value) {

                    if (current_item.fields["System.State"] == "Done") {
                        let activated_date = new Date(workitem_details.value[0].fields["Microsoft.VSTS.Common.ActivatedDate"]);
                        let closed_date = new Date(workitem_details.value[0].fields["Microsoft.VSTS.Common.ClosedDate"]);

                        if (activated_date != undefined || closed_date != undefined) {
                            var diffTime = Math.abs(closed_date - activated_date);
                            diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                        }

                    }

                    let issue_type = current_item.fields["System.WorkItemType"];
                    if (issue_type.trim() == "ISSUE") {
                        issue_type = "STORY";

                    }
                    var azure_planning_data = {

                        "issue_story_points": current_item.fields["Microsoft.VSTS.Scheduling.StoryPoints"],
                        "issue_sprint": "",
                        "timeoriginalestimate": current_item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"],
                        "timespent": current_item.fields["Microsoft.VSTS.Scheduling.Effort"],
                        "issue_wastage_days": 0,
                        "issue_type": issue_type,
                        "issue_name": current_item.fields["System.Title"],
                        "issue_desc": (current_item.fields['System.Description'] == undefined) ? "description" : current_item.fields['System.Description'], //.slice(5, current_item.fields["System.Description"].length - 5)
                        "application_key": application_key,
                        "issue_id": current_item.id,
                        "issue_key": current_item.id,
                        "actual_start_date": current_item.fields["Microsoft.VSTS.Scheduling.StartDate"],
                        "actual_end_date": current_item.fields["Microsoft.VSTS.Scheduling.FinishDate"],
                        "assigned_to": (current_item.fields['System.AssignedTo'] == undefined) ? "none" : current_item.fields['System.AssignedTo'].displayName,
                        "reporter": (current_item.fields['Microsoft.VSTS.CodeReview.AcceptedBy'] == undefined) ? "none" : current_item.fields['Microsoft.VSTS.CodeReview.AcceptedBy'].displayName,
                        "issue_status": current_item.fields["System.State"],
                    }

                    await planning_datas.findOneAndUpdate({ application_key: application_key, issue_id: current_item.id },
                        {
                            $set: {
                                "issue_story_points": current_item.fields["Microsoft.VSTS.Scheduling.StoryPoints"],
                                "issue_sprint": "",
                                "timeoriginalestimate": current_item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"],
                                "timespent": current_item.fields["Microsoft.VSTS.Scheduling.Effort"],
                                "issue_wastage_days": 0,
                                "issue_type": issue_type,
                                "issue_name": current_item.fields["System.Title"],
                                "issue_desc": (current_item.fields['System.Description'] == undefined) ? "description" : current_item.fields['System.Description'], //.slice(5, current_item.fields["System.Description"].length - 5)
                                "application_key": application_key,
                                "issue_id": current_item.id,
                                "issue_key": current_item.id,
                                "actual_start_date": current_item.fields["Microsoft.VSTS.Scheduling.StartDate"],
                                "actual_end_date": current_item.fields["Microsoft.VSTS.Scheduling.FinishDate"],
                                "assigned_to": (current_item.fields['System.AssignedTo'] == undefined) ? "none" : current_item.fields['System.AssignedTo'].displayName,
                                "reporter": (current_item.fields['Microsoft.VSTS.CodeReview.AcceptedBy'] == undefined) ? "none" : current_item.fields['Microsoft.VSTS.CodeReview.AcceptedBy'].displayName,
                                "issue_status": current_item.fields["System.State"],
                                "completionTime": diffDays,
                                "phase": (current_item.fields['Microsoft.VSTS.Common.Activity'] == undefined) ? "none" : current_item.fields['Microsoft.VSTS.Common.Activity'],
                            }
                        },
                        { upsert: true }
                    );
                }
            });
        return "Success";
    }
    catch (error) {

        throw new Error(error.message);
    }
}

module.exports.getDetailsOfWorkItem = async (temporary_workitem, project_name, azure_auth_token, tool_url) => {
    try {
        var diffDays;
        var unirest = require('unirest');
        var req = await unirest('GET', `${tool_url}/${project_name}/_apis/wit/workitems?ids=${temporary_workitem}&api-version=6.0`)
            .headers({
                'Authorization': 'Basic ' + azure_auth_token,
            })
            .then(async (response) => {
                workitem_details = response.body

                if (workitem_details.value[0].fields["System.State"] == "Done") {
                    let activated_date = new Date(workitem_details.value[0].fields["Microsoft.VSTS.Common.ActivatedDate"]);
                    let closed_date = new Date(workitem_details.value[0].fields["Microsoft.VSTS.Common.ClosedDate"]);
                    var diffTime = Math.abs(closed_date - activated_date);
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                }
            }
            );
        return diffDays;
    }
    catch (error) {

        throw new Error(error.message);
    }
}






