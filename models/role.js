var mongoose = require('mongoose');
var role_schema = new mongoose.Schema({
    
		role_key: {type : String, required : true , unique : true},
		role_name :{ type : String , required : true , unique : true},
        action_permissions : [{type: mongoose.Schema.Types.ObjectId, ref: 'action_permission'}],
        screen_permissions : [{type: mongoose.Schema.Types.ObjectId, ref: 'screen_permission'}],
		createdBy : {type : String ,required : true}
		
	
}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};


role_schema.post('save', handleDuplicate);
role_schema.post('update', handleDuplicate);
role_schema.post('findOneAndUpdate', handleDuplicate);
role_schema.post('insertMany', handleDuplicate);


module.exports = mongoose.model("role", role_schema);
