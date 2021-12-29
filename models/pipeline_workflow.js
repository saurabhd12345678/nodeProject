const mongoose = require('mongoose');

const pipeline_workflow_schema = new mongoose.Schema({
    pipeline_key: { type: String, required: true },
    machine_id: { type: String },
    pipeline_workflow_xstate_data: mongoose.Schema.Types.Mixed,
    pipeline_workflow_ui_data: {
        nodes: [{
            id: { type: Number },
            task: mongoose.Schema.Types.Mixed,
            status: { type: String, default: "READY" },
            label: { type: String }
        }],
        links: [{
            id: { type: Number },
            source: { type: Number },
            target: { type: Number },
            label: { type: String },
            conditions: mongoose.Schema.Types.Mixed
        }],
        displayLinks: [{
            id: { type: String },
            source: { type: String },
            target: { type: String },
            label: { type: String },
        }],
        displayNodes: mongoose.Schema.Types.Mixed,

    },
    workflow_progress_data: mongoose.Schema.Types.Mixed,
    execution_number: { type: Number, required: true },
    actions: [{ type: String, default: [] }],
    executed_by:{type:String},
    start_time: { type: Date },
    end_time: { type: Date }
}, { timestamps: true, collection: 'pipeline_workflow' });
const handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

pipeline_workflow_schema.post('save', handleDuplicate);
pipeline_workflow_schema.post('update', handleDuplicate);
pipeline_workflow_schema.post('insertMany', handleDuplicate);



module.exports = mongoose.model('pipeline_workflow', pipeline_workflow_schema);