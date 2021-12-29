const { connect } = require("http2");
var User = require("../../models/user");
var token_method = require("../../service_helpers/verify_token");
var unirest = require("unirest");
const jwt_decode = require("jwt-decode");
//const { env } = require("node:process");
const APPLICATION_ID_DEV = "edd71824-79bc-4f18-adb5-07e356493177";
const APPLICATION_ID_PROD = "7863aac6-ed1c-4e41-bfd9-595c5d45d719";

const TENANT_ID_DEV = "02aa9fc1-18bc-4798-a020-e01c854dd434";
const TENANT_ID_PROD = "02aa9fc1-18bc-4798-a020-e01c854dd434";
const APPLICATION_DISPLAY_NAME_DEV = "canvas_devops_dev";
const APPLICATION_DISPLAY_NAME_PROD = "canvas_devops_demo";


var jwt = require("jsonwebtoken");
module.exports = {
  /**
   * This function registers a user in CanvasDevops portal using user object info
   * @param {Object} user
   */

  registerUser: async (user) => {
    try {
      let userDoc = await User.findOne(
        { user_name: user.user_name },
        { _id: 0, user_id: 1 }
      ).lean();
      if (userDoc != null) {
        return "User Name already exists";
      } else {
        let userDoc = await User.findOne(
          { user_mail: user.user_mail },
          { _id: 0, user_id: 1 }
        ).lean();
        if (userDoc != null) {
          return "User Email already exists";
        } else {
          userDoc = await User.findOne(
            { user_id: user.user_id },
            { _id: 0, user_id: 1 }
          ).lean();

          if (userDoc != null) {
            return "User Id already exists";
          } else {
            await User.create(user);

            return "Success";
          }
        }
      }
    } catch (err) {
      throw err;
    }
  },

  /**
   * This function checks authentication of user using user credentials
   * @param {Object} user
   */
  loginUser: async (user) => {
    try {
      let db_user = await User.findOne({
        user_mail: user.user_mail,
      });

      var is_admin = false;

      if (typeof db_user.is_admin != undefined && db_user.is_admin == true) {
        is_admin = true;
      }

      let login_return_user = {
        no_of_apps: db_user.user_allocation.length,
        user_name: db_user.user_name,
        user_mail: user.user_mail,
        is_admin: is_admin,
      };

      if (db_user == null) return { status: "Failed" };
      else if (db_user.user_password == user.user_password) {
        login_return_user = {
          no_of_apps: db_user.user_allocation.length,
          user_name: db_user.user_name,
          user_mail: db_user.user_mail,
          is_admin: is_admin,
        };

        return {
          status: "Success",
          user: login_return_user,
        };
      } else return { status: "Failed" };
    } catch (err) {
      throw err;
    }
  },

  getJWTToken: async (user) => {
    try {
      let db_user = await User.findOne({
        user_mail: user.user_mail,
      });
      let login_return_user;

      if (db_user == null || db_user == undefined) {
        return {
          status: "Failed",
          user: user,
        };
      } else {
        login_return_user = {
          no_of_apps: db_user.user_allocation.length,
          user_name: db_user.user_name,
          user_mail: db_user.user_mail,
        };

        return {
          status: "Success",
          user: login_return_user,
        };
      }
    } catch (err) {
      throw err;
    }
  },

  validateUser: async (access_token, mail) => {
    let user_mail;
    //active
    // issues
    // cliend id
    let decoded_token = jwt_decode(access_token);
  
    let iss = decoded_token.iss;
    let start = decoded_token.iat;
    let expiry = decoded_token.exp;
    let appDisplayName = decoded_token.app_displayname;

    let applicationId = decoded_token.appid;

    let upn = decoded_token.upn.toLowerCase();


    let fields = iss.split("/");

    let currentDate = new Date()

    var expiryFormatDate = new Date(expiry*1000);
    let tenant_id = fields[3];


    if(expiryFormatDate > currentDate){
      console.log(true)
    }else{
      console.log(false)
    }
    if (
      mail.toLowerCase() == upn &&
      appDisplayName == APPLICATION_DISPLAY_NAME_DEV &&
      applicationId == APPLICATION_ID_DEV &&
      tenant_id == TENANT_ID_DEV && expiryFormatDate > currentDate
    ) {
      return true
    } else {
      return false;
    }

    // await  unirest('GET', 'https://graph.microsoft.com/v1.0/me/')
    //   .headers({
    //     'Authorization': `Bearer ${access_token}`
    //   })
    //   .then((result) =>{

    //     user_mail = result.body.mail
    //   })

    // if(user_mail == mail){
    //   return true
    // }else{
    //  return false
    // }
  },
};
