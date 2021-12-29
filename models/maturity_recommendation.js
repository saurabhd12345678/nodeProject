var mongoose = require('mongoose');

var maturity_recommendation = new mongoose.Schema({
    mi_level: {type:Number},
    categories:[
        {
            category_name:{type:String},
            category_key:{type:String},
            category_recommendation:[]
        }
    ]
});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

maturity_recommendation.post('save', handleDuplicate);
maturity_recommendation.post('find', handleDuplicate);
maturity_recommendation.post('update', handleDuplicate);
maturity_recommendation.post('findOneAndUpdate', handleDuplicate);
maturity_recommendation.post('findOne', handleDuplicate);

module.exports = mongoose.model('maturity_recommendation', maturity_recommendation);
