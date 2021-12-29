var mongoose = require('mongoose');
 
var maturity_record_schema = new mongoose.Schema({
    application_key:{type:String},
    categories:[{
        category_name:{type:String},
        category_key:{type:String},
        category_questions:[{
            question:{type:String},
            answer_options:[{
                option_index:{type:Number},
                option_value:{type:String},
                option_weight:{type:Number}
            }],
        }],
        category_selections:[],
        category_weights:[]
    }],
    
    
   
})
var handleDuplicate = (error, doc, next) => {
if (error.name === 'MongoError' && error.code === 11000) {
next(new Error('There was a duplicate key error'));
} else {
next();
}
};
 
maturity_record_schema.post('save', handleDuplicate);
maturity_record_schema.post('update', handleDuplicate);
maturity_record_schema.post('findOneAndUpdate', handleDuplicate);
maturity_record_schema.post('insertMany', handleDuplicate);
 
module.exports = mongoose.model('maturity_record',maturity_record_schema); 
 