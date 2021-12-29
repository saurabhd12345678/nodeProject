var mongoose = require('mongoose');

var tool_master_datas_schema = new mongoose.Schema({



    tool_category: { type: String },
    tool_index: { type : Number},
    tool_name: { type: String },
    is_provisioning: { type: Boolean },
    is_active: { type: Boolean },
    tool_tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'workflow_master_task' }],
    //    task_dashboard_components:[{type: mongoose.Schema.Types.ObjectId, ref: 'dashboard_components'}]






}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

tool_master_datas_schema.post('save', handleDuplicate);
tool_master_datas_schema.post('update', handleDuplicate);
tool_master_datas_schema.post('findOneAndUpdate', handleDuplicate);
tool_master_datas_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('tool_master_data', tool_master_datas_schema);