var mongoose = require('mongoose');

var pipeline_schema = new mongoose.Schema({
    pipeline_name: { type: String },
    pipeline_description: { type: String },
    pipeline_key: { type: String, required: true, unique: true },
    pipeline_type: { type: String, enum: ["PIPELINE_STANDARD", "PIPELINE_CUSTOM"] },
    pipeline_health: { type: String, default: "AT RISK" },
    application_key: { type: String },
    dashboard_available_component: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "pipeline_dashboard_components"
    }],
    users: [{
        user_email: { type: String },
        dashboard_preference: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "dashboard_components"
        }],

    }],
    onboarded: { type: Boolean, default: false },
    pipeline_workflow_ui_data: mongoose.Schema.Types.Mixed,
    execution_number: { type: Number, default: 0 },
    pipeline_metrics: {
        technical_debt: { type: Number, default: 0 },
        bug_ratio: { type: Number, default: 0 },
        code_coverage: { type: Number, default: 0 },
        work_completion: { type: Number, default: 0 }
    },
    team_details: [{
        user_name: { type: String },
        user_email: { type: String, required: true, lowercase: true },
        role_name: { type: String },
        user_id: { type: String },
    }],
    plan: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        configured: { type: Boolean, default: false },//required
        is_sync: { type: Boolean, default: false },
        project_url: { type: String, default: "" },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId },
                tool_roles: [{
                    role_name: { type: String },
                    role_id: { type: String },
                }]
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: "",
                //create and sync flow
                tool_roles: [{
                    role_name: "",
                    role_id: ""
                }]
            }
        }
    },
    scm: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        configured: { type: Boolean, default: false },
        is_sync: { type: Boolean, default: false },
        project_url: { type: String, default: "" },
        repo_url: { type: String, default: "" },
        repo_name: { type: String },
        branch_name: { type: String, default: 'master' },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        scm_type: { type: String, default: "git" },
        create_webhook: { type: Boolean, default: false },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId },
                tool_roles: [{ type: String }]
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: "",
                tool_roles: []
            }
        }
    },
    code_quality: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        configured: { type: Boolean, default: false },
        is_sync: { type: Boolean, default: false },
        project_url: { type: String, default: "" },
        create_webhook: { type: Boolean, default: false },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId },
                tool_roles: [{ type: String }]
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: "",
                tool_roles: []
            }
        }
    },
    code_security: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        configured: { type: Boolean, default: false },
        is_sync: { type: Boolean, default: false },
        project_url: { type: String, default: "" },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId },
                tool_roles: [{ type: String }]
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: "",
                tool_roles: []
            }
        }
    },
    artifactory: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        project_url: { type: String, default: "" },
        is_sync: { type: Boolean, default: false },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId }
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: ""
            }
        }
    },
    continuous_integration: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        configured: { type: Boolean, default: false },
        is_sync: { type: Boolean, default: false },
        job_url: { type: String, default: "" },
        job_name: { type: String, default: "" },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId },
                tool_roles: [{ type: String }]
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: "",
                tool_roles: []
            }
        }
    },
    continuous_deployment: {
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        configured: { type: Boolean, default: false },
        is_sync: { type: Boolean, default: false },
        job_url: { type: String, default: "" },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        instance_details: {
            type: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId },
                tool_roles: [{ type: String }]
            }, default: {
                tool_name: "",
                instance_name: "",
                instance_id: "",
                tool_roles: []
            }
        }
    }


}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

pipeline_schema.post('save', handleDuplicate);
pipeline_schema.post('update', handleDuplicate);
pipeline_schema.post('findOneAndUpdate', handleDuplicate);
pipeline_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('pipeline', pipeline_schema);