var mongoose = require("mongoose");

var code_security_data_schema = new mongoose.Schema(
  {
    code_security_val: [{ type: Number }],
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

code_security_data_schema.post("save", handleDuplicate);
code_security_data_schema.post("update", handleDuplicate);
code_security_data_schema.post("findOneAndUpdate", handleDuplicate);
code_security_data_schema.post("insertMany", handleDuplicate);

module.exports = mongoose.model("code_security_data", code_security_data_schema);
