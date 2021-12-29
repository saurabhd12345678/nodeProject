var mongoose = require('mongoose');
var permission_schema = new mongoose.Schema({
    

screen_code : {type : String,required : true, unique : true },
screen_key :{type : String,required : true, unique : true },
screen_name : {type : String,required : true, unique : true },
screen_description : {type : String },
is_active : {type : Boolean ,default: true},
err_msg :  {type : String, default: "Screen is Temporary Suspended for all Users"},
action_permissions : [
 {type: mongoose.Schema.Types.ObjectId, ref: 'action_permission'}
]


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


module.exports = mongoose.model("screen_permission", permission_schema);
