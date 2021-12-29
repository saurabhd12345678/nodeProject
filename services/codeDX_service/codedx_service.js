

const codedx_connector = require('../../connectors/codeDX/codeDXconnector');
const tool = require('../../models/tool');
var Pipeline = require('../../models/pipeline');
var codeDxData = require('../pipeline/dashboard/pipeline_dashboard_service');
const codeDx_data = require('../../models/codeDx_data');


module.exports.get_codedx_finding_data = async (pipeline_key) => {


    try {
        let project_id
        let api_key
        let url
        let pipelinedata = await Pipeline.findOne({
            "pipeline_key": pipeline_key
        })


        if (pipelinedata.pipeline_workflow_ui_data != undefined) {
            let nodes = pipelinedata.pipeline_workflow_ui_data.nodes
            // nodes.filter(async(data) => {


            // })

            for await (let data of nodes) {
                if (data.task.task_key == 'CodeDx_SAST') {

                    let tool_data = await tool.findOne({ tool_instance_name: data.task["Tool Instance Name"] })



                    project_id = data.task["Project Id"]
                    api_key = tool_data.tool_auth.auth_token
                    url = tool_data.tool_url

                    break

                }
            }

            if (project_id != null || project_id != undefined) {

                let response = JSON.parse(await codedx_connector.getCodeDxFindingTableData(project_id, api_key, url));



                let codexFindArray = [];
                let result = {};
                response.filter(data => {
                    codexFindArray.push(data.descriptor.name);
                })

                let compressed = [];
                let totalFindings = codexFindArray.length;

                // make a copy of the input array
                let copy = codexFindArray.slice(0);

                // first loop goes over every element
                for (let i = 0; i < codexFindArray.length; i++) {

                    let myCount = 0;
                    // loop over every element in the copy and see if it's the same
                    for (let w = 0; w < copy.length; w++) {
                        if (codexFindArray[i] == copy[w]) {
                            // increase amount of times duplicate is found
                            myCount++;
                            // sets item to undefined
                            delete copy[w];
                        }
                    }

                    if (myCount > 0) {
                        let a = new Object();
                        a.value = codexFindArray[i];
                        a.count = myCount;
                        compressed.push(a);
                    }
                }
                compressed.sort(function (a, b) {
                    return parseFloat(b.count) - parseFloat(a.count);
                });


                return {
                    "findings": compressed,
                    "total_findings": totalFindings,
                    "status": "Success"
                };
            }


        } else {

            return {
                "findings": [],
                "total_findings": [],
                "status": "No Security Data"
            };

        }


    }


    catch (error) {

        throw new Error(error.message);
    }
},


    module.exports.updateAsPerPipeline = async (pipeline_key, graph_name) => {

        try {
            let project_id;
            let api_key;
            let url;
            let response;
            let pipelinedata = await Pipeline.findOne({
                "pipeline_key": pipeline_key
            })

            if (pipelinedata.pipeline_workflow_ui_data != undefined) {
                let nodes = pipelinedata.pipeline_workflow_ui_data.nodes;


                for await (let data of nodes) {


                    if (data.task.task_key == 'CodeDx_SAST') {

                        if (data.task["Project Id"] == 'demoId') {
                            project_id = data.task["Project Id"];

                        }

                        else {
                            let tool_data = await tool.findOne({ tool_instance_name: data.task["Tool Instance Name"] })

                            api_key = tool_data.tool_auth.auth_token;
                            url = tool_data.tool_url;
                            project_id = data.task["Project Id"];

                        }

                    }
                }

                
                if (project_id != null || project_id != undefined) {
                    switch (graph_name) {
                        case "AverageResolutionDays":
                            try {

                                if (project_id == "demoId") {
                                    // console.log("project_id in AvgResDays switch :",project_id);

                                    response = {
                                        "Critical": {
                                            "numFindings": Math.floor(Math.random() * (8000 - 4) + 4),
                                            "totalNumDays": Math.floor(Math.random() * (15000 - 30) + 30),
                                            "avgNumDays": Math.floor(Math.random() * (32 - 6) + 6),
                                        },
                                        "High": {
                                            "numFindings": Math.floor(Math.random() * (8000 - 4) + 4),
                                            "totalNumDays": Math.floor(Math.random() * (15000 - 30) + 30),
                                            "avgNumDays": Math.floor(Math.random() * (32 - 6) + 6),
                                        },
                                        "Info": {
                                            "numFindings": Math.floor(Math.random() * (8000 - 4) + 4),
                                            "totalNumDays": Math.floor(Math.random() * (15000 - 30) + 30),
                                            "avgNumDays": Math.floor(Math.random() * (32 - 6) + 6),
                                        },
                                        "Low": {
                                            "numFindings": Math.floor(Math.random() * (8000 - 4) + 4),
                                            "totalNumDays": Math.floor(Math.random() * (15000 - 30) + 30),
                                            "avgNumDays": Math.floor(Math.random() * (32 - 6) + 6),
                                        },
                                        "Medium": {
                                            "numFindings": Math.floor(Math.random() * (8000 - 4) + 4),
                                            "totalNumDays": Math.floor(Math.random() * (15000 - 30) + 30),
                                            "avgNumDays": Math.floor(Math.random() * (32 - 6) + 6),
                                        },
                                    }

                                    await codeDx_data.findOneAndUpdate({ pipeline_key: pipeline_key },
                                        {
                                            medium: response.Medium,
                                            info: response.Info,
                                            high: response.High,
                                            low: response.Low,
                                            critical: response.Critical
                                        },
                                        { upsert: true }
                                    );
                                    // console.log("Resolution response :",response);
                                    return response;
                                }

                                else {

                                    response = await codeDxData.averageResolutionTime(project_id, api_key, url);

                                    await codeDx_data.findOneAndUpdate({ pipeline_key: pipeline_key },
                                        {
                                            medium: response.Medium,
                                            info: response.Info,
                                            high: response.High,
                                            low: response.Low,
                                            critical: response.Critical
                                        },
                                        { upsert: true }
                                    );
                                    return response;

                                }

                            } catch (error) {
                                let res = await codeDx_data.findOne({ 'pipeline_key': pipeline_key });
                                return res;

                            }

                        case "CodeMetrics":
                            try {

                                if (project_id == "demoId") {

                                    // console.log("project_id in CM switch :",project_id);

                                    code_metrics_array_of_data = [{
                                        "key": "XML",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }, {
                                        "key": "Visualforce Component",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }, {
                                        "key": "Maven POM",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }, {
                                        "key": "Java Server Pages",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }, {
                                        "key": "Java",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }, {
                                        "key": "YAML",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }, {
                                        "key": "SQL",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    },
                                    {
                                        "key": "HTML",
                                        "number_of_total_lines": Math.floor(Math.random() * (500 - 100) + 100),
                                        "complexity": {
                                            "totalCcn": Math.floor(Math.random() * (150 - 100) + 100),
                                            "numFunctions": Math.floor(Math.random() * (100 - 50) + 50),
                                            "averageCcn": Math.random() * (2.00 - 1.00) + 1.00,
                                        },
                                        "codeChurn": 0,
                                        "numFindings": Math.floor(Math.random() * (300 - 150) + 150),
                                        "numSourceFiles": Math.floor(Math.random() * (20 - 5) + 5),
                                        "numCommentLines": Math.floor(Math.random() * (150 - 10) + 10),
                                    }],

                                        response = {
                                            "total_number_of_lines": Math.floor(Math.random() * (2600 - 2000) + 2000),
                                            "total_source_files": Math.floor(Math.random() * (80 - 40) + 40),
                                            "total_comment_code": Math.random() * (1.00 - 0.001) + 0.001,
                                            "total_code_churn": Math.floor(Math.random() * (4 - 0) + 0),
                                            "total_complexity": Math.random() * (2.00 - 1.20) + 1.20,
                                            "code_metrics": code_metrics_array_of_data
                                        };

                                    await codeDx_data.findOneAndUpdate(
                                        { pipeline_key: pipeline_key },
                                        {
                                            total_number_of_lines: response.total_number_of_lines,
                                            total_source_files: response.total_source_files,
                                            total_comment_code: response.total_comment_code,
                                            total_code_churn: response.total_code_churn,
                                            total_complexity: response.total_complexity,
                                            code_metrics: response.code_metrics
                                        },
                                        { upsert: true }
                                    );
                                    // console.log("code mertrics response :",response);

                                    return response;
                                }

                                else {
                                    response = await codeDxData.codeMetrics(project_id, api_key, url);

                                    await codeDx_data.findOneAndUpdate(
                                        { pipeline_key: pipeline_key },
                                        {
                                            total_number_of_lines: response.total_number_of_lines,
                                            total_source_files: response.total_source_files,
                                            total_comment_code: response.total_comment_code,
                                            total_code_churn: response.total_code_churn,
                                            total_complexity: response.total_complexity,
                                            code_metrics: response.code_metrics
                                        },
                                        { upsert: true }
                                    );
                                    return response;

                                }

                            } catch (error) {


                                let res = await codeDx_data.findOne({ 'pipeline_key': pipeline_key });

                                return res;
                            }

                        case "TopVulnerabilities":
                                try {
    
                                    if (project_id == "demoId") {
    
                                       
    
                                        // console.log("came here also Top Vulnerabilities")
                                        let findings = Math.floor(Math.random() * (6 - 2) + 2);
                                        let vulnerabilities_data = [
                                             {"value":"Undeclared variables are global by default","count":Math.floor(Math.random() * (findings - 1) + 1)},
                                             {"value":"Using components with known vulnerabilities","count":Math.floor(Math.random() * (findings - 2) + 2)},
                                             {"value":"Inconsistent of return usage","count":Math.floor(Math.random() * (findings - 2) + 2)},
                                             {"value":"Avoid trailing commas in object and array literals","count":Math.floor(Math.random() * (findings - 1) + 1)},
                                             {"value":"For-in loop variable not explicitly scoped","count":Math.floor(Math.random() * (findings - 1) + 1)}
                                            ]
                                        
                                        response = {
                                            "findings" : vulnerabilities_data,
                                            "total_findings" : findings
                                        }
                                        
    
                                        await codeDx_data.findOneAndUpdate(
                                            { pipeline_key: pipeline_key },
                                            {
                                                findings : vulnerabilities_data,
                                                total_findings : findings 
                                            },
                                            { upsert: true }
                                        );
                                       
    
                                        return response;
                                    }
    
                                    // else {
                                    //     response = await codeDxData.codeMetrics(project_id, api_key, url);
    
                                    //     await codeDx_data.findOneAndUpdate(
                                    //         { pipeline_key: pipeline_key },
                                    //         {
                                    //             total_number_of_lines: response.total_number_of_lines,
                                    //             total_source_files: response.total_source_files,
                                    //             total_comment_code: response.total_comment_code,
                                    //             total_code_churn: response.total_code_churn,
                                    //             total_complexity: response.total_complexity,
                                    //             code_metrics: response.code_metrics
                                    //         },
                                    //         { upsert: true }
                                    //     );
                                    //     return response;
    
                                    // }
    
                                } catch (error) {
    
    
                                    let res = await codeDx_data.findOne({ 'pipeline_key': pipeline_key });
    
                                    return res;
                                }
                    }
                }
            }
            else {
                return {
                    "status": "No Security Data"
                };
            }
        }
        catch (error) {

            throw new Error(error.message);
        }
    }

