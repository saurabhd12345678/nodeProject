
var mongoose = require('mongoose');
var itsm_incidents_schema = new mongoose.Schema({

    application_key: { type: String },
    pipeline_key: { type: String },
    opened_at: { type: String },
    calendar_stc: { type: String },
    closed_at: { type: String },
    incident_state: { type: String },
    incident_number: { type: String },
    Description:{ type: String }



}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};

itsm_incidents_schema.post('save', handleDuplicate);
itsm_incidents_schema.post('update', handleDuplicate);
itsm_incidents_schema.post('findOneAndUpdate', handleDuplicate);
itsm_incidents_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('itsm_incidents', itsm_incidents_schema);

