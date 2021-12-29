var mongoose = require("mongoose");

var spike_testing_data_schema = new mongoose.Schema(
  {
    spike_testing_val: [[{ type: Number }]],
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

spike_testing_data_schema.post("save", handleDuplicate);
spike_testing_data_schema.post("update", handleDuplicate);
spike_testing_data_schema.post("findOneAndUpdate", handleDuplicate);
spike_testing_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("spike_testing_data", spike_testing_data_schema);
