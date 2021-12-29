
var mongoose = require('mongoose');

var demo_table_schema = new mongoose.Schema({


    demo_html :  { type : String},


}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(newError('There was a duplicate key error'));
    } else {
        next();
    }
};


demo_table_schema.post('save', handleDuplicate);
demo_table_schema.post('update', handleDuplicate);
demo_table_schema.post('findOneAndUpdate', handleDuplicate);
demo_table_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('demo_table', demo_table_schema);

