
var mongoose = require('mongoose');
var sla_pip_config_schema = new mongoose.Schema({

    pipeline_key: { type: String, unique: true },
    window: { type: Number },
    refresh_interval: { type: Number },



}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};

sla_pip_config_schema.post('save', handleDuplicate);
sla_pip_config_schema.post('update', handleDuplicate);
sla_pip_config_schema.post('findOneAndUpdate', handleDuplicate);
sla_pip_config_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('sla_pip_config', sla_pip_config_schema);

