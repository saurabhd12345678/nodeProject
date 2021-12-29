var mongoose = require("mongoose");

var stress_testing_data_schema = new mongoose.Schema(
  {
    stress_testing_val: [[{ type: Number }]],
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

stress_testing_data_schema.post("save", handleDuplicate);
stress_testing_data_schema.post("update", handleDuplicate);
stress_testing_data_schema.post("findOneAndUpdate", handleDuplicate);
stress_testing_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("stress_testing_data", stress_testing_data_schema);
