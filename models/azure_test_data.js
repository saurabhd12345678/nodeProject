var mongoose = require('mongoose');
var azure_test_schema = new mongoose.Schema({
    pipeline_key: { type: String},
    build_number: { type: Number }, //build no
    total_test : { type:Number},
    test_result : { type: String, uppercase: true }, //test_data.result 
    test_pass_count : { type:Number},
    test_duration: { type : Number}, //"duration": 31713,
    test_fail_count : {type : Number }
    }, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

//azure_test_schema.index({ build_project_key: 1, build_number: 1 });

azure_test_schema.post('save', handleDuplicate);
azure_test_schema.post('update', handleDuplicate);
azure_test_schema.post('findOneAndUpdate', handleDuplicate);
azure_test_schema.post('insertMany', handleDuplicate);

azure_test_schema.index({ pipeline_key: 1 });
//azure_test_schema.index({ tool_project_key: 1, job_name: 1 });


module.exports = mongoose.model("azure_data", azure_test_schema);
