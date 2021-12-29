var mongoose = require('mongoose');

var existing_scm_project_schema = new mongoose.Schema({
    scm_tool: {type:String,enum:['Bitbucket','Azure Repos','GitLab']},
    scm_project_id: String,
    scm_project_key: {type: String, required: true},
    scm_project_type: String,
    scm_project_name: String,
    scm_project_self: String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    repos: [{

        scm_repo_name: String,
        scm_repo_self: String,
        scm_repo_id: { type: String },
        branches: [{
            scm_branch_id: String,
            scm_branch_display_id: String
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

existing_scm_project_schema.post('save', handleDuplicate);
existing_scm_project_schema.post('update', handleDuplicate);
existing_scm_project_schema.post('findOneAndUpdate', handleDuplicate);
existing_scm_project_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_scm_project', existing_scm_project_schema);