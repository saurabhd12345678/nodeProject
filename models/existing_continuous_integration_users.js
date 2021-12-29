var mongoose = require('mongoose');

var existing_continuous_integration_user_schema = new mongoose.Schema({
    ci_user_full_name : {type: String,
        required: true},
    ci_user_url : String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    ci_tool:{type:String,enum:['Jenkins']},
    application_key:{type:String}
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_continuous_integration_user_schema.post('save', handleDuplicate);
existing_continuous_integration_user_schema.post('update', handleDuplicate);
existing_continuous_integration_user_schema.post('findOneAndUpdate', handleDuplicate);
existing_continuous_integration_user_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_continuous_integration_user' , existing_continuous_integration_user_schema);