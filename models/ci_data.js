var mongoose = require('mongoose');
var continuous_integration_build_schema = new mongoose.Schema({
    build_number: { type: Number }, //build no
    build_cause: { type: String }, //triggered by  //build_data.actions.causes.shortDescription
    build_result: { type: String, uppercase: true, enum: ['SUCCESS', 'FAILURE', 'ABORTED', 'UNSTABLE', 'IN PROGRESS', 'INVALID'] }, //build_data.result
    build_fullDisplayName: { type: String }, //jobname#buildno //build_data.fullDisplayName
    build_url: { type: String }, //http://10.139.138.202:8080/job/broadRidge123AWS/74/   //build_data.url
    job_name: { type: String }, //from pipeline table
    job_url: { type: String }, //from pipeline table
    build_timestamp: { type: Date }, //"timestamp": 1596454260243, //build_data.timestamp,
    //time_ago: { type : String}, //calculate timestamp to current date
    pipeline_key: { type: String }, //pipelinekey in genius
    build_duration: { type: Number }, //"duration": 31713,
    build_planning_issue_set: [String],
    code_analysis_id: { type: String },
    build_commit_set: [{ type: String }], //total number of commits in dat build
    build_test: {
        unit_test: {
            totalCount: { type: Number },
            failCount: { type: Number },
            skipCount: { type: Number },
            testsResult: { type: String, enum: ['PASS', 'FAIL'] }
        },
        functional_test: {
            totalCount: { type: Number },
            failCount: { type: Number },
            skipCount: { type: Number },
            testsResult: { type: String, enum: ['PASS', 'FAIL'] }
        }
    },
    build_functional_test: {
        totalCount: { type: Number },
        failCount: { type: Number },
        skipCount: { type: Number },
        testsResult: { type: String, enum: ['PASS', 'FAIL'] }
    }

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

continuous_integration_build_schema.index({ build_project_key: 1, build_number: 1 });

continuous_integration_build_schema.post('save', handleDuplicate);
continuous_integration_build_schema.post('update', handleDuplicate);
continuous_integration_build_schema.post('findOneAndUpdate', handleDuplicate);
continuous_integration_build_schema.post('insertMany', handleDuplicate);

continuous_integration_build_schema.index({ pipeline_key: 1 });
continuous_integration_build_schema.index({ tool_project_key: 1, job_name: 1 });


module.exports = mongoose.model("ci_data", continuous_integration_build_schema);
