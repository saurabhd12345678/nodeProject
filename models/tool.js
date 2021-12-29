var mongoose = require('mongoose');

var tool_schema = new mongoose.Schema({
    application_key:{type:String,required:true},
    tool_category: {
        type: String,
        enum: ['Planning','ITSM', 'Source Control', 'Continuous Integration','Artifactory Management', 'Code Analysis', 'Continuous Deployment','Security','DAST'],
        required: true
    },
    tool_name: { type: String, required: true , enum:['Bitbucket','Jira','Sonarqube','Jenkins', 'Azure Devops','Azure Boards', 'ServiceNow','JFrog','CodeDx','GitLab','Azure Repos', 'Qualys']},
    tool_instance_name: {
        type: String,
        required: true
    },
    tool_version:{type:String},
    tool_url: { type: String, required: true },
    webhook_enable: { type: Boolean, default:false},
    repository_data: {type:String},
    proxy_required: { type: Boolean, default:false },
    http_proxy: { type: mongoose.Schema.Types.ObjectId, ref: 'HTTPProxy' },
    tool_auth: {
        auth_type: { type: String, enum: ['password', 'Token','API Key'] },
        auth_username: String,
        auth_password: String,
        auth_token: String
    },
    status_category:{
        New : [],
        In_Progress : [],
        Closed : []
    },
    //sync flow
    tool_users: [{
        user_name:  {type:String},
        user_email: {type:String} ,
        user_display_name:{type:String},
        user_allocation: [{
            role_name: {type:String},
            project_name: {type:String},
            project_key:{type:String}
        }]
    }]
}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

tool_schema.post('save', handleDuplicate);
tool_schema.post('update', handleDuplicate);
tool_schema.post('findOneAndUpdate', handleDuplicate);
tool_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('tool', tool_schema);