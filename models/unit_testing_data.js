var mongoose = require("mongoose");

var unit_testing_data_schema = new mongoose.Schema(
  {
    unit_testing_val: [{ type: Number }],
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


unit_testing_data_schema.post("save", handleDuplicate);
unit_testing_data_schema.post("update", handleDuplicate);
unit_testing_data_schema.post("findOneAndUpdate", handleDuplicate);
unit_testing_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("unit_testing_data", unit_testing_data_schema);
