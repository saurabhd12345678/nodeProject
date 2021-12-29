var mongoose = require('mongoose');
var dast_qualys_data_schema = new mongoose.Schema({
    pipeline_key: { type: String},
    build_number:{ type:String},
    crawling_time:{ type:String} ,
    Assesment_Time: { type:String},
    Requests_Performed:{ type:String} ,
    Links_Crawled: { type:String},
    // Unexpected_Errors: { type:String},
    // Requests_Crawled: { type:String},
    // Operating_Systems: { type:String},
    vulnerabilities: { type:String},
    sensitive_contents: { type:String},
    Information_Gathered: { type:String},
    Level_5: { type:String},
    Level_4: { type:String},
    Level_3: { type:String},
    Level_2: { type:String},
    Level_1:{ type:String},
    Cross_Site: { type:String},
    SQL_Injection: { type:String},
    Information_Disclosure: { type:String},
    Path_Disclosure: { type:String},
    Injection: { type:String}, 
    Broken_Authentication:{ type:String},
    Sensitive_Data: { type:String},
    XML_XXE: { type:String},
    Broken_Access: { type:String},
    Security_Misconfiguration: { type:String},
    Cross_XSS: { type:String},
    Insecure: { type:String},
    Using_Vulnerabilities: { type:String},
    Insufficient_Logging: { type:String},
    Links_Collected:{type:String},
    Ajax_Links_Crawled:{type:String},
    Requests_Crawled:{type:String},
    Unexpected_Errors:{type:String}, 
    Avg_Response_Time:{type:String},
    }, { timestamps: true });

var handleDuplicate = (error, doc, next) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('There was a duplicate key error'));
    } else {
        next();
    }
};

dast_qualys_data_schema.post('save', handleDuplicate);
dast_qualys_data_schema.post('update', handleDuplicate);
dast_qualys_data_schema.post('findOneAndUpdate', handleDuplicate);
dast_qualys_data_schema.post('insertMany', handleDuplicate);

dast_qualys_data_schema.index({ pipeline_key: 1 });

module.exports = mongoose.model("dast_qualys_data", dast_qualys_data_schema);
