var workflow_service = require('../workflow/workflow_service');
var workflow_task = require('./workflow_tasks');
var token_method = require("../../service_helpers/verify_token");
var activity_logger = require('../../service_helpers/common/activity_logger')
var awstask = require('../../connectors/aws/aws_networking');
var awstask1 = require('../../connectors/aws/aws_ecs_cluster');
var awstask2 = require('../../connectors/aws/aws_eks_cluster');
var qualysData = require("../../connectors/qualys/qualys_get_data");
const logger = require('../../configurations/logging/logger')
module.exports = (app) => {


    app.post("/api/workflow/save_pipeline_workflow", token_method.verifyToken, async (req, res) => {
        try {
            var pipeline_data = req.body.pipeline_data;
            var workflow_data = req.body.workflow_data;


            var pipeline_key = await workflow_service.savePipelineWorkflow(
                req, pipeline_data,
                workflow_data
            );

            res.status(200).send({
                "data": "Pipeline workflow saved successfully.",
                "pipeline_key": pipeline_key
            });

        } catch (error) {

            res.status(500).send({
                "status": "Error while saving pipeline workflow."
            });
        }
    })
    app.get("/api/workflow/execute_pipeline_workflow", token_method.verifyToken, async (req, res) => {
        try {
            let pipeline_key = req.query.pipeline_key;
            var data = await workflow_service.executePipelineWorkflow(pipeline_key, req.headers["authorization"]);
            if (data.msg == "SUCCESS") {
                await activity_logger.logActivity(data.application_key, pipeline_key, "Pipeline workflow execution started(Execution No - " + data.execution_number + ")", req.headers["authorization"]);

                res.status(200).send({
                    "data": "Pipeline workflow execution started successfully.",
                    "pipeline_key": pipeline_key
                });
            }
            else {
                res.status(500).send({
                    "status": "Error while starting pipeline workflow execution."
                });
            }
        } catch (error) {
            res.status(500).send({
                "status": "Error while starting pipeline workflow execution."
            });
        }
    })

    app.get("/api/workflow/get_pipeline_workflow_executions", token_method.verifyToken, async (req, res) => {
        try {
            let pipeline_key = req.query.pipeline_key;
            var pipeline_workflow_data = await workflow_service.getPipelineWorkflowExecutions(pipeline_key);
            res.status(200).send(pipeline_workflow_data);

        } catch (error) {
            res.status(500).send({
                "status": "Error while fetching pipeline workflow execution list."
            });
        }
    })

    app.get("/api/workflow/get_pipeline_workflow_execution_details",
        token_method.verifyToken,
        async (req, res) => {
            try {
                let pipeline_key = req.query.pipeline_key;
                let execution_number = parseInt(req.query.execution_number);
                var pipeline_workflow_data = await workflow_service.getPipelineWorkflowExecutionDetails(pipeline_key, execution_number);
                res.status(200).send(pipeline_workflow_data);

            } catch (error) {
                res.status(500).send({
                    "status": "Error while fetching pipeline workflow execution details."
                });
            }
        })

    app.get("/api/workflow/get_pipeline_workflow"
        , token_method.verifyToken
        ,
        async (req, res) => {
            try {
                let pipeline_key = req.query.pipeline_key;
                var pipeline_data = await workflow_service.getPipelineWorkflow(pipeline_key);
                res.status(200).send(pipeline_data);

            } catch (error) {
                res.status(500).send({
                    "status": "Error while fetching pipeline workflow."
                });
            }
        })

    app.get("/api/workflow/get_category", token_method.verifyToken, async (req, res) => {
        try {

            var category_list = await workflow_service.getCategoryList();
            res.status(200).send(category_list);

        } catch (error) {
            res.status(500).send({
                "status": "Error while fetching category."
            });
        }
    })

    app.get("/api/workflow/get_task", token_method.verifyToken, async (req, res) => {
        try {

            var category_list = await workflow_service.getTaskList(req.query.category_name);
            res.status(200).send(category_list);

        } catch (error) {
            res.status(500).send({
                "status": "Error while fetching category."
            });
        }
    })




    app.post("/api/workflow/create_project_in_tool", token_method.verifyToken, async (req, res) => {
        try {
            let tool_obj = req.body;
            var data = await workflow_service.createProjectInTool(tool_obj);
            //await activity_logger.logActivity("NA", "NA", "Project created in " + tool_obj.tool_instance_name + " tool instance", req.headers["authorization"]);
            res.status(200).send({
                "data": data
            });

        } catch (error) {
            res.status(500).send({
                "status": "Error while creating project"
            });
        }
    })


    app.post("/api/workflow/create_and_execute_workflow", token_method.verifyToken, async (req, res) => {
        try {
            let workflow_data = req.body;
            workflow_service.createWorkflow(workflow_data);
            res.status(200).send({
                "data": "Successfully started creation of workflow"
            });
        } catch (error) {
            logger.error("Error while creating workflow" + error);
            res.status(500).send({
                "status": "Error while creating workflow"
            });
        }
    })

    app.get("/api/workflow/sonar_approval", token_method.verifyToken, async (req, res) => {

        let approval_response = req.query.approval_response;
        let pipeline_key = req.query.pipeline_key;
        let machine_id = req.query.machine_id;
        let task_field = req.query.task_field;
        let response = {
            status: 200,
            approval_response: approval_response
        };
        try {
            workflow_service.sonarqubeScanApprovalResponse(pipeline_key, machine_id, task_field, response);
            let response_msg = approval_response.toUpperCase() == "APPROVED" ? "Approved. Your response sent successfully." : "Rejected. Your response sent successfully.";
            res.send(response_msg);
        } catch (error) {
            logger.error("Error while saving the approval response" + error);
            res.status(500).send({
                "status": "Error while saving your approval response"
            });
        }

    })
    app.post("/api/workflow/savemasterdata", token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.saveMasterTaskData(req.body);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getAllTasks', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAllTaskNames();
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getAllConditionList', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAllConditionList(req.query.task_name, req.query.application_key);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getToolInstance', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getToolInstance(req.query.task_name, req.query.application_key);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getProjectList', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getProjectList(req.query.tool_instance_name, req.query.application_key, req.query.tool_name);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getRepos', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getRepo(req.query.scm_project_key, req.query.tool_instance_name, req.query.tool_name, req.query.project_name, req.query.application_key);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get(
        "/api/workflow/getBranches",
        token_method.verifyToken,
        async (req, res) => {
            try {
               
                var workflow_service_response = await workflow_service.getBranchs(
                    req.query.repo_key,
                    req.query.repo_name,
                    req.query.tool_instance_name,
                    req.query.tool_name,
                    req.query.application_key,
                    req.query.project_Name,
                    req.query.project_key
                );
                res.status(200).send({ data: workflow_service_response });
            } catch (error) {
                res.status(500).send({ data: error.message });
            }
        }
    );
    app.get(
        "/api/workflow/getGitLabBranches",
        token_method.verifyToken,
        async (req, res) => {
            try {
                var workflow_service_response = await workflow_service.getGitlabBranchs(
                    req.query.scm_project_key,
                    req.query.repo
                );
                res.status(200).send({ data: workflow_service_response });
            } catch (error) {
                res.status(500).send({ data: error.message });
            }
        }
    );
    app.get('/api/workflow/getJFrogRepos', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getJFrogRepo(req.query.application_key, req.query.tool_instance_name);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });

    app.get('/api/workflow/getCodeSecurityProjects',
        token_method.verifyToken,
        async (req, res) => {
            try {
                var workflow_service_response = await workflow_service.getCodeSecurityProjects(req.query.url, req.query.api_key);
                res.status(200).send({ "data": workflow_service_response });

            } catch (error) {
                res.status(500).send({ "data": error.message });
            }
        });



    app.get('/api/workflow/getCiInstanceName', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getCiInstanceNames(req.query.application_key);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getCIAgentName', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getCIAgentNames(req.query.tool_instance_name,req.query.application_key);
            if(!workflow_service_response) {
                res.status(503).send({ "data": [] });    
            }

            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    // app.post('/api/workflow/sonar-jenkins', token_method.verifyToken, async (req, res) => {
    //     try {
    //         // (pipeline_key, req.body.machine_id, req.body.state, req.body.task_field, req.body.api_data, req.body.execution_number)
    //         var workflow_service_response = await workflow_task.build_docker_image(req.body.pipeline_key, req.body.machine_id, req.body.state, req.body.task_field, req.body.api_data, req.body.execution_number);
    //         res.status(200).send({ "data": workflow_service_response });

    //     } catch (error) {
    //         res.status(500).send({ "data": error.message });
    //     }
    // });
    app.post('/api/workflow/workflow_webhook_jenkins'
        , async (req, res) => {
            try {
                // (pipeline_key, req.body.machine_id, req.body.state, req.body.task_field, req.body.api_data, req.body.execution_number)

                var workflow_service_response = await workflow_service.workflowWebhookJenkins(req.body);

                res.status(200).send({ "data": workflow_service_response });

            } catch (error) {
                res.status(500).send({ "data": error.message });
            }
        });
    app.get('/api/workflow/getWorkflowKPI', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getWorkflowKPI(req.query.pipeline_key, req.query.execution_number);
            res.status(200).send({ "data": workflow_service_response });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });
    app.get('/api/workflow/getAWSECSClusters', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAWSECSClusters();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/getAWSECRRepositories', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAWSECSECRRepositories();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/getAWSIAMRoles', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAWSIAMRoles();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/getAWSVPCs', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAWSVPCs();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/getAWSSubnets', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAWSSubnets(req.query.vpc_id);
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/getAWSSecurityGroups', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.getAWSSecurityGroups(req.query.vpc_id);
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/getAWSEKSClusters', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await workflow_service.get_eks_clusters();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/testapi', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await awstask.get_securityGroups(req.query.vpc_id);
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });
    app.get('/api/workflow/testapi1', token_method.verifyToken, async (req, res) => {
        try {
            var workflow_service_response = await awstask1.run_task_fargate();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });

    app.get('/api/workflow/test007', token_method.verifyToken, async (req, res) => {
        try {

            //pipeline_key, machine_id, checkout_path, task_field, api_data, execution_number
            var workflow_service_response = await awstask2.get_clusters();
            res.status(200).send({ "data": workflow_service_response });
        }
        catch (err) {
            res.status(500).send({ "data": err.message });
        }
    });

    app.get('/api/workflow/getQualysData', async (req, res) => {
        try {
            var qualys_data = await qualysData.fetch_id();
            res.status(200).send({ "data": qualys_data });

        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });

    app.get('/api/workflow/getPlanningProject',async (req, res) => {
        try {
            let current_planning_project = await workflow_service.getCurrrentPlanningProject(req.query.application_key,req.query.tool_instance_name);
            res.status(200).send({ "data": current_planning_project });
        } catch (error) {
            res.status(500).send({ "data": error.message });
        }
    });

}

