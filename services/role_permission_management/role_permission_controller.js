
const { get_action_permission_list } = require('./role_permission_service');
const role_permission_service = require('./role_permission_service');
const  RoleManager  = require('../../middlewares/role_manager');
const { response } = require('express');
var token_method = require("../../service_helpers/verify_token");
module.exports = (app) => {
    app.post("/api/createNewRole", async (req, res) => {

        if(!(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.role_name)))
      {
        try {

         let response = await role_permission_service.create_new_role(req.body)
          res.status(200).send({ data: response });
        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    }
    else
    {
        res.status(500).send({
            status: false,
            message : "Format not matched"
          });
    }
    });

    app.post("/api/createNewActionPermission",token_method.verifyToken,async(req,res)=>{

        try{

            let response = await role_permission_service.create_new_action_permission(req.body)
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.post("/api/createNewScreenPermission",token_method.verifyToken,async(req,res)=>{

        try{
            let response = await role_permission_service.create_new_screen_permission(req.body)
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.get("/api/getActionPermissionList",token_method.verifyToken,async(req,res)=>{

        try{
            let response = await role_permission_service.get_action_permission_list()
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.get("/api/getScreenPermissionList",token_method.verifyToken,async(req,res)=>{

        try{

            let response = await role_permission_service.get_screen_permission_list()
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.get("/api/getRoleManagementList",token_method.verifyToken,async(req,res)=>{

        try{

           let response = await role_permission_service.get_role_list_data()
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });


    app.put("/api/updateRolePermissionData",token_method.verifyToken,async(req,res)=>{

        try{

          let response = await role_permission_service.update_role_permission_data(req.body)
            res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });


    app.post("/api/get_screen_permission_access",token_method.verifyToken,async(req,res)=>{

        try{

         // var response = await role_permission_service.get_screen_permission_access(req.body)
         let response = await RoleManager.getScreenPermissionAccessOptimized(req.body)

             res.status(200).send({"data":response});

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.post("/api/testingActionPermissionAccess",token_method.verifyToken,async(req,res)=>{

        try{

        let user_name  = req.body.user_name
        let permission_code = req.body.permission_code
        let application_key = req.body.application_key
        let permissionAccess = await RoleManager.getScreenPermissionAccessOptimized(user_name,permission_code,application_key)
          //var response = await role_permission_service.get_screen_permission_access(req.body)

        //   var response = {
        //       "permissionAccess" : permissionAccess
        //    }
             res.status(200).send(permissionAccess);

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });




    app.post("/api/sendHtml",async(req,res)=>{

        try{

            let response = await role_permission_service.sendHtml(req.body)
             res.status(200).send(response);

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });

    app.get("/api/getHtml",async(req,res)=>{

        try{

            let response = await role_permission_service.getHtml()
             res.status(200).send(response);

        }
        catch(error){
            res.status(500).send({"data":error.message});
        }
    });









 }
