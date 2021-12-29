var mongoose = require("mongoose");

var monitoring_env_data_schema = new mongoose.Schema(
  {
    monitoring_env_val: [{ type: Number }],
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

monitoring_env_data_schema.post("save", handleDuplicate);
monitoring_env_data_schema.post("update", handleDuplicate);
monitoring_env_data_schema.post("findOneAndUpdate", handleDuplicate);
monitoring_env_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("monitoring_env_data", monitoring_env_data_schema);
