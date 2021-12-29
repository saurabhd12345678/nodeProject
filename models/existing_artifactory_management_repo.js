var mongoose = require('mongoose');

var existing_artifactory_management_repo_schema = new mongoose.Schema({
    artifactory_management_tool: { type: String, enum: ['JFrog'] },
    application_key:{type:String},
    repo_name: { type: String },
    description: { type: String },
    type: { type: String },
    url: { type: String },
    packageType: { type: String },
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_artifactory_management_repo_schema.post('save', handleDuplicate);
existing_artifactory_management_repo_schema.post('update', handleDuplicate);
existing_artifactory_management_repo_schema.post('findOneAndUpdate', handleDuplicate);
existing_artifactory_management_repo_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_artifactory_management_repo', existing_artifactory_management_repo_schema);