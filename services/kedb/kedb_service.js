const kedb = require('../../models/kedb')
const kedb_service = {};
module.exports.saveformdata = async (data) => {
    try{
        var new_data = new kedb({
            
            fixTypes: data.fixTypes,
            issuename:data.issueName,
            issuedescription: data.issueDesc,
            fixTypes: data.fixTypes,
            aiml: data.aiml,
            fixdetails: data.fixdetails,
            refLinks: data.refLinks,
            severity: data.severity,
            filename: data.filename
        });
        const createData = await kedb.create(new_data);
       return createData;

    }catch (error) {
      
        throw new Error(error.message);
      
      }

},

module.exports.getdata = async (req,res) => {
    try {
      
        let data=await kedb.find()
        return data;
         
    } catch (error) {
      throw new Error(error.message);
    }
  },
  module.exports.getdatabyid = async (eleid) => {
    try {
      
        let data=await kedb.find({_id:eleid})
        return data;
         
    } catch (error) {
      throw new Error(error.message);
    }
  },
  module.exports.deldata = async (id) => {
    try {
      await kedb.findByIdAndRemove(id);
        
            return true; 
          }
  
     catch (error) {
      throw new Error(error.message);
    }
  }
  module.exports.updated = async(id,form) =>{
    try{
      
      const knn= await kedb.findByIdAndUpdate(id,form);
      return knn;
    }catch (error) {
      throw new Error(error.message);
    }
  }
  
