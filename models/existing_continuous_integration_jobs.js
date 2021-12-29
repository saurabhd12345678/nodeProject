var mongoose = require('mongoose');

var existing_ci_schema = new mongoose.Schema({
    ci_project_name : {type: String,
        required: true},
    ci_project_url : String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    definition_id : {type: Number},
    ci_tool:{type:String,enum:['Jenkins', 'Azure Devops']}    
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_ci_schema.post('save', handleDuplicate);
existing_ci_schema.post('update', handleDuplicate);
existing_ci_schema.post('findOneAndUpdate', handleDuplicate);
existing_ci_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_continuous_integration_job' , existing_ci_schema);