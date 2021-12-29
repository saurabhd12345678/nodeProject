var User = require('../models/user');
var Application = require('../models/application');
const application = require('../models/application');
const user = require('../models/user');
var Role = require('../models/role')
var ServiceConstants = require('../service_helpers/service_constants');
const role = require('../models/role');


// const getActionPermissionAccess = async (user_name, permission_code, application_key) => {
//     try {
//         var permissionAccess = ServiceConstants.DENIED
//         var isAdmin = false

//         var loggedInUser = await User.findOne({ "user_name": user_name }).populate(
//             "roles"
//         )
//         var user_allocation = loggedInUser.user_allocation
//         if (loggedInUser.is_admin == undefined || loggedInUser.is_admin == null) {
//             isAdmin = false
//         } else {
//             isAdmin = loggedInUser.is_admin
//         }
//         if (isAdmin) {
//             return ServiceConstants.GRANT

//         } else {
//             for (let project of user_allocation) {
//                 if (project.application_key == application_key) {
//                     for (let role of project.role_name) {
//                         var roleData = await Role.findOne({ "role_name": role }).populate("action_permissions")
//                         for (let action of roleData.action_permissions) {
//                             if (action.permission_code == permission_code) {
//                                 permissionAccess = ServiceConstants.GRANT
//                                 return permissionAccess
//                             }
//                         }
//                     }
//                 }
//             }
//             if (permissionAccess == ServiceConstants.DENIED || permissionAccess == undefined) {
//                 return ServiceConstants.DENIED
//             }
//         }
//     } catch (error) {
//         throw new Error(error);
//     }

// }


const getActionPermissionAccessOptimized = async (user_name, permission_code, application_key) => {

    try {


        var checkUser = await User.findOne({"user_name" : user_name})
        if(checkUser.is_admin){
             return ServiceConstants.GRANT

        }else{


        var isAdmin = false

        var loggedInUser = await User.aggregate([{
            $match: { "user_name": user_name }

        },
        {
            $addFields: {
                user_allocation: {
                    $map: {
                        input: "$user_allocation",
                        as: "apps",
                        in: {

                            $cond: {
                                if: {
                                    $eq: ["$$apps.application_key", application_key]
                                },
                                then: "$$apps.role_name",
                                else: null
                            }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                role_array: {
                    $filter: {
                        input: "$user_allocation",
                        as: "d",
                        cond: {
                            $ne: [ "$$d", null ]
                        }
                    }
                }
            }

        },
        {
            $unwind: { path: "$role_array" }
        },
        {
            $lookup: {
                from: "roles",
                localField: "role_array",
                foreignField: "role_name",
                as: "roles"
            }
        },
        {

            $lookup: {
                from: "action_permissions",
                localField: "roles.action_permissions",
                foreignField: "_id",
                as: "action_permissions"
            }
        },

       {
            $addFields: {
                grantAccess: {
                    $filter: {
                        input: "$action_permissions",
                        as: "action",
                        cond: {

                          $eq: ["$$action.permission_code", permission_code]

                            }
                    }
                }
            }
       },
       {
           $project : {
               grantAccess : 1,is_admin : 1
           }
       }



        ])




        if(loggedInUser.length > 0 ){
            if (loggedInUser[0].is_admin == undefined || loggedInUser[0].is_admin == null) {
                isAdmin = false
            } else {
                isAdmin = loggedInUser[0].is_admin
            }
            if (isAdmin) {
                return ServiceConstants.GRANT

            } else {
                if(loggedInUser[0].grantAccess.length > 0){
                    return ServiceConstants.GRANT
                }else{
                    return ServiceConstants.DENIED
                }
            }

        }else{
            return ServiceConstants.DENIED
        }
        }





    } catch (error) {
        throw new Error(error);
    }

}



const getScreenPermissionAccessOptimized = async (req) => {



      var user_name = req.user_name
      var screen_code = req.screen_code
      var application_key = req.application_key

    try {

        var checkUser = await User.findOne({"user_name" : user_name})

        if(checkUser.is_admin){
             return ServiceConstants.GRANT

        }else{

            var isAdmin = false

        var loggedInUser = await User.aggregate([{
            $match: { "user_name": user_name }

        },
        {
            $addFields: {
                user_allocation: {
                    $map: {
                        input: "$user_allocation",
                        as: "apps",
                        in: {

                            $cond: {
                                if: {
                                    $eq: ["$$apps.application_key", application_key]
                                },
                                then: "$$apps.role_name",
                                else: null
                            }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                role_array: {
                    $filter: {
                        input: "$user_allocation",
                        as: "project",
                        cond: {
                            $ne: [ "$$project", null ]
                        }
                    }
                }
            }

         },
        {
            $unwind: { path: "$role_array" }
        },
        {
            $lookup: {
                from: "roles",
                localField: "role_array",
                foreignField: "role_name",
                as: "roles"
            }
        },
        {

            $lookup: {
                from: "screen_permissions",
                localField: "roles.screen_permissions",
                foreignField: "_id",
                as: "screen_permissions"
            }
        },

       {
            $addFields: {
                grantAccess: {
                    $filter: {
                        input: "$screen_permissions",
                        as: "screen",
                        cond: {

                          $eq: ["$$screen.screen_code", screen_code]

                            }
                    }
                }
            }
       },
       {
           $project : {
               grantAccess : 1,is_admin : 1
           }
       }



        ])




        if(loggedInUser.length > 0 ){
            if (loggedInUser[0].is_admin == undefined || loggedInUser[0].is_admin == null) {
                isAdmin = false
            } else {
                isAdmin = loggedInUser[0].is_admin
            }
            if (isAdmin) {
                return ServiceConstants.GRANT

            } else {
                if(loggedInUser[0].grantAccess.length > 0){
                    return ServiceConstants.GRANT
                }else{
                    return ServiceConstants.DENIED
                }
            }

        }else{
            return ServiceConstants.DENIED
        }


        }


    } catch (error) {
        throw new Error(error);
    }

}























module.exports = {  getActionPermissionAccessOptimized ,getScreenPermissionAccessOptimized};