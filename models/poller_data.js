var mongoose = require('mongoose');
var poller_data_schema = new mongoose.Schema({
    application_key: { type: String},
    scheduled_time: { type: String }, //time after which polling woll start for this application
    trigger: { type: String}
    }, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

poller_data_schema.post('save', handleDuplicate);
poller_data_schema.post('update', handleDuplicate);
poller_data_schema.post('findOneAndUpdate', handleDuplicate);
poller_data_schema.post('insertMany', handleDuplicate);

poller_data_schema.index({ application_key: 1 });



module.exports = mongoose.model("poller_data", poller_data_schema);
