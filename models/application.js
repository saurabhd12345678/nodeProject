
var mongoose = require('mongoose');
const dashboard_components = require('./dashboard_components');

var application_schema = new mongoose.Schema({
    application_name: { type: String },
    application_key: { type: String, required: true, unique: true },
    application_type: { type: String },
    application_desc: { type: String, default: "" },
    application_health: { type: String, default: "AT RISK", toUpperCase: true },
    application_metrics: {
        technical_debt: { type: Number, default: 0 },
        bug_ratio: { type: Number, default: 0 },
        code_coverage: { type: Number, default: 0 },
        work_completion: { type: Number, default: 0 }
    },
    dashboard_available_component: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "dashboard_components"
        }],
    project_manager: {
        name: { type: String },
        id: { type: String }
    },
    pipelines: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "pipeline"
        }],
        default: []
    },
    //create or sync flow
    tools: [
        {
            tool_name: { type: String },
            tool_instance_name: [{ type: String }],
            tool_user_count: { type: Number } //create=0,sync no of users
        }
    ],
    users: [{
        user_display_name: { type: String },
        user_name: { type: String },
        user_email: { type: String },
        user_role: [{ type: String}],
        dashboard_preference: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "dashboard_components"
        }],
    }],
    application_configurations:[{
        configuration_name:{type:String,enum:["Vault"]},
        configuration_required:{type:Boolean,default:false},
        is_configured:{type:Boolean,default:false},
        configuration_fields:{
            vault_url:{type:String},
            vault_name:{type:String,enum:["Hashicorp Vault"]},
            vault_authentication_method:{type:String,enum:["Token","Basic"]},
            vault_token:{type:String},
            vault_username:{type:String},
            vault_password:{type:String}
        }
    }],
    plan: [{
        creation_status: {
            type: String, default: "TO DO",
            enum: ["SUCCESS", "FAILED", "TO DO", "IN PROGRESS"]
        },
        configured: { type: Boolean, default: false },//required
        is_sync: { type: Boolean, default: false },
        project_url: { type: String, default: "" },
        tool_project_key: { type: String, default: "" },
        tool_project_name: { type: String, default: "" },
        create_webhook: { type: Boolean, default: false },
        instance_details: {
            type: {
                tool_name: { type: String },
                tool_version: { type:String },
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
    }],

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};

application_schema.post('save', handleDuplicate);
application_schema.post('update', handleDuplicate);
application_schema.post('findOneAndUpdate', handleDuplicate);
application_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('application', application_schema);

