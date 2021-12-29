
var mongoose = require('mongoose');
var snow_vsm_data_schema = new mongoose.Schema({

    application_key: { type: String },
    opened_at: { type: String },
    calendar_stc: { type: String },
    closed_at: { type: String },
    incident_state: { type: String },
    incident_number: { type: String }



}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};

snow_vsm_data_schema.post('save', handleDuplicate);
snow_vsm_data_schema.post('update', handleDuplicate);
snow_vsm_data_schema.post('findOneAndUpdate', handleDuplicate);
snow_vsm_data_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('snow_vsm_data', snow_vsm_data_schema);

