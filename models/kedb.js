var mongoose = require('mongoose');
var kedb_schema = new mongoose.Schema({
        
        fixTypes: { type : String },
		issuename :{ type : String , required : true , unique : true},
        issuedescription: {type : String, required : true , unique : true},
        fixTypes: { type : String },
        aiml: { type : String },
        fixdetails: { type : String },
        refLinks: { type : String },
        severity: { type : String },
        filename:[{ type: String }]

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};


kedb_schema.post('save', handleDuplicate);
kedb_schema.post('update', handleDuplicate);
kedb_schema.post('findOneAndUpdate', handleDuplicate);
kedb_schema.post('insertMany', handleDuplicate);


module.exports = mongoose.model("kedb", kedb_schema);