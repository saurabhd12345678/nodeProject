const mongoose = require('mongoose');
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

const user_schema = new mongoose.Schema({
    user_id: { type: String },
    user_name: { type: String, unique: true },
    is_admin : { type : Boolean},
    user_mail: { type: String, unique: true, lowercase: true, required: true },
    user_password: { type: String, required: true },
    user_roles: [{ type: String, default: [] }],
    user_allocation: [
        {
            role_name: [{ type: String, ref: 'role'}],
            application_name: { type: String },
            // pipelines: [{
            //     pipeline_key: { type: String },
            //     pipeline_name: { type: String },
            //     role_name: [{ type: String }],
            // }],
            application_key: { type: String },
            isAuthorized: { type: Boolean, default: false }
        }
    ],
    security_question: { type: String, required: true },
    security_answer: { type: String, required: true }
}, { timestamps: true });
const handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

user_schema.plugin(mongooseFieldEncryption, { fields: ["user_password"], secret: process.env.SECRET_KEY });

user_schema.post('save', handleDuplicate);
user_schema.post('update', handleDuplicate);
user_schema.post('insertMany', handleDuplicate);

user_schema.index({ user_id: 1 });
user_schema.index({ user_mail: 1 });


module.exports = mongoose.model('user', user_schema);