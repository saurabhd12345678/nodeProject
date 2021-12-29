var mongoose = require('mongoose');
var code_analysis_schema = new mongoose.Schema({
    analysis_id: String,
    pipeline_key: String,
    build_number: Number,
    workflow_execution_number: Number,
    tool_project_key: { type: String },// project id in tool for example in sonarqube
    analysis_date: Date,
    nloc: Number,
    line_coverage: Number,//
    violations: Number,
    blocker_violations: Number,
    critical_violations: Number,
    major_violations: Number,
    bugs: Number,
    code_smells: Number,
    vulnerabilities: Number,
    technical_debt: Number,
    duplication: Number,
    sqale_rating: String,
    reliability_rating: String,
    security_rating: String,
    test_error: String,
    test_failure: String,
    skipped_tests: String,
    
}, { timestamps: true, collection: 'code_analysis' });

code_analysis_schema.index({ analysis_id: 1, build_number: 1});

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

code_analysis_schema.post('save', handleDuplicate);
code_analysis_schema.post('update', handleDuplicate);
code_analysis_schema.post('findOneAndUpdate', handleDuplicate);
code_analysis_schema.post('insertMany', handleDuplicate);

code_analysis_schema.index({ pipeline_key: 1 });
code_analysis_schema.index({ tool_project_key: 1 });
code_analysis_schema.index({ tool_project_key: 1, analysis_id: 1 });

module.exports = mongoose.model('Code_analysis', code_analysis_schema);