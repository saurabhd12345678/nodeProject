
var mongoose = require('mongoose');

var activity_log_schema = new mongoose.Schema({
    
    application_key: { type: String, required: true },
    event: { type: String },
    pipeline_name: { type: String ,default:"-"},
    initiate_by: { type: String, default: "" },
    status_code: { type: Number}   
    

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};


activity_log_schema.post('save', handleDuplicate);
activity_log_schema.post('update', handleDuplicate);
activity_log_schema.post('findOneAndUpdate', handleDuplicate);
activity_log_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('activity_log', activity_log_schema);

