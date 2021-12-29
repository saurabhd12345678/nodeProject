var planning_data = require("../../models/planning_data");
var sprint_data = require("../../models/sprint");
var Pipeline = require("../../models/pipeline");
var Application = require("../../models/application")
const { ApplicationInsights } = require("aws-sdk");

module.exports = {



    saveSprit: async (newSprint) => {
        await sprint_data.findOneAndUpdate(
            { self: newSprint.self },
            newSprint,
            { upsert: true }
        ).then(() => {
            return true;
        })
    },


    webhooksaveSprit: async (sprint) => {

        let new_sprint = new sprint_data({
            sprint_id: sprint.id,
            sprint_logical_name: sprint.name,
            self: sprint.self,
            start_date: sprint.startDate,
            end_date: sprint.endDate,
            complete_date: sprint.completeDate,
            sprint_active: false
        })
        if (sprint.state == "active")
            new_sprint.sprint_active = true;

        await sprint_data.findOneAndUpdate(
            { self: new_sprint.self },
            new_sprint,
            { upsert: true }
        ).then((result) => {

            return true;
        }).catch((e) => {

            throw new Error(error);
        })
    },


    getSpritName: async (sprint_field) => {
        if (sprint_field != null) {
            let length = sprint_field.length;

            let Sprint_data = sprint_field[length - 1];
            let sprint_data_slice = Sprint_data.slice(
                Sprint_data.indexOf("[") + 1,
                Sprint_data.length - 1
            );
            let sprint_name = sprint_data_slice.slice(
                sprint_data_slice.indexOf("name=") + 5,
                sprint_data_slice.indexOf("startDate=") - 1
            );

            // console.log("sprint name : ",sprint_name)
            return sprint_name;

        } else
            return "";

    },

    getPipelinekey: async (project_key) => {

        try {
            // await Pipeline.findOne({ 'plan.tool_project_key': project_key }, { pipeline_key: 1, _id: 0 });
            let pipeline_key = await Pipeline.findOne({ 'plan.tool_project_key': project_key }, { pipeline_key: 1, _id: 0 });
            return pipeline_key.pipeline_key;
        } catch (error) {
            throw new Error(error);
        }
    },

    saveAzureWorkitem: async (issue_data) => {

        try {
            await planning_data.create(issue_data);
            return "Added"
        } catch (error) {
            throw new Error(error);
        }
    },

    addAzureIssueToSprint: async (sprint_name, issuetype, issue_key, application_key, project_key) => {


        try {
            await sprint_data.findOneAndUpdate({ 'sprint_logical_name': sprint_name },
                {
                    $set: {
                        'tool_project_key': project_key,
                        'application_key': application_key

                    }
                }
            )
        } catch (error) {
            throw new Error(error);
        }

        if (issuetype == "Story") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { stories: issue_key }
                }
            )
        } else if (issuetype == "Task") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { tasks: issue_key }
                }
            )
        } else if (issuetype == "Epic") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { epics: issue_key },

                }
            )
        } else if (issuetype == "Bug") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { bugs: issue_key }
                }
            )
        }

    },

    getApplicationKeyPlan: async (tool_project_key) => {

        try {
            // await Pipeline.findOne({ 'plan.tool_project_key': project_key }, { pipeline_key: 1, _id: 0 });
            let application = await Application.findOne({ 'plan.tool_project_key': tool_project_key });
            return application.application_key;
        } catch (error) {
            throw new Error(error);
        }
    },

    getSprintNameByWorkItemId: async (workItem_Id) => {
        try {
            let application = await planning_data.findOne({ 'issue_key': workItem_Id });
            return application.issue_sprint;
        }
        catch (error) {
            throw new Error(error);
        }

    },

    getissuetype: async (workItemId) => {

        try {
            let application = await planning_data.findOne({ 'issue_key': workItemId });
            return application.issue_type;
        }
        catch (error) {
            throw new Error(error);
        }
    },

    getApplication: async (workItem_Id) => {
        try {
            let application = await planning_data.findOne({ 'issue_key': workItem_Id });
            return application;
        }
        catch (error) {
            throw new Error(error);
        }

    },

    getApplicationKeyByWorkItemId: async (workItem_Id) => {
        try {
            let application = await planning_data.findOne({ 'issue_key': workItem_Id });
            return application.application_key;
        }
        catch (error) {
            throw new Error(error);
        }
    },


    getApplicationKeyByAzureProjectName: async (tool_project_name) => {

        try {
            let application = await Application.findOne({ 'plan.tool_project_name': tool_project_name });
            return application.application_key;
        } catch (error) {
            throw new Error(error);
        }
    },



    saveIssue: async (issue, application_key, project_key, sprint_name, webhook_data, sprint_id) => {
        try {
            let time_wastage = 0, actual_start_date, actual_end_date;
            let humanDateFormat, isBacklog;
            let dateObject;
            var isSpillOver = false;
            var customField = issue.fields.customfield_10100;
            var issue_data;
            var phase = "";
            let diffDays = 0;
            let diffTime;
            let end_date;
            let start_date;
            let diffDayLt = 0;
            let diffDaysPt = 0;

            if (issue != undefined) {
                if (issue.fields.status.name == "Developed" || issue.fields.status.name == "Done") {

                    let history = issue.changelog.histories
                    let history_length = history.length;
                    end_date = new Date(issue.changelog.histories[history_length - 1].created);


                    for await (let hist of history) {
                        if (hist.items[0].fromString == "To Do" && hist.items[0].toString == "In-Progress" || hist.items[0].toString == "In Progress") {
                            start_date = new Date(hist.created);

                        }
                    }

                }

                if (start_date != undefined && end_date != undefined) {
                    diffTime = Math.abs(end_date - start_date);
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                }

            }



            try {
                if (issue.fields.customfield_10100 == null) {
                    isSpillOver = false;
                }
                else if (customField == undefined) {
                    isSpillOver = false;
                }
                else if (customField.length > 1) {
                    isSpillOver = true;
                }
                else {
                    isSpillOver = false;
                }
            }



            catch (error) {
                throw error;
            }
            try {
                if (issue.fields.customfield_10800 != null || issue.fields.customfield_10800 != undefined) {
                    if (issue.fields.customfield_10800[0].value != undefined || issue.fields.customfield_10800[0].value != null) {
                        phase = issue.fields.customfield_10800[0].value;
                    }
                    else {
                        phase = "null";
                    }
                }
            }
            catch (error) {
                console.log("cf error", error)
                throw error;
            }
            try {
                // console.log("inside  ltpt try");
                let inProgress_date;
                let recorded_date;
                let issue_created_date = new Date(issue.fields.created);
                let history_of_a_issue = issue.changelog.histories;
                for await (let history of history_of_a_issue) {
                    // console.log("inside  history 1 ");
                    let detail_history = history.items;
                    for (let i = 0; i < detail_history.length; i++) {
                        if (detail_history[i].fromString == "To Do" && detail_history[i].toString == "In Progress") {
                            inProgress_date = new Date(history.created);
                            let lt = Math.abs(inProgress_date - issue_created_date);
                            // console.log("inside  LT");
                            diffDayLt = Math.ceil(lt / (1000 * 60 * 60 * 24));
                            // console.log("inside  LT", diffDayLt);

                            //   latencyTime_array.push(diffDay);

                        }
                        else if (detail_history[i].fromString == "In Progress" && detail_history[i].toString == "Done") {
                            let pt = 0;
                            recorded_date = new Date(history.created);
                         
                            if (recorded_date != undefined && inProgress_date != undefined) {
                                pt = Math.abs(recorded_date - inProgress_date);
                            }
                            // console.log("inside  PT");
                            diffDaysPt = Math.ceil(pt / (1000 * 60 * 60 * 24));
                            // console.log("inside  LT", diffDaysPt);

                            //   processingTime_array.push(diffDays);
                        }
                    }
                }

            }
            catch (error) {
               
                throw error
            }
            // if (issue.fields.timespent > issue.fields.timeoriginalestimate)
            //     time_wastage = issue.fields.timespent - issue.fields.timeoriginalestimate;
            if (webhook_data != "" || issue != null) {
                if (sprint_name == "" || sprint_name == undefined || sprint_name == null) {

                    isBacklog = true;
                }
                else {

                    isBacklog = false;
                }

                let dateObjeactual_end_datect
                if (webhook_data.changelog != null || webhook_data.changelog != undefined) {
                    for await (let item of webhook_data.changelog.items) {
                        if ((item.fromString == "Done" || item.fromString == "To Do") && (item.toString == "In Progress")) {
                            dateObjeactual_end_datect = new Date(webhook_data.timestamp);
                            humanDateFormat = dateObject.toLocaleString()
                            actual_start_date = humanDateFormat;
                            actual_end_date = webhook_data.old_end_date;
                        }
                        else if (item.toString == "Done") {
                            actual_end_date = issue.fields.resolutiondate
                            actual_start_date = webhook_data.old_start_date == "" ? actual_end_date : webhook_data.old_start_date;
                        }
                        else {
                            actual_end_date = webhook_data.old_end_date;
                            actual_start_date = webhook_data.old_start_date;
                        }

                    }

                    issue_data = new planning_data({
                        tool_Project_key: project_key,
                        issue_type: issue.fields.issuetype.name,
                        issue_name: issue.fields.summary,
                        issue_desc: issue.fields.description,
                        application_key: application_key,
                        issue_id: issue.id,
                        issue_key: issue.key,
                        assigned_to: (issue.fields.assignee !== null) ? (issue.fields.assignee.name) : null,
                        reporter: issue.fields.reporter.name,
                        issue_status: issue.fields.status.name,
                        issue_story_points: issue.fields.customfield_10006,
                        issue_sprint: sprint_name,
                        timeoriginalestimate: issue.fields.timeoriginalestimate,
                        timespent: issue.fields.timespent,
                        issue_wastage_days: time_wastage,
                        actual_start_date: actual_start_date,
                        actual_end_date: actual_end_date,
                        isBacklog: isBacklog,
                        sprint_id: sprint_id,
                        isSpillOver: isSpillOver,
                        phase: phase,
                        completionTime: diffDays,
                        lT: diffDayLt,
                        pT: diffDaysPt
                    });

                }
                //when issue is added for first time
                else {
                    issue_data = new planning_data({
                        tool_Project_key: project_key,
                        issue_type: issue.fields.issuetype.name,
                        issue_name: issue.fields.summary,
                        issue_desc: issue.fields.description,
                        application_key: application_key,
                        issue_id: issue.id,
                        issue_key: issue.key,
                        assigned_to: (issue.fields.assignee !== null) ? (issue.fields.assignee.name) : null,
                        reporter: issue.fields.reporter.name,
                        issue_status: issue.fields.status.name,
                        issue_story_points: issue.fields.customfield_10006,
                        issue_sprint: sprint_name,
                        timeoriginalestimate: issue.fields.timeoriginalestimate,
                        timespent: issue.fields.timespent,
                        isBacklog: isBacklog,
                        sprint_id: sprint_id,
                        isSpillOver: isSpillOver,
                        phase: phase,
                        completionTime: diffDays,
                        lT: diffDayLt,
                        pT: diffDaysPt
                    });

                }




            }
            else {
                issue_data = new planning_data({
                    tool_Project_key: project_key,
                    issue_type: issue.fields.issuetype.name,
                    issue_name: issue.fields.summary,
                    issue_desc: issue.fields.description,
                    application_key: application_key,
                    issue_id: issue.id,
                    issue_key: issue.key,
                    assigned_to: (issue.fields.assignee !== null) ? (issue.fields.assignee.name) : null,
                    reporter: issue.fields.reporter.name,
                    issue_status: issue.fields.status.name,
                    issue_story_points: issue.fields.customfield_10006,
                    issue_sprint: sprint_name,
                    timeoriginalestimate: issue.fields.timeoriginalestimate,
                    timespent: issue.fields.timespent,
                    isBacklog: isBacklog,
                    sprint_id: sprint_id,
                    isSpillOver: isSpillOver,
                    phase: phase,
                    completionTime: diffDays,
                    lT: diffDayLt,
                    pT: diffDaysPt
                });
            }



            if (issue_data.issue_type === "Epic") {
                issue_data.issue_name = issue.fields.customfield_10104;
            }
            try {
                await planning_data.create(issue_data).then((result) => {

                    return true;
                }).catch((er) => {
               

                    throw new Error(er);
                });
            } catch (error) {
               

                throw new Error(error);
            }
        }
        catch (error) {
       

            throw new Error(error);
        }
    },
    update_jira_Issue: async (issue, application_key, project_key, sprint_name, webhook_data, sprint_id) => {
        try {
            let time_wastage = 0, actual_start_date, actual_end_date;
            let humanDateFormat, isBacklog;
            let dateObject;
            var isSpillOver = false;
            var customField = issue.fields.customfield_10100;
            var issue_data;
            let phase = "";
            let diffDays = 0;
            let diffTime;
            let end_date;
            let start_date;
            let diffDayLt = 0;
            let diffDaysPt = 0;
            try {
                if (issue.fields.customfield_10100 == null) {
                    isSpillOver = false;
                }
                else if (customField == undefined) {
                    isSpillOver = false;
                }
                else if (customField.length > 1) {
                    isSpillOver = true;
                }
                else {
                    isSpillOver = false;
                }
            }
            catch (error) {
                throw error;
            }
            try {
                if (issue != undefined) {
                    if (issue.fields.status.name == "Developed" || issue.fields.status.name == "Done") {

                        let history = issue.changelog.histories
                        let history_length = history.length;
                        end_date = new Date(issue.changelog.histories[history_length - 1].created);


                        for await (let hist of history) {
                            if (hist.items[0].fromString == "To Do" && hist.items[0].toString == "In-Progress" || hist.items[0].toString == "In Progress") {
                                start_date = new Date(hist.created);

                            }
                        }

                    }

                    if (start_date != undefined && end_date != undefined) {
                        diffTime = Math.abs(end_date - start_date);
                        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    }

                }
            }
            catch (error) {

            }

            try {
                if (issue.fields.customfield_10800 != null || issue.fields.customfield_10800 != undefined) {
                    if (issue.fields.customfield_10800[0].value != undefined || issue.fields.customfield_10800[0].value != null) {
                        phase = issue.fields.customfield_10800[0].value;
                    }
                    else {
                        phase = "null";
                    }
                }
            }
            catch (error) {
                // console.log("cf error", error)
                throw error;
            }
            try {
                // console.log("inside  ltpt try");
                let inProgress_date;
                let recorded_date;
                let issue_created_date = new Date(issue.fields.created);
                let history_of_a_issue = issue.changelog.histories;
                for await (let history of history_of_a_issue) {
                    // console.log("inside  history 1 ");
                    let detail_history = history.items;
                    for (let i = 0; i < detail_history.length; i++) {
                        if (detail_history[i].fromString == "To Do" && detail_history[i].toString == "In Progress") {
                            inProgress_date = new Date(history.created);
                            let lt = Math.abs(inProgress_date - issue_created_date);
                            // console.log("inside  LT");
                            diffDayLt = Math.ceil(lt / (1000 * 60 * 60 * 24));
                            // console.log("inside  LT", diffDayLt);

                            //   latencyTime_array.push(diffDay);

                        }
                        else if (detail_history[i].fromString == "In Progress" && detail_history[i].toString == "Done") {
                            recorded_date = new Date(history.created);
                            let pt = Math.abs(recorded_date - inProgress_date);
                            // console.log("inside  PT");
                            diffDaysPt = Math.ceil(pt / (1000 * 60 * 60 * 24));
                            // console.log("inside  LT", diffDaysPt);

                            //   processingTime_array.push(diffDays);
                        }
                    }
                }

            }
            catch (error) {
                // console.log("LtPt---->", error);
                throw error
            }
            // if (issue.fields.timespent > issue.fields.timeoriginalestimate)
            //     time_wastage = issue.fields.timespent - issue.fields.timeoriginalestimate;

            if (sprint_name == "" || sprint_name == undefined || sprint_name == null) {

                isBacklog = true;
            }
            else {
                isBacklog = false;
            }

            let dateObjeactual_end_datect

            //when issue is added for first time

            issue_data = {
                tool_Project_key: project_key,
                issue_type: issue.fields.issuetype.name,
                issue_name: issue.fields.summary,
                issue_desc: issue.fields.description,
                application_key: application_key,
                issue_id: issue.id,
                issue_key: issue.key,
                assigned_to: (issue.fields.assignee !== null) ? (issue.fields.assignee.name) : null,
                reporter: issue.fields.reporter.name,
                issue_status: issue.fields.status.name,
                issue_story_points: issue.fields.customfield_10006,
                issue_sprint: sprint_name,
                timeoriginalestimate: issue.fields.timeoriginalestimate,
                timespent: issue.fields.timespent,
                isBacklog: isBacklog,
                sprint_id: sprint_id,
                isSpillOver: isSpillOver
            };



            if (issue_data.issue_type === "Epic") {
                issue_data.issue_name = issue.fields.customfield_10104;
            }
            try {


                // await planning_data.create(issue_data).then((result) => {
                await planning_data.findOneAndUpdate(
                    { application_key: application_key, issue_id: issue.id },
                    {
                        $set: {
                            'tool_Project_key': project_key,
                            'issue_type': issue.fields.issuetype.name,
                            'issue_name': issue.fields.summary,
                            'issue_desc': issue.fields.description,
                            'application_key': application_key,
                            'issue_id': issue.id,
                            'issue_key': issue.key,
                            'assigned_to': (issue.fields.assignee !== null) ? (issue.fields.assignee.name) : null,
                            'reporter': issue.fields.reporter.name,
                            'issue_status': issue.fields.status.name,
                            'issue_story_points': issue.fields.customfield_10006,
                            'issue_sprint': sprint_name,
                            'timeoriginalestimate': issue.fields.timeoriginalestimate,
                            'timespent': issue.fields.timespent,
                            'isBacklog': isBacklog,
                            'sprint_id': sprint_id,
                            'isSpillOver': isSpillOver,
                            'phase': phase,
                            'completionTime': diffDays,
                            'lT': diffDayLt,
                            'pT': diffDaysPt
                        }
                    },
                    { upsert: true }
                ).then((result) => {


                    return true;
                }).catch((er) => {

                    throw new Error(er);
                });
            } catch (error) {

                throw new Error(error);
            }
        }
        catch (error) {
            throw new Error(error);
        }
    },


    updateIssue: async (issue, pipeline_key, project_key, sprint_name, webhookdata) => {


        await planning_data.findOne({ 'issue_key': issue.key }).then(async (old_issue) => {

            let old_start_date = old_issue.actual_start_date != null ? old_issue.actual_start_date : "";
            let old_end_date = old_issue.actual_end_date != null ? old_issue.actual_end_date : "";
            webhookdata.old_end_date = old_end_date;
            webhookdata.old_start_date = old_start_date;
            if (old_issue != null) {
                await planning_data.findOneAndDelete({ 'issue_key': issue.key }).then(async (is_delete) => {


                    if (is_delete != null) {


                        if (old_issue.issue_sprint != "") {
                            await module.exports.removeIssueFromSprint(issue.key, issue.fields.issuetype.name, old_issue.issue_sprint);
                        }

                        await module.exports.saveIssue(issue, pipeline_key, project_key, sprint_name, webhookdata);
                        if (sprint_name != "") {
                            await module.exports.addIssueToSprint(sprint_name, issue.fields.issuetype.name, issue.key, pipeline_key, project_key)
                        }

                    }

                })
            }
        });

        return true;

    },


    deleteIssue: async (issue_key, issuetype, sprint_name) => {
        try {

            let temp = await planning_data.findOneAndUpdate({ 'issue_key': issue_key },
                {
                    $set: { 'is_delete': true },
                }
            )

        } catch (error) {
            throw new Error(error);
        }
        await module.exports.removeIssueFromSprint(issue_key, issuetype, sprint_name);

    },


    removeIssueFromSprint: async (issue_key, issuetype, sprint_name) => {
        try {
            if (issuetype == "Story") {
                await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                    {
                        $pull: { stories: issue_key }
                    }
                )
            } else if (issuetype == "Task") {
                await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                    {
                        $pull: { tasks: issue_key }
                    }
                )
            } else if (issuetype == "Epic") {
                await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                    {
                        $pull: { epics: issue_key }
                    }
                )
            } else if (issuetype == "Bug") {
                await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                    {
                        $pull: { bugs: issue_key }
                    }
                )
            }

        }
        catch (error) {
            throw error

        }


    },



    addIssueToSprint: async (sprint_name, issuetype, issue_key, application_key, project_key) => {


        try {
            await sprint_data.findOneAndUpdate({ 'sprint_logical_name': sprint_name },
                {
                    $set: {
                        'tool_project_key': project_key,
                        'application_key': application_key

                    }
                }
            )
        } catch (error) {
            throw new Error(error);
        }

        if (issuetype == "Story") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { stories: issue_key }
                }
            )
        } else if (issuetype == "Task") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { tasks: issue_key }
                }
            )
        } else if (issuetype == "Epic") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { epics: issue_key }
                }
            )
        } else if (issuetype == "Bug") {
            await sprint_data.updateOne({ 'sprint_logical_name': sprint_name },
                {
                    $addToSet: { bugs: issue_key }
                }
            )
        }

    },
    updateWorkItem: async (issue_story_point, issue_key, timespent, issue_status, issue_sprint, timeoriginalestimate, application_key, actual_start_date) => {

        await planning_data.findOneAndUpdate(
            {
                'issue_id': issue_key
            },
            {
                $set: {
                    'issue_story_points': issue_story_point,
                    'issue_sprint': issue_sprint,
                    'timeoriginalestimate': timeoriginalestimate,
                    'timespent': timespent,
                    'application_key': application_key,
                    'actual_start_date': actual_start_date,
                    'issue_status': issue_status,

                },
            }
        )
    },

    updateSprint: async (webhook_data) => {

        let sprint_id = webhook_data.sprint.id;
        let sprintState = false, activated_date;
        if (webhook_data.sprint.state == "active")
            sprintState = true;
        if (typeof webhook_data.sprint.activatedDate == undefined) {
            activated_date = "";
        }
        else {
            activated_date = webhook_data.sprint.activatedDate;
        }
        await sprint_data.findOneAndUpdate(
            {
                'sprint_id': sprint_id
            },
            {
                $set: {
                    'sprint_logical_name': webhook_data.sprint.name,
                    'start_date': webhook_data.sprint.startDate,
                    'end_date': webhook_data.sprint.endDate,
                    'sprint_active': sprintState,
                    'activated_date': activated_date

                },
            }
        )

    },
    save_pipeline_plan_data: async (plan_obj, project_key, tool_details, plan_tool_roles) => {
        try {
            await Pipeline.findOneAndUpdate({
                "pipeline_key": plan_obj.pipeline_key
            }, {
                "$set": {
                    "onboarded": true,
                    "plan": {
                        "creation_status": "SUCCESS",
                        "project_url": (`${tool_details.tool_url}/projects/${project_key}`),
                        "configured": true,
                        "is_sync": true,
                        "tool_project_key": project_key,
                        "tool_project_name": plan_obj.project_name,
                        "instance_details": {
                            "tool_name": tool_details.tool_name,
                            "instance_name": tool_details.tool_instance_name,
                            "instance_id": tool_details._id,
                            "tool_roles": plan_tool_roles
                        }
                    }
                }
            }, { upsert: true })
            return ("success");

        }
        catch (error) {

            let err = new Error(`Error Updating pipline ${pipeline_key}`)
            throw err;
        }
    },
    updateIssueInBacklog: async (webhook_data) => {
        // var sprint_id = webhook_data.sprint.id;
        let sprint_name = webhook_data.sprint.name;
        let issue_details = await planning_data.find({ "sprint_id": webhook_data.sprint.id }, { issue_key: 1, issue_status: 1, isBacklog: 1, actual_start_date: 1, actual_end_date: 1 }).lean();
        try {
            for await (let issue of issue_details) {
                if ((issue.issue_status != "DONE") && (issue.actual_end_date == null || issue.actual_end_date == undefined)) {
                    try {
                        await planning_data.findOneAndUpdate(
                            { "issue_key": issue.issue_key },
                            {
                                "$set": {
                                    'isBacklog': true
                                }
                            }
                        )
                    }
                    catch (error) {
                        throw new Error(error);
                    }

                }
            }
            return "success";
        }
        catch (error) {
            throw new Error(error);
        }

    },
    closeSprint: async (webhook_data) => {
        let sprint_id = webhook_data.sprint.id;
        let complete_date = webhook_data.sprint.completeDate;
        await sprint_data.findOneAndUpdate(
            {
                'sprint_id': sprint_id
            },
            {
                $set: {
                    'sprint_active': false,
                    'complete_date': complete_date
                },
            }
        )

    },
    //works on worklog_created event
    workLogUpdate: async (webhook_data) => {
        let issue_id = webhook_data.worklog.issueId;
        let time_spent = parseInt(webhook_data.worklog.timeSpentSeconds);
        try {
            let old_time_spent = await planning_data.findOne({ issue_id: issue_id }, { timespent: 1 }).lean();
            old_time_spent = old_time_spent.timespent == null ? 0 : old_time_spent.timespent;
            let new_time_stamp = old_time_spent + time_spent;
            await planning_data.findOneAndUpdate(
                {
                    'issue_id': issue_id
                },
                {
                    $set: {
                        'timespent': new_time_stamp
                    }
                }
            )

        }
        catch (error) {
            throw new Error(error);
        }
    },
    jiraWorkLogUpdate: async (webhook_data) => {
        let issue_key = webhook_data.issue.key;
        let time_spent = webhook_data.issue.fields.timespent;
        await planning_data.findOneAndUpdate(
            {
                'issue_key': issue_key
            },
            {
                $set: {
                    'timespent': time_spent
                }
            }
        )
    }
}