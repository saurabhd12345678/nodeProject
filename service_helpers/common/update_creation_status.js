var pipeline = require('../../models/pipeline');

module.exports = {
set_creation_status: async (pipeline_key, tool_category, status) => {
    let creation_status = [tool_category] + ".creation_status";

    try{
        await pipeline.findOneAndUpdate({ "pipeline_key": pipeline_key },
        {
            "$set": { [creation_status]: status }

        },
        { upsert: true })

        return("Successfully saved creation status");
    }
    catch(error){
        let err = new Error(error.message);
        throw err;
    }
}
}