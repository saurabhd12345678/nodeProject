var mongoose = require('mongoose');

var existing_planning_schema = new mongoose.Schema({
    planning_project_id: String,
    planning_project_key: {
        type: String,
        required: true
    },
    planning_project_name: String,
    planning_self: String,
    tool_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
    planning_tool: { type: String, enum: ['Jira', 'Azure Boards'] }
}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

existing_planning_schema.post('save', handleDuplicate);
existing_planning_schema.post('update', handleDuplicate);
existing_planning_schema.post('findOneAndUpdate', handleDuplicate);
existing_planning_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('existing_planning_project', existing_planning_schema);