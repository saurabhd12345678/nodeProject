const mongoose = require('mongoose');

const workflow_master_task_schema = new mongoose.Schema({
    task_name: { type: String, required: true },
    task_key: { type: String, required: true, unique: true },
    tool_name: { type: String },
    create_project_required: { type: Boolean, default: false },
    task_dashboard_components:[{type: mongoose.Schema.Types.ObjectId, ref: 'pipeline_dashboard_components'}],
    task_fields: [{
        id: { type: Number, required: true },
        type: { type: String, required: true, enum: ['select', 'textBox'] },
        label: { type: String, required: true },
        options: [
            { type: String, default: [] }
        ]
    }],
    task_conditions: [
        {
            field_key: { type: String, required: true },
            field_display_label: { type: String, required: true },
            field_type: { type: String, required: true, enum: ['select', 'textBox'] }
            // ,
            // field_options: [ { type: String }
            // ]
        }]
}, { timestamps: true, collection: 'workflow_master_task' });
const handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};
workflow_master_task_schema.index({ task_key: 1 });


workflow_master_task_schema.post('save', handleDuplicate);
workflow_master_task_schema.post('update', handleDuplicate);
workflow_master_task_schema.post('insertMany', handleDuplicate);



module.exports = mongoose.model('workflow_master_task', workflow_master_task_schema);