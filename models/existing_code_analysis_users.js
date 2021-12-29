var mongoose = require('mongoose');

var existing_code_analysis_user_schema = new mongoose.Schema({
    application_key:{type:String},
    code_analysis_login:{type:String},
    code_analysis_user_name:{type:String},
    code_analysis_user_email:{type:String},
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool',required: true },
    code_analysis_tool:{type:String,enum:['Sonarqube']}
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_code_analysis_user_schema.post('save', handleDuplicate);
existing_code_analysis_user_schema.post('update', handleDuplicate);
existing_code_analysis_user_schema.post('findOneAndUpdate', handleDuplicate);
existing_code_analysis_user_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_code_analysis_user' , existing_code_analysis_user_schema);