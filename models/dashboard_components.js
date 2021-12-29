var mongoose = require('mongoose');

var dashboard_components_schema = new mongoose.Schema({
    dashboard_component_key :  {type : String,required: true,unique:true,uppercase: true},
    dashboard_components_display_name: {type: String,required: true},
    tool_name : {type : String},
    tool_category : {type : String},
  
} , {timestamps : true});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

dashboard_components_schema.post('save', handleDuplicate);
dashboard_components_schema.post('update', handleDuplicate);
dashboard_components_schema.post('findOneAndUpdate', handleDuplicate);
dashboard_components_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('dashboard_components' , dashboard_components_schema);