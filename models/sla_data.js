
var mongoose = require('mongoose');
var sla_data_schema = new mongoose.Schema({

    config_id: { type: mongoose.Schema.Types.ObjectId, ref: 'sla_config' },
    pipeline_key: { type: String },
    timeline: [
        {
            value: { type: Number },
            indicator: { type: String },
            type: { type: String },
        }
    ]

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};

sla_data_schema.post('save', handleDuplicate);
sla_data_schema.post('update', handleDuplicate);
sla_data_schema.post('findOneAndUpdate', handleDuplicate);
sla_data_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('sla_data', sla_data_schema);

