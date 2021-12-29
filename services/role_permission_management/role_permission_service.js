var Role = require('../../models/role');
var ActionPermission = require('../../models/action_permission')
var ScreenPermission = require('../../models/screen_permission')
var generate_key = require('../../service_helpers/generate_key');
var User = require('../../models/user');
const user = require('../../models/user');
//const role_service = require('../role/role_service');
var ServiceConstants = require('../../service_helpers/service_constants');
var  RoleManager  = require('../../middlewares/role_manager')
var Application = require('../../models/application')
var demo_table = require('../../models/demo_table')


   module.exports.create_new_role = async (role) => {
        role.role_key = await generate_key.generateKey(role.role_name)
        try {

            let roleDoc = await Role.findOne(
                {
                    "role_name": role.role_name,
                },

            ).lean();

            if (roleDoc == null) {
                await Role.create(role)
                var new_create_role = await Role.findOne(
                    {
                     "role_key": role.role_key
                    }
                )
                return {
                    "status" : "Role created successfully",
                    "new_role" : new_create_role
                }
            } else {
                return "Role Already Exists"
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
    },

    module.exports.create_new_action_permission = async (permission) =>{
        try{
            permission.permission_id = await generate_key.generateKey(permission.permission_name)
            let permissionDoc = await ActionPermission.findOne(
                {
                    "permission_name": permission.permission_name,
                },

            ).lean();

            if (permissionDoc == null) {
                await ActionPermission.create(permission)
                return "Action Permission Created Successfully"
            } else {
                return "Action Permission Already Exists"
            }



        }catch(error){
            throw new Error(error.message);
        }
    },


    module.exports.create_new_screen_permission = async (screenPermission) =>{
        try{
            screenPermission.screen_key = await generate_key.generateKey(screenPermission.screen_name)
            let screenPermissionDoc = await ScreenPermission.findOne(
                {
                    "screen_name": screenPermission.screen_name,
                },

            ).lean();

            if (screenPermissionDoc == null) {
                await ScreenPermission.create(screenPermission)
                return "Screen Permission Created Succesfully"
            } else {
                return "Screenn Permission Already Exists"
            }


        }catch(error){
            throw new Error(error.message);
        }
    },

    module.exports.get_role_list_data = async () =>{
        try{

            var response= await Role.find().populate("screen_permissions").populate("action_permissions").lean()

            response.sort(function(a, b){
                if(a.role_name < b.role_name) { return -1; }
                if(a.role_name > b.role_name) { return 1; }
                return 0;
            })

            return response

        }catch(error){
            throw new Error(error.message);
        }
    },

    module.exports.update_role_permission_data = async (roleData) =>{
        try{


            await Role.update({"role_key" : roleData.role_key},{
                $set : {
                    "action_permissions" : roleData.action_permissions,
                    "screen_permissions" : roleData.screen_permissions
                }
            })
            var response = await Role.findOne({"role_key" : roleData.role_key}).populate("action_permissions").populate("screen_permissions").lean()
            return response

        }catch(error){
            throw new Error(error.message);
        }

    },


    module.exports.get_screen_permission_list = async () =>{
        try{

            var response= await ScreenPermission.find().populate("action_permissions").lean()
            for(var permission of response){
               for(var action of permission.action_permissions){
                   action.action_active = false
               }
            }


            for(var actionPermission of response){
                actionPermission.action_permissions.sort( (a,b)=>{
                    return (a === b)? 0 : a? -1 : 1;
                }

                )
             }



            return response

        }catch(error){
            throw new Error(error.message);
        }
    },

    module.exports.get_action_permission_list = async () =>{
        try{

            var response= await ActionPermission.find().lean()
            return response

        }catch(error){
            throw new Error(error.message);
        }
    },
    // get_screen_permission_access : async (req)=>{
    //     try{

    //         var user_name = req.user_name
    //         var screen_code = req.screen_code
    //         var application_key = req.application_key
    //         var permissionAccess = ServiceConstants.DENIED
    //          var isAdmin = false
    //         var response= await User.findOne({"user_name" : user_name}).lean()
    //         if (response.is_admin == undefined || response.is_admin == null){
    //             isAdmin = false
    //         }else{
    //             isAdmin = response.is_admin
    //         }
    //         if(isAdmin){
    //             return ServiceConstants.GRANT
    //         }else {
    //             for(var project of response.user_allocation){

    //                 if(project.application_key == application_key){
    //                     for(var role_name of project.role_name){

    //                         var roleData = await Role.findOne({"role_name" : role_name}).populate("screen_permissions")

    //                         for(var screen of roleData.screen_permissions){
    //                             if(screen.screen_code == screen_code){
    //                                 permissionAccess = ServiceConstants.GRANT
    //                                return permissionAccess
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //             if(permissionAccess == ServiceConstants.DENIED){
    //                 return ServiceConstants.DENIED
    //             }
    //         }
    //     }catch(error){
    //         throw new Error(error.message);
    //     }
    // },

    module.exports.sendHtml = async (html)=>{

        try{

            var response = await demo_table.create(html)

            return {
                status : "Success"
            }
        }catch(e){
            return {
                status : "Failure"
            }
        }




    },

    module.exports.getHtml = async ()=>{
        try{

            var response = await demo_table.find()

            return {
                status : "Success",
                response : response
            }
        }catch(e){
            return {
                status : "Failure"
            }
        }
    }


















