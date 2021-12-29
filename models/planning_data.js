var mongoose = require('mongoose');
var PlanningDataSchema = new mongoose.Schema({
    tool_project_key: { type: String },
    issue_type: { type: String, uppercase: true },//bug/story
    issue_name: { type: String },
    issue_desc: { type: String },
    //pipeline_key: { type: String, required: true },
    issue_id: { type: String },
    issue_key: { type: String },
    assigned_to: { type: String },
    reporter: { type: String },
    issue_status: { type: String, enum: ['TO DO', 'IN PROGRESS', 'DOING', 'DONE', 'DEVELOPED', 'IN-PROGRESS', 'CLOSED'], uppercase: true }, // enum
    // issue_status: { type: String, enum: ['TO DO', 'IN PROGRESS', 'DONE','DOING'], uppercase: true }
    is_delete: { type: Boolean, default: false },
    issue_story_points: { type: Number, default: 0 },
    issue_sprint: { type: String, default: "" }, //empty if issue is in backlog
    timeoriginalestimate: { type: Number, default: 0 },
    timespent: { type: Number, default: 0 },
    issue_end_date: { type: Date },//Stores the actual end date according to the start date and the est hours
    issue_wastage_days: { type: Number, default: 0 },
    dependency: { type: String },
    isBacklog: { type: Boolean },
    actual_start_date: { type: Date },//this date is updated when the issue status becomes In progress
    actual_end_date: { type: Date },//this date is updated when the issue status becomes Completed.
    sprint_id: { type: String },
    application_key: { type: String, required: true },
    isSpillOver: { type: Boolean },
    phase: { type: String },
    completionTime: { type: Number, default: 0 },
    lT:{ type: Number, default: 0 },
    pT:{ type: Number, default: 0 }
}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

PlanningDataSchema.post('save', handleDuplicate);
PlanningDataSchema.post('update', handleDuplicate);

PlanningDataSchema.post('insertMany', handleDuplicate);

PlanningDataSchema.index({ application_key: 1 });
PlanningDataSchema.index({ tool_project_key: 1 });
PlanningDataSchema.index({ issue_id: 1 });
PlanningDataSchema.index({ issue_key: 1 });
PlanningDataSchema.index({ application_key: 1, issue_key: 1 });
PlanningDataSchema.index({ tool_project_key: 1, issue_key: 1 });

module.exports = mongoose.model('planning_data', PlanningDataSchema);

