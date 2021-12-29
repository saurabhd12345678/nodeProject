var mongoose = require('mongoose');

var existing_code_analysis_schema = new mongoose.Schema({
    code_analysis_project_id : String,
    code_analysis_project_key: {type: String,required: true},
    code_analysis_project_name : String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    code_analysis_tool:{type:String,enum:['Sonarqube']}
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_code_analysis_schema.post('save', handleDuplicate);
existing_code_analysis_schema.post('update', handleDuplicate);
existing_code_analysis_schema.post('findOneAndUpdate', handleDuplicate);
existing_code_analysis_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_code_analysis_project' , existing_code_analysis_schema);