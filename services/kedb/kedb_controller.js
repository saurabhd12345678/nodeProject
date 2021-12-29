var kedb_service = require('./kedb_service');
const upload = require('../../service_helpers/amazons3');
var amazons3 = require('../../service_helpers/amazons3');
const downloadd = require('../../service_helpers/amazons3');


var { checkPermissions } = require('../../middlewares/role_manager');
var ServiceConstants = require('../../service_helpers/service_constants')
var token_method = require("../../service_helpers/verify_token");
const RoleManager = require('../../middlewares/role_manager');
var hasicorp_vault_file = require("../../connectors/hashicorp-vault/read_secret");
var activity_logger = require('../../service_helpers/common/activity_logger');
var vault_helper = require('../../service_helpers/hashicorp_vault');
const existing_code_analysis_projects = require('../../models/existing_code_analysis_projects');
const onboarding_create_service = require('../pipeline/onboarding_create/onboarding_create_service');
const application_configuration_service = require('../application_configuration/application_configuration_service');
module.exports = (app) => {

     app.post(
         "/api/kedb/formdata",
         async (req, res) => {
             try{
                  var formresponse = await kedb_service.saveformdata(req.body);
                res.status(200).send({ data: formresponse });
               } catch (error) {
                 res.status(500).send({ data: error.message });
               }
         });
         
        app.post('/api/v1/upload',async (req, res) => {
          try{
            amazons3.upload(req,res,function(err) {
              if(err) {
                  return res.send("Error uploading file."+err);
              }
              res.send("File is uploaded");
          });
          }catch(error){
         
            res.status(500).send({ data: error.message });
          }
         });
         
        app.get(
          "/api/kedb/s3get/:filename",
        async (req, res) => {
          try {
            var filename = req.params.filename;
            var abc = await amazons3.downloadd(filename);
          abc=abc.toString('utf-8');
          res.status(200).send({data: abc});
          
          } catch (error) {
            if(error.message=="The specified key does not exist.")
            {var abcde= "nodata";
            res.status(200).send({data : abcde})}
            else{
            res.status(500).send({ data: error.message });}
          }
        }
        );
         app.get(
            "/api/kedb/get",
            async (req, res) => {
              try {
                var kedbr = await kedb_service.getdata(
                );
                res.status(200).send({ data: kedbr });
              } catch (error) {
                res.status(500).send({ data: error.message });
              }
            }
          );
          app.get(
            "/api/kedb/get/:_id",
            async (req, res) => {
              try {
                eleid=req.params._id;
                var kedbr = await kedb_service.getdatabyid(eleid);
                res.status(200).send({ data: kedbr });
              } catch (error) {
                res.status(500).send({ data: error.message });
              }
            }
          );
          app.delete(
             "/api/kedb/del/:_id",
             async (req,res)=>{
                 try{
                     var id= req.params._id;
                   var kedbdr= await kedb_service.deldata( id);
                   res.status(200).send({ data: kedbdr});
                 }catch{
                  res.status(500).send({ data: error.message });
                 }
             }              
          );
          app.delete(
            "/api/v1/del/:filename",
            async (req,res)=>{
              try{
                var filename = req.params.filename;
                var kedbdrw= await amazons3.del(filename);
                res.status(200).send("deleted");
              }catch{
               res.status(500).send({data: error.message});
              }
          } 
          )
           app.put(
              "/api/kedb/edit/:_id",
              async (req,res,next)=>{
                try{
                  var id=req.params._id;
                  var kedbed= await kedb_service.updated(id,req.body);
                  res.status(200).send({ data: kedbed});
                }catch (err) {
                  next(err);
                }
              } 
           );
    }