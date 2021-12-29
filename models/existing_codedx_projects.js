var mongoose = require('mongoose');

var existing_codedx_project_schema = new mongoose.Schema({
    project_id : String,
    project_name : String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    // code_analysis_tool:{type:String,enum:['Sonarqube']}
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_codedx_project_schema.post('save', handleDuplicate);
existing_codedx_project_schema.post('update', handleDuplicate);
existing_codedx_project_schema.post('findOneAndUpdate', handleDuplicate);
existing_codedx_project_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_codedx_project' , existing_codedx_project_schema);