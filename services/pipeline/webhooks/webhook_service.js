var logger = require('../../../configurations/logging/logger');
var existing_scm = require('../../../models/existing_scm_projects');
var bitbucket_sync = require('../../../connectors/bitbucket/bitbucket_sync');
var update_creation_status = require('../../../service_helpers/common/update_creation_status');
var tool = require('../../../models/tool');
const pipeline = require('../../../models/pipeline');
var get_build_details = require('../../../connectors/jenkins/jenkins_webhook');
var ci_build_data = require('../../../models/ci_data');
var sonar_webhook = require('../../../connectors/sonarqube/sonarqube_webhook');
var scm_data = require('../../../models/scm_data');
const bitbucket_webhhok = require('../../../connectors/bitbucket/bitbucket_webhook');
var sonarData = require('../../../models/code_analysis');
var ciData = require('../../../models/ci_data');
var dast_qualys_data = require('../../../models/dast_qualys_data');
var ci_build = require('../../../service_helpers/common/ci_sync_db_save');
var planning_sync_db_save = require('../../../service_helpers/common/planning_sync_db_save');
var hashicorp_vault_helper = require("../../../service_helpers/hashicorp_vault");
var hashicorp_vault_config = require("../../../connectors/hashicorp-vault/read_secret");
const sprint = require('../../../models/sprint');
const planning_data = require('../../../models/planning_data');

module.exports = {

  processPlanningData: async (webhook_data) => {

    try {
      let save_issue_satus
      let save_sprint_satus
      switch (webhook_data.webhookEvent) {

        case "jira:issue_created": {

          let application_key = await planning_sync_db_save.getPipelinekey(webhook_data.issue.fields.project.key)
          let sprint_name = await planning_sync_db_save.getSpritName(webhook_data.issue.fields.customfield_10100);

          if (sprint_name != "") {
            await planning_sync_db_save.addIssueToSprint(sprint_name, webhook_data.issue.fields.issuetype.name, webhook_data.issue.key, application_key, webhook_data.issue.fields.project.key);
          }

          save_issue_satus = await planning_sync_db_save.saveIssue(webhook_data.issue, application_key, webhook_data.issue.fields.project.key, sprint_name, webhook_data);
          break;
        }

        case "jira:issue_updated": {

          let application_key = await planning_sync_db_save.getApplicationKeyPlan(webhook_data.issue.fields.project.key)
          let sprint_name = await planning_sync_db_save.getSpritName(webhook_data.issue.fields.customfield_10100);
          save_issue_satus = await planning_sync_db_save.updateIssue(webhook_data.issue, application_key, webhook_data.issue.fields.project.key, sprint_name, webhook_data);

          break;
        }
        case "jira:issue_deleted": {

          let sprint_name = await planning_sync_db_save.getSpritName(webhook_data.issue.fields.customfield_10100);
          await planning_sync_db_save.deleteIssue(webhook_data.issue.key, webhook_data.issue.fields.issuetype.name, sprint_name);
          break;
        }

        case "sprint_updated":
        case "sprint_started":
          {
            await planning_sync_db_save.updateSprint(webhook_data);

            break;
          }
        case "sprint_closed":
          {
            await planning_sync_db_save.closeSprint(webhook_data);
            await planning_sync_db_save.updateIssueInBacklog(webhook_data);
            break;
          }
        case "sprint_created": {
          save_sprint_satus = await planning_sync_db_save.webhooksaveSprit(webhook_data.sprint);
          break;
        }
        // updates on basis of issue_key
        case "jira:worklog_updated": {
          await planning_sync_db_save.jiraWorkLogUpdate(webhook_data);
          break;
        }
        // updates on basis of issue_id
        // case "worklog_created": {
        // await planning_sync_db_save.workLogUpdate(webhook_data);
        // break;
        // }
      }
      return true;
    }
    catch (error) {
      throw new Error(error.message);
    }

  },

  azuredevops_data: async (azuredev_data) => {
    try {
      if (azuredev_data.eventType == 'build.complete') {

        let date = new Date(azuredev_data.resource.startTime);

        let date2 = new Date(azuredev_data.resource.finishTime);

        let diff = Math.abs(date2 - date);
        let result;
        if (azuredev_data.resource.status == "failed") {
          result = "FAILURE"
        }
        else if (azuredev_data.resource.status == "succeeded") {
          result = "SUCCESS"
        }


        //let fetched_pipeline = await pipeline.findOne({ 'continuous_integration.job_name': azuredev_data.project_name });
        let fetched_pipeline = await pipeline.findOne({ 'continuous_integration.job_name': azuredev_data.resource.definition.name });
        await ci_build_data.findOneAndUpdate({ 'build_number': Number(azuredev_data.resource.buildNumber) }, {
          build_number: Number(azuredev_data.resource.buildNumber),
          build_cause: azuredev_data.resource.reason,
          build_fullDisplayName: azuredev_data.resource.definition.name + "#" + azuredev_data.id,
          build_url: azuredev_data.resource.definition.url,
          job_name: azuredev_data.resource.definition.name,
          build_duration: diff,
          build_timestamp: azuredev_data.resource.startTime,
          build_result: result,
          pipeline_key: fetched_pipeline.pipeline_key,
        }, { upsert: true });
        // console.log("azure devops object: ", new_obj);
      }

    }
    catch (error) {
      throw new Error(error.message);
    }
  },

  ci_data: async (ci_data) => {
    try {
      let fetched_pipeline = await pipeline.findOne({ 'continuous_integration.job_name': ci_data.project_name });
      let fetched_tool = await tool.findOne({ 'tool_name': fetched_pipeline.continuous_integration.instance_details.tool_name, 'tool_instance_name': fetched_pipeline.continuous_integration.instance_details.instance_name }).lean();
      let build_details = await get_build_details.get_build_details(ci_data.build_number, ci_data.project_name, fetched_tool);
      let buildCause, totalCount, failCount, skipCount, testsResult;
      let buildActions = build_details.actions;
      for await (let buildAction of buildActions) {
        switch (buildAction._class) {
          case 'hudson.model.CauseAction':
            let causes = buildAction.causes;

            for await (let cause of causes) {
              if (cause._class === 'hudson.model.Cause$UserIdCause') {
                buildCause = cause.shortDescription;
              }
            }
            break;

          case 'hudson.tasks.junit.TestResultAction':
            totalCount = Number(buildAction.totalCount);
            failCount = Number(buildAction.failCount);
            skipCount = Number(buildAction.skipCount);

            if (failCount === 0) {
              testsResult = 'PASS';
            } else {
              testsResult = 'FAIL';
            }

            break;

          default:
            break;
        }

      }
      let commitIDs = [];
      if (build_details.changeSet) {
        let changeSets = build.changeSet;


        if (changeSets.items) {
          let commitItems = changeSets.items;
          if (commitItems.length != 0) {
            for (let commitItem of commitItems) {

              commitIDs.push(commitItem.commitId);
            }
          }
        }
      } else {
        let changeSets = build_details.changeSets;

        if (changeSets.length != 0) {

          for await (let changeSet of changeSets) {
            if (changeSet.items) {
              let commitItems = changeSet.items;
              if (commitItems.length != 0) {
                for await (let commitItem of commitItems) {
                  commitIDs.push(commitItem.commitId);
                }
              }
            }

          }
        }
      }
      let build_status = "UNSTABLE";
      if (build_details.result == null) {
        build_status = "UNSTABLE";
      } else {
        build_status = build_details.result;
      }
      await ci_build_data.findOneAndUpdate(
        {
          build_number: build_details.number,
          job_name: ci_data.project_name,
          pipeline_key: fetched_pipeline.pipeline_key,
        },
        {
          build_number: build_details.number,
          build_cause: buildCause,
          build_result: build_status,
          build_fullDisplayName: build_details.fullDisplayName,
          build_url: build_details.url,
          job_name: ci_data.project_name,
          job_url: fetched_pipeline.continuous_integration.job_url,
          build_timestamp: build_details.timestamp,
          pipeline_key: fetched_pipeline.pipeline_key,
          build_duration: build_details.estimatedDuration, //it should be duration
          build_test: {
            totalCount: totalCount,
            failCount: failCount,
            skipCount: skipCount,
            testsResult: testsResult,
          },
          build_commit_set: commitIDs,
        },
        { upsert: true }
      );
      return "done";
    }
    catch (error) {
      throw new Error(error.message);
    }

  },
  processCodeQualityData: async (req) => {

    //   sonar_webhook.processData();

    //   processData: async (req) => {
    try {
      let cqData;
      let project_key = req.project.key;

      let HTTPRequestOptions = {
        requestMethod: 'GET',
        basicAuthToken: "",
        proxyFlag: false,
        reqToken: false,
        urlSuffix: ""
      }

      try {
        var pipelineKey
        var job_name

        var pipe_detail = await pipeline.findOne({
          "code_quality.tool_project_key": project_key,
        })
          .populate()
        // .then((resp) => {

        pipelineKey = pipe_detail.pipeline_key;
        job_name = pipe_detail.continuous_integration.job_name;
        cqData = pipe_detail.code_quality;
        // });

      }
      catch (error) {
        logger.error("Project key did not found in database", error);
      }

      let tool_data = await tool.findOne({
        tool_instance_name: cqData.instance_details.instance_name,
      });
      let sonarAuthToken

      let vault_config_status = await hashicorp_vault_helper.get_app_vault_config_status(
        cqData.application_key
      );


      if (vault_config_status == true) {
        let vault_configuration = await hashicorp_vault_config.read_tool_secret(
          cqData.application_key,
          tool_data.tool_category,
          cqData.tool_name,
          cqData.instance_details.instance_name
        );
        if (vault_configuration.auth_type == "password") {

          sonarAuthToken = new Buffer.from(
            vault_configuration.auth_username + ':' +
            vault_configuration.auth_password
          ).toString('base64');

        } else {
          sonarAuthToken = vault_configuration.auth_token;
        }
      }
      else {

        if (tool_data.tool_auth.auth_type == "password") {
          sonarAuthToken = new Buffer.from(
            tool_data.tool_auth.auth_username +
            ":" +
            tool_data.tool_auth.auth_password
          ).toString("base64");
        } else {
          sonarAuthToken = tool_data.tool_auth.auth_token;
        }
      }
      // HTTPRequestOptions.basicAuthToken = sonarAuthToken;
      let serverUrl = tool_data.tool_url;
      let projectKey = req.project.key;
      let buildNumber = req.properties["sonar.analysis.buildNumber"];
      let result = await sonar_webhook.SonarAnalysis(serverUrl, projectKey, sonarAuthToken);



      let codeAnalysisResults = result.body.component;
      let measures = codeAnalysisResults.measures;

      for (let measure of measures) {
        codeAnalysisResults[measure.metric] = measure.value;
      }
      let code_analysis_id = codeAnalysisResults.id;

      let newCodeAnalysis = new sonarData({
        analysis_id: codeAnalysisResults.id,
        tool_project_key: projectKey,
        build_number: buildNumber,
        analysis_date: codeAnalysisResults.date,
        nloc: codeAnalysisResults.ncloc,
        line_coverage: codeAnalysisResults.line_coverage,
        violations: codeAnalysisResults.violations,
        blocker_violations: codeAnalysisResults.blocker_violations,
        critical_violations: codeAnalysisResults.critical_violations,
        major_violations: codeAnalysisResults.major_violations,
        vulnerabilities: codeAnalysisResults.vulnerabilities,
        technical_debt: codeAnalysisResults.sqale_index,
        scale_rating: codeAnalysisResults.sqale_rating,
        reliability_rating: codeAnalysisResults.reliability_rating,
        security_rating: codeAnalysisResults.security_rating,
        bugs: codeAnalysisResults.bugs,
        code_smells: codeAnalysisResults.code_smells,
        duplication: codeAnalysisResults.duplicated_lines_density,
        pipeline_key: pipelineKey,
      });


      let ci_instance = await ciData.findOne({
        "build_number": buildNumber,
        "job_name": job_name,
        "pipeline_key": pipelineKey,
      });
      if (ci_instance == null || ci_instance == undefined) {
        await ci_build.save_build_data(
          pipelineKey,
          buildNumber,
          job_name,
          code_analysis_id
        );

      } else {
        ciData.findOneAndUpdate({
          "job_name": job_name, "pipeline_key": pipelineKey,
          "build_number": buildNumber
        },
          { "code_analysis_id": code_analysis_id });

      }

      try {
        // await sonarData.findOneAndUpdate(
        //   { "analysis_id": codeAnalysisResults.id },
        //   newCodeAnalysis,
        //   { upsert: true }
        // );

        await sonarData.create(
          newCodeAnalysis
        );
      }

      catch (err) {
        logger.error("Error in Code analysis data insertion", err);
      }
    }

    catch (err) {
      logger.error("Error", err);
    }

  },

  azurerepos_data: async (azurerepos_data) => {

    try {
      if (azurerepos_data.eventType == "git.push") {
        // console.log("In git push: ",azurerepos_data);

        //let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': azurerepos_data.project.id });

        //let fetched_tool = await tool.findOne({ 'tool_name': fetched_pipeline.scm.instance_details.tool_name, 'tool_instance_name': fetched_pipeline.scm.instance_details.instance_name }).lean();



        await scm_data.findOneAndUpdate({ 'commit_id': azurerepos_data.subscriptionId }, {
          "type": "COMMIT",
          "commit_id": azurerepos_data.subscriptionId,
          "commit_msg": azurerepos_data.detailedMessage.text,
          "commit_author": azurerepos_data.resource.pushedBy.displayName,
          "commit_timestamp": azurerepos_data.resource.pushedBy.date,
          "commit_branch": azurerepos_data.resource.repository.project.defaultBranch,
          "commit_project_key": azurerepos_data.subscriptionId,
          "commit_project_id": azurerepos_data.subscriptionId,
          //"pipeline_key": "tqr-updated"//fetched_pipeline.pipeline_key,
        }, { upsert: true });
        // console.log(commit_obj);
        // await scm_data.create(commit_obj);
      }

      else {
        //console.log("in pull request ",azurerepos_data);
        let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': azurerepos_data.resourceContainers.project.id });
        //let fetched_tool = await tool.findOne({ 'tool_name': fetched_pipeline.scm.instance_details.tool_name, 'tool_instance_name': fetched_pipeline.scm.instance_details.instance_name }).lean();

        let commit_obj = new scm_data({
          "type": "PULL",
          "pull_project_key": azurerepos_data.subscriptionId,
          // "pull_reviewers": azurerepos_data.reviewers.displayName,
          "pull_source": azurerepos_data.resource.sourceRefName,
          "pull_destination": azurerepos_data.resource.targetRefName,
          "pull_author": azurerepos_data.resource.createdBy.displayName,
          //revisit "pull_state": gitlab_data.object_attributes.assignee_ids.state,
          "pull_status": azurerepos_data.resource.createdBy.mergeStatus,
          "pull_title": azurerepos_data.resource.createdBy.title,
          "pull_desc": azurerepos_data.resource.createdBy.description,
          "pull_id": azurerepos_data.resource.pullRequestId,
          //"pipeline_key": "pqr"//fetched_pipeline.pipeline_key,
        });
     
        await scm_data.create(commit_obj);

        return "done";
      }

    }
    catch (err) {
      console.log(err);
    }
  },

  gitlab_data: async (gitlab_data) => {

    try {
      if (gitlab_data.event_name == "push") {
      

        let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': gitlab_data.project.id });

        let fetched_tool = await tool.findOne({ 'tool_name': fetched_pipeline.scm.instance_details.tool_name, 'tool_instance_name': fetched_pipeline.scm.instance_details.instance_name }).lean();
        for await (let commit of gitlab_data.commits) {



          await scm_data.findOneAndUpdate({ 'commit_id': commit.id }, {
            "type": "COMMIT",
            "commit_id": commit.id,
            "commit_msg": commit.message,
            "commit_author": gitlab_data.user_name,
            "commit_timestamp": commit.timestamp,
            "commit_branch": gitlab_data.ref.split('/').pop(),
            "commit_project_key": gitlab_data.project_id,
            "commit_project_id": gitlab_data.project_id,
            "pipeline_key": fetched_pipeline.pipeline_key,

          }, { upsert: true });
          // console.log(commit_obj);
          // await scm_data.create(commit_obj);
        }
        return "done";
      }

      else {
        // console.log("In pull data:",gitlab_data);

        let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': gitlab_data.project.id });

        let fetched_tool = await tool.findOne({ 'tool_name': fetched_pipeline.scm.instance_details.tool_name, 'tool_instance_name': fetched_pipeline.scm.instance_details.instance_name }).lean();

        await scm_data.findOneAndUpdate({ 'pull_id': gitlab_data.object_attributes.id }, {
          "type": "PULL",
          "pull_project_key": gitlab_data.project.id,
          "pull_reviewers": gitlab_data.user.name,
          "pull_source": gitlab_data.object_attributes.source.name,
          "pull_destination": gitlab_data.object_attributes.target.name,
          "pull_author": gitlab_data.project.namespace,
          "pull_state": gitlab_data.object_attributes.assignee_ids.state,
          "pull_status": gitlab_data.object_attributes.merge_params.merge_status,
          "pull_title": gitlab_data.object_attributes.merge_params.title,
          "pull_desc": gitlab_data.object_attributes.description,
          "pull_id": gitlab_data.object_attributes.id,
          "is_pr_deleted": true,
          "pipeline_key": fetched_pipeline.pipeline_key,
        }, { upsert: true });
        // console.log(commit_obj);
        // await scm_data.create(commit_obj);
      }
    }
    catch (err) {
      console.log(err);
    }
  },
  bitbucket_data: async (bitbucket_data) => {

    try {
      if (bitbucket_data.eventKey == "repo:refs_changed") {

        let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': bitbucket_data.repository.project.key });

        let fetched_tool = await tool.findOne({ 'tool_name': fetched_pipeline.scm.instance_details.tool_name, 'tool_instance_name': fetched_pipeline.scm.instance_details.instance_name }).lean();

        let commit_details = await bitbucket_webhhok.commit_data(fetched_tool, bitbucket_data.changes[0].toHash, bitbucket_data.repository.slug, bitbucket_data.repository.project.key);

        let commit_obj = new scm_data({
          "type": "COMMIT",
          "commit_id": bitbucket_data.changes[0].toHash,
          "commit_msg": commit_details.message,
          "commit_author": bitbucket_data.actor.name,
          "commit_timestamp": commit_details.authorTimestamp,
          "commit_branch": bitbucket_data.changes[0].refId,
          "commit_project_key": bitbucket_data.repository.project.key,
          "commit_project_id": bitbucket_data.repository.project.id,
          "pipeline_key": fetched_pipeline.pipeline_key,
        });

        await scm_data.create(commit_obj);
        return "done";
      }
      else if (bitbucket_data.eventKey == "pr:deleted") {

        //let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': bitbucket_data.pullRequest.fromRef.repository.project.key });
        let pull_reviewers = [];
        for await (let reviewer of bitbucket_data.pullRequest.reviewers) {
          pull_reviewers.push(reviewer.user.name);
        }

        await scm_data.findOneAndUpdate({ 'pull_id': bitbucket_data.pullRequest.id }, {
          "type": "PULL-REQUEST",
          "pull_project_key": bitbucket_data.pullRequest.fromRef.repository.project.key,
          "pull_reviewers": pull_reviewers,
          "pull_source": bitbucket_data.pullRequest.fromRef.id,
          "pull_destination": bitbucket_data.pullRequest.toRef.id,
          "pull_author": bitbucket_data.pullRequest.author.user.name,
          "pull_state": bitbucket_data.pullRequest.state,
          "pull_status": bitbucket_data.pullRequest.author.status,
          "pull_title": bitbucket_data.pullRequest.title,
          "pull_desc": bitbucket_data.pullRequest.description,
          "pull_id": bitbucket_data.pullRequest.id,
          "is_pr_deleted": true
        }, { upsert: true });
        // }else if (bitbucket_data.eventKey == "pr:opened"){


        // }else if(bitbucket_data.eventKey == "pr:merged"){

        // }else if(bitbucket_data.eventKey == "pr:deleted"){

      }
      else {

        let type = "PULL"
        let is_pr_deleted = false
        if (bitbucket_data.eventKey == "pr:opened") {
          type = "PULL-REQUEST"
          is_pr_deleted = false
        } else if (bitbucket_data.eventKey == "pr:merged") {

          type = "PULL_REQUEST"
          is_pr_deleted = true
        }
        // let fetched_pipeline = await pipeline.findOne({ 'scm.tool_project_key': bitbucket_data.pullRequest.fromRef.repository.project.key });
        let pull_reviewers = [];
        for await (let reviewer of bitbucket_data.pullRequest.reviewers) {
          pull_reviewers.push(reviewer.user.name);
        }
        await scm_data.findOneAndUpdate({ 'pull_id': bitbucket_data.pullRequest.id }, {
          "type": type,
          "pull_project_key": bitbucket_data.pullRequest.fromRef.repository.project.key,
          "pull_reviewers": pull_reviewers,
          "pull_source": bitbucket_data.pullRequest.fromRef.id,
          "pull_destination": bitbucket_data.pullRequest.toRef.id,
          "pull_author": bitbucket_data.pullRequest.author.user.name,
          "pull_state": bitbucket_data.pullRequest.state,
          "pull_status": bitbucket_data.pullRequest.author.status,
          "pull_title": bitbucket_data.pullRequest.title,
          "pull_desc": bitbucket_data.pullRequest.description,
          "pull_id": bitbucket_data.pullRequest.id,
          "is_pr_deleted": is_pr_deleted
        }, { upsert: true });
      }
      return "done";

    } catch (error) {
      logger.error("Error ", error);

    }
  },
  processPlanApplicationData: async (webhook_data) => {

    try {

      let save_sprint_satus
      let save_issue_satus


      switch (webhook_data.webhookEvent) {
        case "jira:issue_created": {

          let application_key = await planning_sync_db_save.getApplicationKeyPlan(webhook_data.issue.fields.project.key)
          let sprint_name = await planning_sync_db_save.getSpritName(webhook_data.issue.fields.customfield_10100);

          if (sprint_name != "") {
            await planning_sync_db_save.addIssueToSprint(sprint_name, webhook_data.issue.fields.issuetype.name, webhook_data.issue.key, application_key, webhook_data.issue.fields.project.key);
          }

          save_issue_satus = await planning_sync_db_save.saveIssue(webhook_data.issue, application_key, webhook_data.issue.fields.project.key, sprint_name, webhook_data);
          break;
        }

        case "jira:issue_updated": {

          let application_key = await planning_sync_db_save.getApplicationKeyPlan(webhook_data.issue.fields.project.key)
          let sprint_name = await planning_sync_db_save.getSpritName(webhook_data.issue.fields.customfield_10100);
          save_issue_satus = await planning_sync_db_save.updateIssue(webhook_data.issue, application_key, webhook_data.issue.fields.project.key, sprint_name, webhook_data);

          break;
        }
        case "jira:issue_deleted": {

          let sprint_name = await planning_sync_db_save.getSpritName(webhook_data.issue.fields.customfield_10100);
          await planning_sync_db_save.deleteIssue(webhook_data.issue.key, webhook_data.issue.fields.issuetype.name, sprint_name);
          break;
        }

        case "sprint_updated":

        case "sprint_started":
          {
            await planning_sync_db_save.updateSprint(webhook_data);

            break;
          }
        case "sprint_closed":
          {
            await planning_sync_db_save.closeSprint(webhook_data);
            await planning_sync_db_save.updateIssueInBacklog(webhook_data);
            break;
          }
        case "sprint_created": {

          let save_sprint_satus = await planning_sync_db_save.webhooksaveSprit(webhook_data.sprint);
          break;
        }
        // updates on basis of issue_key
        case "jira:worklog_updated": {
          await planning_sync_db_save.jiraWorkLogUpdate(webhook_data);
          break;
        }
        // updates on basis of issue_id
        // case "worklog_created": {
        // await planning_sync_db_save.workLogUpdate(webhook_data);
        // break;
        // }
      }
      return true;
    }
    catch (error) {
      throw new Error(error.message);
    }

  },

  azure_webhook_data: async (webhook_data) => {
    switch (webhook_data.eventType) {
      case "workitem.created": {
        try {
          let sprint_name = webhook_data.resource.fields["System.IterationPath"].slice(webhook_data.resource.fields["System.TeamProject"].length + 1, webhook_data.resource.fields["System.IterationPath"].length);
          let application_key = await planning_sync_db_save.getApplicationKeyByAzureProjectName(webhook_data.resource.fields["System.TeamProject"]);
          let new_workitem = {
            "issue_type": webhook_data.resource.fields["System.WorkItemType"],
            "application_key": application_key,
            "issue_story_points": webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StoryPoints"],
            "issue_sprint": sprint_name,
            "timeoriginalestimate": webhook_data.resource.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"],
            "timespent": webhook_data.resource.fields["Microsoft.VSTS.Scheduling.Effort"],
            "issue_wastage_days": 0,

            "issue_name": webhook_data.resource.fields["System.Title"],
            "issue_desc": (webhook_data.resource.fields['System.Description'] == undefined) ? "description" : webhook_data.resource.fields['System.Description'], //.slice(5, current_item.fields["System.Description"].length - 5)

            "issue_id": webhook_data.resource.id,
            "issue_key": webhook_data.resource.id,
            "actual_start_date": webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StartDate"],
            "actual_end_date": webhook_data.resource.fields["Microsoft.VSTS.Scheduling.FinishDate"],
            "assigned_to": (webhook_data.resource.fields['System.AssignedTo'] == undefined) ? "none" : webhook_data.resource.fields['System.AssignedTo'].displayName,
            "reporter": (webhook_data.resource.fields['Microsoft.VSTS.CodeReview.AcceptedBy'] == undefined) ? "none" : webhook_data.resource.fields['Microsoft.VSTS.CodeReview.AcceptedBy'].displayName,
            "issue_status": webhook_data.resource.fields["System.State"],

          }
          await planning_sync_db_save.saveAzureWorkitem(new_workitem);
          await planning_sync_db_save.addAzureIssueToSprint(sprint_name, webhook_data.resource.fields["System.WorkItemType"], webhook_data.resource.id, application_key, webhook_data.resource.fields["System.TeamProject"])

          break;
        }
        catch (error) {

          logger.error("Error ", error);
        }
      }
      case "workitem.updated": {
        try {
          let application = await planning_sync_db_save.getApplication(webhook_data.resource.workItemId);
          let application_key = await planning_sync_db_save.getApplicationKeyByWorkItemId(webhook_data.resource.workItemId)
          let issue_story_point = webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StoryPoints"] == undefined ? (application.issue_story_points) : (webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StoryPoints"].newValue == undefined ? webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StoryPoints"].oldValue : webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StoryPoints"].newValue);
          let sprint_name = await planning_sync_db_save.getSprintNameByWorkItemId(webhook_data.resource.workItemId);
          let issue_key = webhook_data.resource.workItemId;
          let issue_type = await planning_sync_db_save.getissuetype(webhook_data.resource.workItemId);
          let issue_status = webhook_data.resource.fields["System.State"] == undefined ? (application.issue_status) : (webhook_data.resource.fields["System.State"].newValue == undefined ? webhook_data.resource.fields["System.State"].oldValue : webhook_data.resource.fields["System.State"].newValue);
          let issue_sprint = sprint_name;
          let timeoriginalestimate = webhook_data.resource.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] == undefined ? (application.timeoriginalestimate) : (webhook_data.resource.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'].newValue == undefined ? webhook_data.resource.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'].oldValue : webhook_data.resource.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'].newValue);
          let timespent = webhook_data.resource.fields['Microsoft.VSTS.Scheduling.Effort'] == undefined ? (application.timespent) : (webhook_data.resource.fields['Microsoft.VSTS.Scheduling.Effort'].newValue == undefined ? webhook_data.resource.fields['Microsoft.VSTS.Scheduling.Effort'].oldValue : webhook_data.resource.fields['Microsoft.VSTS.Scheduling.Effort'].newValue);
          let actual_start_date = webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StartDate"] == undefined ? (application.actual_start_date) : (webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StartDate"].newValue == undefined ? webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StartDate"].oldValue : webhook_data.resource.fields["Microsoft.VSTS.Scheduling.StartDate"].newValue);
          await planning_sync_db_save.updateWorkItem(issue_story_point, issue_key, timespent, issue_status, issue_sprint, timeoriginalestimate, application_key, actual_start_date);


        }

        catch (error) {
          logger.error("Error ", error);
        }
      }
      case "workitem.deleted": {
        try {
          let sprint_name = webhook_data.resource.fields["System.IterationPath"].slice(webhook_data.resource.fields["System.TeamProject"].length + 1, webhook_data.resource.fields["System.IterationPath"].length);
          await planning_sync_db_save.deleteIssue(webhook_data.resource.id, webhook_data.resource.fields["System.WorkItemType"], sprint_name);
          break;
        }
        catch (error) {
          logger.error("Error ", error);
        }
      }

    }


  },



  qualys_data_save: async (pipeline_key, build_number, qualys_json) => {
    let Links_Collected = 0;
    let Ajax_Links_Crawled = 0;
    let Requests_Crawled = 0;
    let Unexpected_Errors = 0;
    let Avg_Response_Time = 0;

    try {
      let encode_list = qualys_json.ServiceResponse.data[0].WasScan.igs.list;

      for await (let encoded_element of encode_list) {
        if (encoded_element.WasScanIg.data != undefined) {
          let e_data = encoded_element.WasScanIg.data.value;
          let buff = new Buffer.from(e_data, 'base64');
          let text = buff.toString('ascii');

          //links collected
          let start_index_collected = text.indexOf("Collected")
          if (start_index_collected != -1) {
            let end_index_collected = text.indexOf("links overall")
            Links_Collected = text.slice(start_index_collected + 10, end_index_collected - 1);
          }
          //Ajax Links Crawled
          let start_index_ajax = text.indexOf("Number of ajax links:")
          if (start_index_ajax != -1) {
            let end_index_ajax = text.indexOf("&lt")
            Ajax_Links_Crawled = text.slice(start_index_ajax + 22, end_index_ajax - 1);
          }
          //Requests Crawled

          let start_index_requests_crawled = text.indexOf("Number of crawled XHRs:")
          if (start_index_requests_crawled != -1) {

            let end_index_requests_crawled = text.indexOf("Method")

            Requests_Crawled = text.slice(start_index_requests_crawled + 24, end_index_requests_crawled - 1);

          }
          //unexpected errors
          let start_index_unexpected_errors = text.indexOf("encountered connection errors:")
          if (start_index_unexpected_errors != -1) {

            let end_index_unexpected_errors = text.indexOf("Links with")

            Unexpected_Errors = text.slice(start_index_unexpected_errors + 31, end_index_unexpected_errors - 1);

          }
           //Avg Response Time
          //  let start_index_avg_response_time = text.indexOf("response time:")
          //  if (start_index_avg_response_time != -1) {
          //   start_index_avg_response_time = start_index_avg_response_time+14 
          //    let temp=""
          //    let i=start_index_avg_response_time+1
          //    let f1= true
          //    while(f1){
          //   let end_index = text.charAt(i)
          //   if(end_index==' s'){
          //        f1=false
          //        break
          //      }
          //      else{
          //        temp= temp+end_index
          //      }
          //      i++
          //    }
          //    Avg_Response_Time = temp
             
          //  }

        }



      }
  
    }
    catch (err) {
x
      throw new Error(error.message);
    }
    try {
   
      let new_qualys_data = new dast_qualys_data({
        pipeline_key: pipeline_key,
        build_number: build_number,
        crawling_time: qualys_json.ServiceResponse.data[0].WasScan.summary.crawlDuration[0],
        Assesment_Time: qualys_json.ServiceResponse.data[0].WasScan.summary.testDuration,
        Requests_Performed: qualys_json.ServiceResponse.data[0].WasScan.summary.nbRequests,
        Links_Crawled: qualys_json.ServiceResponse.data[0].WasScan.summary.linksCrawled,
        vulnerabilities: qualys_json.ServiceResponse.data[0].WasScan.vulns.count,
        sensitive_contents: qualys_json.ServiceResponse.data[0].WasScan.sensitiveContents.count,
        Information_Gathered: qualys_json.ServiceResponse.data[0].WasScan.igs.count,
        Level_5: qualys_json.ServiceResponse.data[0].WasScan.stats.global.nbScsLevel5,
        Level_4: qualys_json.ServiceResponse.data[0].WasScan.stats.global.nbScsLevel4,
        Level_3: qualys_json.ServiceResponse.data[0].WasScan.stats.global.nbScsLevel3,
        Level_2: qualys_json.ServiceResponse.data[0].WasScan.stats.global.nbScsLevel2,
        Level_1: qualys_json.ServiceResponse.data[0].WasScan.stats.global.nbScsLevel1,
        Cross_Site: 0,
        SQL_Injection: 0,
        Information_Disclosure: 0,
        Path_Disclosure: 0,
        Injection: 0,
        Broken_Authentication: 0,
        Sensitive_Data: qualys_json.ServiceResponse.data[0].WasScan.sensitiveContents.count,
        XML_XXE: 0,
        Broken_Access: 0,
        Security_Misconfiguration: 0,
        Cross_XSS: 0,
        Insecure: 0,
        Using_Vulnerabilities: 0,
        Insufficient_Logging: 0,
        Links_Collected: Links_Collected,
        Ajax_Links_Crawled: Ajax_Links_Crawled,
        Requests_Crawled: Requests_Crawled,
        Unexpected_Errors: Unexpected_Errors,
        Avg_Response_Time: Avg_Response_Time,


      });
      await dast_qualys_data.create(new_qualys_data);

      return 'SUCCESS'
    } catch (error) {
   
      throw new Error(error.message);
    }
  },

  qualys_data_api_save: async (qualys_json, pipeline_key) => {


    try {

      let new_qualys_data = new dast_qualys_data({
        pipeline_key: pipeline_key,
        build_number: 0,
        crawling_time: qualys_json.ServiceResponse.data[0].WasScan[0].summary[0].crawlDuration[0],
        Assesment_Time: qualys_json.ServiceResponse.data[0].WasScan[0].summary[0].testDuration[0],
        Requests_Performed: qualys_json.ServiceResponse.data[0].WasScan[0].summary[0].nbRequests[0],
        Links_Crawled: qualys_json.ServiceResponse.data[0].WasScan[0].summary[0].linksCrawled[0],
        vulnerabilities: 0,
        sensitive_contents: 0,
        Information_Gathered: 0,
        Level_5: 0,
        Level_4: 0,
        Level_3: 0,
        Level_2: 0,
        Level_1: 0,
        Cross_Site: 0,
        SQL_Injection: 0,
        Information_Disclosure: 0,
        Path_Disclosure: 0,
        Injection: 0,
        Broken_Authentication: 0,
        Sensitive_Data: 0,
        XML_XXE: 0,
        Broken_Access: 0,
        Security_Misconfiguration: 0,
        Cross_XSS: 0,
        Insecure: 0,
        Using_Vulnerabilities: 0,
        Insufficient_Logging: 0,
        Links_Collected: 0,
        Ajax_Links_Crawled: 0,
        Requests_Crawled: 0,
        Unexpected_Errors: 0,
        Avg_Response_Time: 0,


      });
      await dast_qualys_data.create(new_qualys_data);


    } catch (error) {
      throw new Error(error.message);
    }
  }



}