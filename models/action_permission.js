var mongoose = require('mongoose');
var permission_schema = new mongoose.Schema({
    permission_code : {type : String ,required : true,unique : true},
    permission_id : { type : String,required: true, unique: true },
	permission_name :  { type : String,required: true, unique: true },
	permission_description : { type : String},
	is_active : {type : Boolean ,default: true},
    error_msg  : {type : String, default: "Service is Temporary Suspended for all Users"},
    is_view_default : {type : Boolean , default : false}


}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};


permission_schema.post('save', handleDuplicate);
permission_schema.post('update', handleDuplicate);
permission_schema.post('findOneAndUpdate', handleDuplicate);
permission_schema.post('insertMany', handleDuplicate);


module.exports = mongoose.model("action_permission", permission_schema);
