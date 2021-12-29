var mongoose = require('mongoose');

var existing_dast_projects_schema = new mongoose.Schema({
    dast_project_id : String,
    dast_project_key: {type: String,required: true},
    dast_project_name : String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    dast_tool:{type:String,enum:['Qualys']}
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_dast_projects_schema.post('save', handleDuplicate);
existing_dast_projects_schema.post('update', handleDuplicate);
existing_dast_projects_schema.post('findOneAndUpdate', handleDuplicate);
existing_dast_projects_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_dast_projects' , existing_dast_projects_schema);