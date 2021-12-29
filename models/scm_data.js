var mongoose = require('mongoose');
var scm_data_schema = new mongoose.Schema({
    type: { type: String, enum: ["PULL", "COMMIT"] },//
    commit_id: { type: String },
    commit_msg: { type: String },
    commit_author: { type: String },
    commit_timestamp: { type: Date },
    commit_branch: { type: String },
    commit_project_key: { type: String },//scm_project_key
    commit_project_id: { type: String },//scm_project_id
    commit_for_build_id: { type: String },
    commit_plan_issues: [{ type: String }],//jira issues
    pipeline_key: { type: String },//genius
    pull_project_key: { type: String },
    pull_reviewers: [{ type: String }],
    pull_source: { type: String },
    pull_destination: { type: String },
    pull_author: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    closedAt: { type: Date },
    pull_state: { type: String },
    pull_status: { type: String },
    pull_title: { type: String },
    pull_desc: { type: String },
    pull_id: { type: Number },
    is_pr_deleted: { type: Boolean, default: false },
    stats: {
        additions: { type: Number },
        deletions: { type: Number },
        edits:{type: Number},
        total: { type: Number }
    }
}, { timestamps: true });


scm_data_schema.index({ commit_id: 1, commit_timestamp: 1 });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

scm_data_schema.post('save', handleDuplicate);
scm_data_schema.post('update', handleDuplicate);
scm_data_schema.post('findOneAndUpdate', handleDuplicate);
scm_data_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('scm_data', scm_data_schema);
