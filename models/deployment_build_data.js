var mongoose = require("mongoose");

var deployment_build_data_schema = new mongoose.Schema(
  {
    deployment_build_val: [{ type: Number }],
    application_key: { type: String },
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

deployment_build_data_schema.post("save", handleDuplicate);
deployment_build_data_schema.post("update", handleDuplicate);
deployment_build_data_schema.post("findOneAndUpdate", handleDuplicate);
deployment_build_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("deployment_build_data", deployment_build_data_schema);
