var mongoose = require('mongoose');

var template_schema = new mongoose.Schema({
        template_name: {type: String, unique: true},//Template1
       
        application_key:{type:String,required:true},
        is_custom: { type: Boolean, default: false, required: true },
        plan: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId ,ref: 'Tool'},
                is_sync: { type: Boolean},
                is_required: {type: Boolean}
        },
        scm: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId ,ref: 'Tool'},
                is_sync: { type: Boolean},
                is_required: {type: Boolean}
        },
        code_quality: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId ,ref: 'Tool'},
                is_sync: { type: Boolean},
                is_required: {type: Boolean}
        },
        code_security: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId ,ref: 'Tool'},
                is_sync: { type: Boolean},
                is_required: {type: Boolean}
        },
        artifactory: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId ,ref: 'Tool'},
                is_sync: { type: Boolean},
                is_required: {type: Boolean}
        },
        continuous_integration: {
                tool_name: { type: String },
                instance_name: { type: String },
                instance_id: { type: mongoose.Schema.Types.ObjectId ,ref: 'Tool'},
                is_sync: { type: Boolean},
                is_required: {type: Boolean}
        }

}, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
        if (error.name === 'MongoError' && error.code === 11000) {
                next(new Error('There was a duplicate key error'));
        } else {
                next();
        }
};

template_schema.post('save', handleDuplicate);
template_schema.post('update', handleDuplicate);
template_schema.post('findOneAndUpdate', handleDuplicate);
template_schema.post('insertMany', handleDuplicate);

module.exports = mongoose.model('template', template_schema);