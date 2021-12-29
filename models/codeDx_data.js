var mongoose = require('mongoose');
var codeDx_schema = new mongoose.Schema({
    total_number_of_lines: { type: Number },
    total_source_files: { type: Number },
    total_comment_code: { type: Number },
    total_code_churn: { type: Number },
    total_complexity: {type: Number},
    pipeline_key:{type: String,required: true, unique: true},
    code_metrics: { type: Object},
    medium: {type: Object},
    info: {type: Object},
    high: {type: Object},
    low: {type: Object},
    critical: {type: Object},
    findings : {
        value : {type : String},
        count : {type : Number}
    },
    total_findings : {type : Number}
        // key: {type:String},
        // number_of_total_line: {type:Number},
        // complexity:{
        //     averageCcn: {type:Number},
        //     numFunctions: {type:Number},
        //     totalCcn: {type:Number},
        // },
        // codeChurn: {type:Number},
        // numFindings: {type:Number},
        // numSourceFiles: {type:Number},
        // numCommentLines: {type:Number},
    // }


} ,{ timestamps: true }
);
var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};
codeDx_schema.post('save', handleDuplicate);
codeDx_schema.post('update', handleDuplicate);
codeDx_schema.post('findOneAndUpdate', handleDuplicate);
codeDx_schema.post('insertMany', handleDuplicate);
module.exports = mongoose.model("codeDx_data", codeDx_schema);

