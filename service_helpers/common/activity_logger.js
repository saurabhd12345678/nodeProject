var pipeline = require('../../models/pipeline');
var activity_log=require('../../models/activity_log')
var jwt = require("jsonwebtoken");

module.exports = {
logActivity: async (application_key,pipeline_key,msg,token) => {
    try {
        let pipeline_name="-";
        var initiated_by = "";
        if(token != "System")
        {
            var decoded =  jwt.verify(token, process.env.SECRET_KEY);
            initiated_by = decoded.User;
        }      
        else{
            initiated_by = token;
        }

 

            if(pipeline_key != "-" && typeof pipline_key != undefined )
            {
                let pipeline_data = await pipeline.findOne({"pipeline_key":pipeline_key})

                 pipeline_name=pipeline_data.pipeline_name;
               
            }

var log={
    application_key: application_key,
    event:msg,
    pipeline_name: pipeline_name,
    initiate_by:initiated_by
}
  await activity_log.create(log);

    } catch (err) {
        
        throw err;
    }   
}
}