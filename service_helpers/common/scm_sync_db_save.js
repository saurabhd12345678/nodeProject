const logger = require('../../configurations/logging/logger');
var scm_datas = require('../../models/scm_data');
var applications = require('../../models/application');
var tools = require('../../models/tool');
var unirest = require('unirest');

module.exports = {
    saveGitLabCommits: async (commits, scm_obj) => {
        for await (let commit of commits) {
            try {
                let commit_obj = new scm_datas(
                    {
                        type: "COMMIT",
                        commit_id: commit.id,
                        commit_msg: commit.message,
                        commit_author: commit.author_name,
                        commit_timestamp: commit.committed_date,
                        commit_branch: scm_obj.branch_name,
                        commit_project_key: scm_obj.project_data.project_id,
                        commit_project_id: scm_obj.project_data.project_id,
                        pipeline_key: scm_obj.pipeline_key,
                        stats: {
                            additions: commit.stats.additions,
                            deletions: commit.stats.deletions,
                            total: commit.stats.total
                        }
                    });
                scm_datas.create(commit_obj);
            }
            catch (err) {

                logger.error("saveCommits ", err.message);
            }
        }
        return "success";

    },

    updateGitLabCommits: async (commits, scm_obj) => {
           
        for await (let commit of commits) {

            try {
                let commit_obj = new scm_datas(
                    {
                        type: "COMMIT",
                        commit_id: commit.id,
                        commit_msg: commit.message,
                        commit_author: commit.author_name,
                        commit_timestamp: commit.committed_date,
                        commit_branch: scm_obj.branch_name,
                        commit_project_key: scm_obj.tool_project_key,
                        commit_project_id: scm_obj.tool_project_key,
                        pipeline_key: scm_obj.pipeline_key,
                        stats: {

                            additions: commit.stats.additions,

                            deletions: commit.stats.deletions,

                            total: commit.stats.total

                        }
                        // createdAt: commit.createdAt,
                        // updatedAt: commit.updatedAt
                        
                    });
               await scm_datas.findOneAndUpdate({ type: "COMMIT",commit_id: commit.id, pipeline_key: scm_obj.pipeline_key},
                    {
                        $set:{
                            'type': "COMMIT",
                           // 'commit_id': commit.commitId,
                            'commit_msg': commit.message,
                            'commit_author': commit.author_name,
                            'commit_timestamp': commit.committed_date,
                            'commit_branch': scm_obj.branch_name,
                            'commit_project_key': scm_obj.tool_project_key,
                            'commit_project_id': scm_obj.tool_project_key,
                            'pipeline_key': scm_obj.pipeline_key,
                            'stats': {

                                additions: commit.stats.additions,
    
                                deletions: commit.stats.deletions,
    
                                total: commit.stats.total
    
                            }
                            

                        }
                    },
                    {
                        upsert: true
                    }
              
                    );
                    
            }
            
            catch (err) {

                logger.error("saveCommits ", err.message);
            }
        }
        return "success";

    },

    saveazurereposCommits: async (commits, scm_obj) => {
        for await (let commit of commits) {
            try {
                let commit_obj = new scm_datas(
                    {
                        type: "COMMIT",
                        commit_id: commit.commitId,
                        commit_msg: commit.comment,
                        commit_author: commit.author.name,
                        commit_timestamp: commit.author.date,
                        commit_branch: scm_obj.branch_name,
                        stats: {
                            additions: commit.changeCounts.Add,
                            deletions: commit.changeCounts.Delete,
                            edits: commit.changeCounts.Edit,
                            total: commit.changeCounts.Add + commit.changeCounts.Delete + commit.changeCounts.Edit,
                        },
                        commit_project_key: scm_obj.project_data.project_id,
                        commit_project_id: scm_obj.project_data.project_id,
                        pipeline_key: scm_obj.pipeline_key
                    });
                scm_datas.create(commit_obj);
               
            }
            catch (err) {

                logger.error("saveCommits ", err.message);
            }
        }
        return "success";

    },
    UpdateazurereposCommits: async (commits, scm_obj) => {
        for await (let commit of commits) {
            try {
                let commit_obj = new scm_datas(
                    {
                        type: "COMMIT",
                        commit_id: commit.commitId,
                        commit_msg: commit.comment,
                        commit_author: commit.author.name,
                        commit_timestamp: commit.author.date,
                        commit_branch: scm_obj.branch_name,
                        stats: {
                            additions: commit.changeCounts.Add,
                            deletions: commit.changeCounts.Delete,
                            edits: commit.changeCounts.Edit,
                            total: commit.changeCounts.Add + commit.changeCounts.Delete + commit.changeCounts.Edit,
                        },
                        commit_project_key: scm_obj.tool_project_key,
                        commit_project_id: scm_obj.tool_project_key,
                        pipeline_key: scm_obj.pipeline_key
                    });
                await scm_datas.findOneAndUpdate(
                    { commit_id: commit.commitId, pipeline_key: scm_obj.pipeline_key, type: "COMMIT"},
                    {
                        $set:
                        {
                            'type': "COMMIT",
                            'commit_msg': commit.comment,
                            'commit_author': commit.author.name,
                            'commit_timestamp': commit.author.date,
                            'commit_branch': scm_obj.branch_name,
                            'stats': {
                                additions: commit.changeCounts.Add,
                                deletions: commit.changeCounts.Delete,
                                edits: commit.changeCounts.Edit,
                                total: commit.changeCounts.Add + commit.changeCounts.Delete + commit.changeCounts.Edit,
                            },
                            'commit_project_key': scm_obj.tool_project_key,
                            'commit_project_id': scm_obj.tool_project_key,
                            'pipeline_key': scm_obj.pipeline_key
                        }
                    },
                    { upsert: true }
                );
               
            }
            catch (err) {

                logger.error("saveCommits ", err.message);
            }
        }
        return "success";

    },
    saveGitLabWorkflowCommits: async (commits, scm_obj) => {
        for await (let commit of commits) {
            try {
                let commit_obj = new scm_datas(
                    {
                        type: "COMMIT",
                        commit_id: commit.id,
                        commit_msg: commit.message,
                        commit_author: commit.author_name,
                        commit_timestamp: commit.committed_date,
                        commit_branch: scm_obj.branch_name,
                        commit_project_key: scm_obj.project_key,
                        commit_project_id: scm_obj.project_key,
                        pipeline_key: scm_obj.pipeline_key
                    });
                scm_datas.create(commit_obj);
            }
            catch (err) {

                logger.error("saveCommits ", err.message);
            }
        }
        return "success";

    },
    saveCommits: async (commits, scm_obj, scm_auth_token, tool_url) => {
        for await (let commit of commits) {
            let add = [];
            let add_count = 0;
            let update = [];
            let update_count = 0;
            let delete_met = [];
            let delete_count = 0;
            if (commit.parents[0] != undefined) {
                let fetched_commitid = commit.id;
                let parent_id = commit.parents[0].id;
                await unirest('GET', `${tool_url}/rest/api/latest/projects/${scm_obj.project_data.project_key}/repos/${scm_obj.repository_name}/commits/${fetched_commitid}/changes?since=${parent_id}&start=0&limit=1000`)
                    .headers({
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic' + " " + scm_auth_token
                    })
                    .then((response) => {

                        if (response.code == 200) {
                            let data = response.body.values;
                            for (let resp of data) {
                                if (resp.type == "MODIFY") {
                                    update.push(resp.contentId);
                                }
                                else if (resp.type == "ADD") {
                                    add.push(resp.contentId);
                                }
                                else if (resp.type == "DELETE" || resp.type == "DELETED") {
                                    delete_met.push(resp.contentId);

                                }
                            }
                        }
                    });
            }
            add_count = add.length;
            delete_count = delete_met.length;
            update_count = update.length;
            var total_count = add_count + delete_count + update_count;
            
            try {
                let commit_obj = new scm_datas(
                    {
                        type: "COMMIT",
                        commit_id: commit.id,
                        commit_msg: commit.message,
                        commit_author: commit.author.name,
                        commit_timestamp: commit.authorTimestamp,
                        commit_branch: scm_obj.branch_name,
                        commit_project_key: scm_obj.project_data.project_key,
                        commit_project_id: scm_obj.project_data.project_id,
                        pipeline_key: scm_obj.pipeline_key,
                        stats: {
                            additions: add_count,
                            deletions: delete_count,
                            edits: update_count,
                            total: total_count
                        }
                    });
                await scm_datas.findOneAndUpdate(
                    {
                        commit_id: commit.id
                    },
                    {
                        $set: {
                            'type': "COMMIT",
                            'commit_msg': commit.message,
                            'commit_author': commit.author.name,
                            'commit_timestamp': commit.authorTimestamp,
                            'commit_branch': scm_obj.branch_name,
                            'commit_project_key': scm_obj.project_data.project_key,
                            'commit_project_id':  scm_obj.project_data.project_id,
                            'pipeline_key': scm_obj.pipeline_key
                        }
                    },
                    {
                        upsert: true
                    }
                );
               
            }
            catch (err) {
                logger.error("saveCommits ", err.message);
            }
        }
        return "success";
    },
    saveGitlabPull: async (pulls, scm_obj) => {
        try {
            let pull_reviewers_obj = [], status;
            for await (let pull of pulls) {
                try {
                    let closedDate
                    let description
                    // pull.reviewers.forEach(reviewer => {
                    //     pull_reviewers_obj.push(reviewer.user.emailAddress);
                    //     status = reviewer.status;
                    // });
                    // for (let author of pull.author) {
                    //     pull_reviewers_obj.push(author.username);
                    //     status = author.state;
                    // }
                    if (pull.state == 'opened') {
                        closedDate = '';
                    }
                    else {
                        closedDate = pull.closed_at;
                    }
                    if (pull.description == undefined) {
                        description = '';
                    }
                    else {
                        description = pull.description;
                    }
                    let pull_obj = new scm_datas(
                        {
                            type: "PULL",
                            pull_id: pull.iid,
                            pull_project_key: scm_obj.project_data.project_key,
                            pipeline_key: scm_obj.pipeline_key,
                            pull_source: pull.source_branch,
                            pull_destination: pull.target_branch,
                            pull_author: pull.author.username,
                            createdAt: pull.created_at,
                            updatedAt: pull.updated_at,
                            closedAt: closedDate,
                            pull_state: pull.state,
                            pull_status: pull.author.state,
                            pull_title: pull.title,
                            pull_desc: description,
                            pull_reviewers: pull.author.username,
                        });
                    scm_datas.create(pull_obj);
                    pull_reviewers_obj = [];
                }
                catch (err) {

                    logger.error("savePull ", err.message);
                }
            }
            return "success";
        }
        catch (error) {
            throw error
        }
    },

    updateGitlabPull: async (pulls, scm_obj) => {
        try {
            let pull_reviewers_obj = [], status;
            for await (let pull of pulls) {
                try {
                    let closedDate
                    let description
                    // pull.reviewers.forEach(reviewer => {
                    //     pull_reviewers_obj.push(reviewer.user.emailAddress);
                    //     status = reviewer.status;
                    // });
                    // for (let author of pull.author) {
                    //     pull_reviewers_obj.push(author.username);
                    //     status = author.state;
                    // }
                    if (pull.state == 'opened') {
                        closedDate = '';
                    }
                    else {
                        closedDate = pull.closed_at;
                    }
                    if (pull.description == undefined) {
                        description = '';
                    }
                    else {
                        description = pull.description;
                    }
                    let pull_obj = new scm_datas(
                        {
                            type: "PULL",
                            pull_id: pull.iid,
                            pull_project_key: scm_obj.tool_project_key,
                            pipeline_key: scm_obj.pipeline_key,
                            pull_source: pull.source_branch,
                            pull_destination: pull.target_branch,
                            pull_author: pull.author.username,
                            createdAt: pull.created_at,
                            updatedAt: pull.updated_at,
                            closedAt: closedDate,
                            pull_state: pull.state,
                            pull_status: pull.author.state,
                            pull_title: pull.title,
                            pull_desc: description,
                            pull_reviewers: pull.author.username,
                        });
                   await scm_datas.findOneAndUpdate({pull_id: pull.iid, pipeline_key: scm_obj.pipeline_key,type: "PULL"},
                        {
                            $set: {
                            'type': "PULL",
                            'pull_project_key': scm_obj.tool_project_key,
                            'pipeline_key': scm_obj.pipeline_key,
                            'pull_source': pull.source_branch,
                            'pull_destination': pull.target_branch,
                            'pull_author': pull.author.username,
                            'createdAt': pull.created_at,
                            'updatedAt': pull.updated_at,
                            'closedAt': closedDate,
                            'pull_state': pull.state,
                            'pull_status': pull.author.state,
                            'pull_title': pull.title,
                            'pull_desc': description,
                            'pull_reviewers': pull.author.username,
                            }

                        },
                        {
                            upsert: true
                        });
                        
                    pull_reviewers_obj = [];
                }
                catch (err) {

                    logger.error("savePull ", err.message);
                }
            }
            return "success";
        }
        catch (error) {
            throw error
        }
    },
    saveazurereposPull: async (pulls, scm_obj) => {
        try {

            let pull_reviewers_obj = [], status;
            for await (let pull of pulls) {
                try {
                    let closedDate
                    let description
                    // pull.reviewers.forEach(reviewer => {
                    //     pull_reviewers_obj.push(reviewer.user.emailAddress);
                    //     status = reviewer.status;
                    // });
                    // for (let author of pull.author) {
                    //     pull_reviewers_obj.push(author.username);
                    //     status = author.state;
                    // }
                    if (pull.status == 'active') {
                        closedDate = '';
                    }
                    else {
                        closedDate = pull.closed_at;
                    }
                    if (pull.description == undefined) {
                        description = '';
                    }
                    else {
                        description = pull.description;
                    }
                    let pull_obj = new scm_datas(
                        {
                            type: "PULL",
                            pull_id: pull.pullRequestId,
                            pull_project_key: scm_obj.project_data.project_key,
                            pipeline_key: scm_obj.pipeline_key,
                            pull_source: pull.sourceRefName,
                            pull_destination: pull.targetRefName,
                            pull_author: pull.createdBy.displayName,
                            createdAt: pull.creationDate,
                            updatedAt: pull.repository.project.lastUpdateTime,
                            closedAt: closedDate,
                            pull_state: pull.mergeStatus,
                            pull_status: pull.status,
                            pull_title: pull.title,
                            pull_desc: pull.description,
                            pull_reviewers: pull.reviewers,
                        });
                    scm_datas.create(pull_obj);
                    pull_reviewers_obj = [];
                }
                catch (err) {

                    logger.error("savePull ", err.message);
                }
            }
            return "success";
        }
        catch (error) {
            throw error
        }
    },
    updateazurereposPull: async (pulls, scm_obj) => {
        try {

            let pull_reviewers_obj = [], status;
            for await (let pull of pulls) {
                try {

                    let closedDate
                    let description
                    if (pull.status == 'active') {
                        closedDate = '';
                    }
                    else {
                        closedDate = pull.closed_at;
                    }
                    if (pull.description == undefined) {
                        description = '';
                    }
                    else {
                        description = pull.description;
                    }
                    let pull_obj = new scm_datas(
                        {
                            type: "PULL",
                            pull_id: pull.pullRequestId,
                            pull_project_key: scm_obj.tool_project_key,
                            pipeline_key: scm_obj.pipeline_key,
                            pull_source: pull.sourceRefName,
                            pull_destination: pull.targetRefName,
                            pull_author: pull.createdBy.displayName,
                            createdAt: pull.creationDate,
                            updatedAt: pull.repository.project.lastUpdateTime,
                            closedAt: closedDate,
                            pull_state: pull.mergeStatus,
                            pull_status: pull.status,
                            pull_title: pull.title,
                            pull_desc: pull.description,
                            pull_reviewers: pull.reviewers,
                        });
                    await scm_datas.findOneAndUpdate(
                        { pull_id: pull.pullRequestId,pipeline_key: scm_obj.pipeline_key, type: "PULL" },
                        {
                            $set: {
                                'type': "PULL",
                                'pull_project_key': scm_obj.tool_project_key,
                                'pipeline_key': scm_obj.pipeline_key,
                                'pull_source': pull.sourceRefName,
                                'pull_destination': pull.targetRefName,
                                'pull_author': pull.createdBy.displayName,
                                'closedAt': closedDate,
                                'pull_state': pull.mergeStatus,
                                'pull_status': pull.status,
                                'pull_title': pull.title,
                                'pull_desc': pull.description,
                                'pull_reviewers': pull.reviewers
                            }
                        },
                        {
                            upsert: true
                        }
                    );
                    
                    pull_reviewers_obj = [];
                }
                catch (err) {

                    logger.error("savePull ", err.message);
                }
            }
            return "success";
        }
        catch (error) {
            throw error
        }
    },
    saveGitlabWoorkflowPull: async (pulls, scm_obj) => {
        try {
            let pull_reviewers_obj = [], status;
            for await (let pull of pulls) {
                try {
                    let closedDate
                    let description
                    // pull.reviewers.forEach(reviewer => {
                    //     pull_reviewers_obj.push(reviewer.user.emailAddress);
                    //     status = reviewer.status;
                    // });
                    // for (let author of pull.author) {
                    //     pull_reviewers_obj.push(author.username);
                    //     status = author.state;
                    // }
                    if (pull.state == 'opened') {
                        closedDate = '';
                    }
                    else {
                        closedDate = pull.closed_at;
                    }
                    if (pull.description == undefined) {
                        description = '';
                    }
                    else {
                        description = pull.description;
                    }
                    let pull_obj = new scm_datas(
                        {
                            type: "PULL",
                            pull_project_key: scm_obj.project_key,
                            pipeline_key: scm_obj.pipeline_key,
                            pull_source: pull.source_branch,
                            pull_destination: pull.target_branch,
                            pull_author: pull.author.username,
                            createdAt: pull.created_at,
                            updatedAt: pull.updated_at,
                            closedAt: closedDate,
                            pull_state: pull.state,
                            pull_status: pull.author.state,
                            pull_title: pull.title,
                            pull_desc: description,
                            pull_reviewers: pull.author.username,
                        });
                    scm_datas.create(pull_obj);
                    pull_reviewers_obj = [];
                }
                catch (err) {

                    logger.error("savePull ", err.message);
                }
            }
            return "success";
        }
        catch (error) {
            throw error
        }
    },
    savePull: async (pulls, scm_obj) => {
        let pull_reviewers_obj = [], status;
        for await (let pull of pulls) {
            try {
                let closedDate
                let description
                // pull.reviewers.forEach(reviewer => {
                //     pull_reviewers_obj.push(reviewer.user.emailAddress);
                //     status = reviewer.status;
                // });
                for (let reviewer of pull.reviewers) {
                    pull_reviewers_obj.push(reviewer.user.emailAddress);
                    status = reviewer.status;
                }
                if (pull.closed == false) {
                    closedDate = '';
                }
                else {
                    closedDate = pull.closedDate;
                }
                if (pull.description == undefined) {
                    description = '';
                }
                else {
                    description = pull.description;
                }
                let pull_obj = new scm_datas(
                    {
                        type: "PULL",
                        pull_id: pull.id,
                        pull_project_key: scm_obj.project_data.project_key,
                        pipeline_key: scm_obj.pipeline_key,
                        pull_source: pull.fromRef.id,
                        pull_destination: pull.toRef.id,
                        pull_author: pull.author.user.emailAddress,
                        createdAt: pull.createdDate,
                        updatedAt: pull.updatedDate,
                        closedAt: closedDate,
                        pull_state: pull.state,
                        pull_status: status,
                        pull_title: pull.title,
                        pull_desc: description,
                        pull_reviewers: pull_reviewers_obj,
                    });
                await scm_datas.findOneAndUpdate(
                    {
                        pull_id: pull.id
                    },
                    {
                        $set: {
                            'type': "PULL",
                            'pull_project_key': scm_obj.project_data.project_key,
                            'pipeline_key': scm_obj.pipeline_key,
                            'pull_source': pull.fromRef.id,
                            'pull_destination': pull.toRef.id,
                            'pull_author': pull.author.user.emailAddress,
                            'createdAt': pull.createdDate,
                            'updatedAt': pull.updatedDate,
                            'closedAt': closedDate,
                            'pull_state': pull.state,
                            'pull_status': status,
                            'pull_title': pull.title,
                            'pull_desc': description,
                            'pull_reviewers': pull_reviewers_obj,
                        }
                    },
                    {
                        upsert: true
                    },
                );
               
                pull_reviewers_obj = [];
            }
            catch (err) {
                logger.error("savePull ", err);
            }
        }
        return "success";
    },
    saveUsers: async (users, scm_obj) => {
        for await (let user of users) {
            let user_data = {
                'user_name': user.user.name,
                'user_email': user.user.emailAddress,
                'user_display_name': user.user.displayName,
            }
            try {
                await tools.findOneAndUpdate({
                    'application_key': scm_obj.application_key, 'tool_instance_name': scm_obj.instance_name,
                    'tool_users': {
                        "$not": {
                            "$elemMatch": {
                                "user_name": user_data.user_name
                            }
                        }
                    }
                },
                    {
                        $addToSet: {
                            "tool_users": user_data
                        }

                    }, { upsert: true, new: true }).lean();
            }
            catch (err) {
              
                logger.error("saveUsers ", err);

            }
            let user_allocation_updation_req = true;
            var tool_data = await tools.findOne({ 'application_key': scm_obj.application_key, 'tool_instance_name': scm_obj.instance_name, 'tool_users.user_name': user_data.user_name }).lean();
            for await (let tool_user of tool_data.tool_users) {
                if (tool_user.user_name == user_data.user_name) {
                    for await (let user of tool_user.user_allocation) {

                        if (user.project_key == scm_obj.project_data.project_key) {
                            user_allocation_updation_req = false;

                        }
                    }
                }

            }

            if (user_allocation_updation_req == true) {
                try {
                    await tools.findOneAndUpdate({
                        'application_key': scm_obj.application_key, 'tool_instance_name': scm_obj.instance_name,
                        'tool_users.user_name': user_data.user_name
                    },
                        {
                            $push: {
                                "tool_users.$.user_allocation": {
                                    role_name: user.permission,
                                    project_name: scm_obj.project_name,
                                    project_key: scm_obj.project_data.project_key
                                }
                            }

                        }, { upsert: true, new: true }).lean();
                }
                catch (err) {
                    logger.error("saveUsers ", err);
                }
            }

        }
        // if (tool_data.tool_users.length != 0) {
        //     try {
        //         await applications.findOneAndUpdate({
        //             'application_key': scm_obj.application_key,
        //             "tools": {
        //                 "$elemMatch": {
        //                     "tool_name": scm_obj.tool_name,
        //                     "tool_instance_name": scm_obj.instance_name
        //                 }
        //             }
        //         },
        //             {
        //                 $set: {
        //                     "tools.$.tool_user_count": tool_data.tool_users.length

        //                 }
        //             },
        //             { upsert: true, new: true })

        //     }
        //     catch (error) {
        //         logger.error("saveUsers ", error.message);
        //     }
        //     return "success";
        // }
        return "success";
    }

}