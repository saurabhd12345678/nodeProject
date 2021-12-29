var mongoose = require('mongoose');

var existing_planning_user_schema = new mongoose.Schema({
    application_key:{type:String},
    planning_user_name:{type:String},
    planning_user_display_name:{type:String},
    planning_user_key:{type:String},
    planning_user_email:{type:String},
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool',required: true },
    planning_tool:{type:String,enum:['Jira']}
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_planning_user_schema.post('save', handleDuplicate);
existing_planning_user_schema.post('update', handleDuplicate);
existing_planning_user_schema.post('findOneAndUpdate', handleDuplicate);
existing_planning_user_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_planning_user' , existing_planning_user_schema);