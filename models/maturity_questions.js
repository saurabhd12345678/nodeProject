var mongoose = require('mongoose');

var maturity_question_schema = new mongoose.Schema({
    category_name:{type:String , required : true , unique : true },
    category_key:{type:String},
    category_questions:[{
        question:{type:String},
        answer_options:[
            {
                option_index:{type:Number},
                option_value:{type:String},
                option_weight:{type:Number}
            }
        ],
    }],
    category_selections:[],
    category_weights:[],
    category_recommendations:[{
        mi_level:{type:Number},
        category_recommendation:[]
    }]

    
})
var handleDuplicate = (error, doc, next) => {
if (error.name === 'MongoError' && error.code === 11000) {
next(new Error('Cayegory Name Already Exist'));
} else {
next();
}
};
 
maturity_question_schema .post('save', handleDuplicate);
maturity_question_schema .post('update', handleDuplicate);
maturity_question_schema .post('findOneAndUpdate', handleDuplicate);
maturity_question_schema .post('insertMany', handleDuplicate);
 
module.exports = mongoose.model('maturity_question',maturity_question_schema ); 
 