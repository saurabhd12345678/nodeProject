const existing_planning_projects = require('../../models/existing_planning_projects');
const existing_scm_projects = require('../../models/existing_scm_projects');
const existing_code_analysis_projects = require('../../models/existing_code_analysis_projects');
const existing_ci_projects = require('../../models/existing_continuous_integration_jobs');
const tools = require('../../models/tool');
module.exports = {


  get_projects: async(application_key,tool_name,tool_instance_name)=>{
      try{
        if(tool_name=='Bitbucket'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_scm_projects.find({'tool_id':required_tool._id},{'scm_project_name':1,'repos':1,'scm_project_key':1});
            return fetched_projects;
          }
          if(tool_name=='GitLab'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_scm_projects.find({'tool_id':required_tool._id},{'scm_project_name':1,'repos':1,'scm_project_key':1});
            return fetched_projects;
          }
          if(tool_name=='Azure Repos'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_scm_projects.find({'tool_id':required_tool._id},{'scm_project_name':1,'repos':1,'scm_project_key':1});
            return fetched_projects;
          }
          if(tool_name=='Jira'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_planning_projects.find({'tool_id':required_tool._id},{'planning_project_key':1,'planning_project_name':1,'planning_project_id':1});
            return fetched_projects;
          }
          if(tool_name=='Sonarqube'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_code_analysis_projects.find({'tool_id':required_tool._id},{'code_analysis_project_key':1,'code_analysis_project_name':1});
            return fetched_projects;
          }
          if(tool_name=='Jenkins'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_ci_projects.find({'tool_id':required_tool._id},{'ci_project_name':1});
            return fetched_projects;
          }
          if(tool_name=='Azure Devops'){
            let required_tool = await tools.findOne({'application_key':application_key,'tool_name':tool_name,'tool_instance_name':tool_instance_name});
            let fetched_projects = await existing_ci_projects.find({'tool_id':required_tool._id},{'ci_project_name':1});
            return fetched_projects;
          }
          else{
              throw new Error("tool name not found");
          }
      }
      catch(error){
          throw new Error(error.message);
      }

  }
}