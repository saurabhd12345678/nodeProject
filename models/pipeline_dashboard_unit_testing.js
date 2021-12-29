var mongoose = require("mongoose");

var pipeline_dashboard_unit_testing_schema = new mongoose.Schema(
  {
    unit_testing: [{ type: Number }],
    pipeline_key: { type: String },
    tool_url: { type: String }
  },
  { timestamps: true }
);

var handleDuplicate = (error, doc, next) => {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("There was a duplicate key error"));
  } else {
    next();
  }
};

pipeline_dashboard_unit_testing_schema.post("save", handleDuplicate);
pipeline_dashboard_unit_testing_schema.post("update", handleDuplicate);
pipeline_dashboard_unit_testing_schema.post("findOneAndUpdate", handleDuplicate);
pipeline_dashboard_unit_testing_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("pipeline_dashboard_unit_testing", pipeline_dashboard_unit_testing_schema);
