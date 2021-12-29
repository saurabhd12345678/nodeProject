var mongoose = require('mongoose');
var sprint = new mongoose.Schema({

        tool_project_key: { type: String },
        // pipeline_key: {type: String},
        sprint_id: { type: String },
        sprint_logical_name: { type: String },
        self: { type: String },
        start_date: { type: Date },//same as issue start date
        end_date: { type: Date },
        complete_date: { type: Date },
        sprint_active: { type: Boolean , default: false},
        story_points: {
            points_committed: { type: Number },
            points_completed: { type: Number },
            points_added: { type: Number },
            points_removed: { type: Number },
        },
        epics: [{ type: String, default: [] }],//
        stories: [{ type: String, default: [] }],//
        bugs: [{ type: String, default: [] }],//
        tasks: [{ type: String, default: [] }],
        activated_date: { type:Date },
        application_key : {type : String}


}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

sprint.post('save', handleDuplicate);
sprint.post('update', handleDuplicate);
sprint.post('insertMany', handleDuplicate);

sprint.index({ application_key: 1 });
sprint.index({ tool_project_key: 1 });
sprint.index({ sprint_id: 1 });
sprint.index({ application_key: 1, sprint_id: 1 });
sprint.index({ tool_project_key: 1, sprint_id: 1 });

module.exports = mongoose.model('sprint', sprint);

