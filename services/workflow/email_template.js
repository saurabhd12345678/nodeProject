module.exports = (mail_data) => `<pre>Hi,

From LTI CANVAS DEVOPS Portal
Application Key - <b>${mail_data.application_key})</b>
Pipeline Name - <b>${mail_data.pipeline_name}(${mail_data.pipeline_key})</b>

Please click on the below link to <b>APPROVE</b> the sonarqube code analysis scan of <b>${mail_data.tool_project_name}</b> project.

<a href="${mail_data.service_url}/api/workflow/sonar_approval?pipeline_key=${mail_data.pipeline_key}&machine_id=${mail_data.machine_id}&task_field=${mail_data.task_field}&approval_response=Approved" target="_blank">Approve</a> 

Please click on the below link to <b>REJECT</b> the sonarqube code analysis scan of <b>${mail_data.tool_project_name}</b> project.

<a href="${mail_data.service_url}/api/workflow/sonar_approval?pipeline_key=${mail_data.pipeline_key}&machine_id=${mail_data.machine_id}&task_field=${mail_data.task_field}&approval_response=Rejected" target="_blank">Reject</a></pre>`

