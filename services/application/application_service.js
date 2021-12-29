var User = require("../../models/user");
var Application = require("../../models/application");
var Tool = require("../../models/tool");
var itsm_data = require("../../models/snow_vsm_data");

/**
 * This function get user applications and pipelines
 * @param {Object} user_name
 */
(module.exports.getUserApplications = async (user_name) => {
  try {
    let applications = await User.findOne(
      {
        user_name: user_name,
      },
      { _id: 0, user_allocation: 1, is_admin: 1 }
    ).lean();

    if (applications && applications.hasOwnProperty('is_admin')) {
      var applicationList = await Application.find();
      let applicationObject = {
        user_allocation: applicationList,
      };

      return applicationObject;
    } else {
      return applications;
    }
  } catch (err) {
    throw err;
  }
}),
  (module.exports.getUserApplicationsbyEmail = async (user_mail) => {
    try {
      let applications = await User.findOne(
        {
          user_mail: user_mail,
        },
        { _id: 0, user_allocation: 1, is_admin: 1 }
      ).lean();
      if (applications && applications.hasOwnProperty('is_admin')) {
        var applicationList = await Application.find();
        let applicationObject = {
          user_allocation: applicationList,
        };

        return applicationObject;
      } else {
        return applications;
      }
    } catch (err) {
      throw err;
    }
  }),
  (module.exports.getPlanningData = async (application_key) => {
    try {
      let applicationData = await Application.findOne({
        application_key: application_key,
      }).lean();

      if (applicationData.plan.length < 0) {
        return {
          status: false,
          message: "No Planning tool in the application",
        };
      } else {
        var tool_details = await Tool.find({
          tool_instance_name:
            applicationData.plan[0].instance_details.instance_name,
        });

        return {
          status: true,
          data: applicationData.plan[0],
          message: "Success",
          instance: tool_details[0],
        };
      }
    } catch (error) {
      return error;
    }
  });
(module.exports.getITSMData = async (application_key) => {
  try {
    let itsm_details = await itsm_data.find({ application_key: application_key });
    let tool_detailss=await Tool.find({application_key:application_key,tool_category:"ITSM"});
    // console.log("get details",itsm_details);
    // console.log("get tool---- details",tool_detailss);
    if (tool_detailss.length != 0) {
      return {
        status: true,
        data: itsm_details,
        message: "Success",
        instance: tool_detailss,
      };
    }
    else {
      return {
        status: false,
        data: itsm_details,
        message: "Failure",
      };
    }
  } catch (error) {
    return error;
  }
});
