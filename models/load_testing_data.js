var mongoose = require("mongoose");

var load_testing_data_schema = new mongoose.Schema(
  {
    load_testing_val: [[{ type: Number }]],
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

load_testing_data_schema.post("save", handleDuplicate);
load_testing_data_schema.post("update", handleDuplicate);
load_testing_data_schema.post("findOneAndUpdate", handleDuplicate);
load_testing_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model(
  "load_testing_data",
  load_testing_data_schema
);
