var mongoose = require("mongoose");

var functional_testing_data_schema = new mongoose.Schema(
  {
    functional_testing_val: [{ type: Number }],
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

functional_testing_data_schema.post("save", handleDuplicate);
functional_testing_data_schema.post("update", handleDuplicate);
functional_testing_data_schema.post("findOneAndUpdate", handleDuplicate);
functional_testing_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("functional_testing_data", functional_testing_data_schema);
