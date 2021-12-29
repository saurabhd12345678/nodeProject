
var mongoose = require('mongoose');
var sla_config_schema = new mongoose.Schema({

    pipeline_key: { type: String },
    tool: { type: String },
    entity: { type: String },
    type: { type: String, enum: ['COUNT', 'PERCENTAGE'] },
    success: {
        criteria: { type: String, enum: ['GT', 'GTE', 'LT', 'LTE', 'EQ','BTWN'] },
        value: { type: Number }
    },
    warning: {
        criteria: { type: String, enum: ['GT', 'GTE', 'LT', 'LTE', 'EQ','BTWN'] },
        value: { type: Number }
    },
    error: {
        criteria: { type: String, enum: ['GT', 'GTE', 'LT', 'LTE', 'EQ','BTWN'] },
        value: { type: Number }
    },
    scope: { type: String, enum: ['PIPELINE', 'APPLICATION'] },
    last_run: { type: Date, default: null },
    status: { type: Boolean }



}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};

sla_config_schema.post('save', handleDuplicate);
sla_config_schema.post('update', handleDuplicate);
sla_config_schema.post('findOneAndUpdate', handleDuplicate);
sla_config_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('sla_config', sla_config_schema);

