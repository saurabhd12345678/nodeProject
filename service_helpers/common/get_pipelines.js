let pipeline = require('../../models/pipeline');
let application = require('../../models/application');
module.exports = {
    get_pipelines:async(application_key)=>{
        try{
            
            let application_data = await application.findOne({"application_key":application_key}).populate('pipelines').lean();
            return application_data.pipelines;
        }catch(error){
            throw new Error(error.message);
        }
    }
}