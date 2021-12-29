var Sprint = require('../../models/sprint');
var PlanningData = require('../../models/planning_data');
var Application = require('../../models/application');
var Code_analysis = require('../../models/code_analysis');
var CI_Data = require('../../models/ci_data');
var calculate_kpis = require('../../service_helpers/calculate_application_kpis');

var unit_testing_data = require("../../models/unit_testing_data");
var functional_testing_data = require("../../models/functional_testing_data");
var code_security_data = require("../../models/code_security_data");

var moment = require('moment');
var load_testing_data = require('../../models/load_testing_data');
var spike_testing_data = require('../../models/spike_testing_data');
var stress_testing_data = require('../../models/stress_testing_data');
var monitoring_health_data = require("../../models/monitoring_health_data");
var monitoring_env_data = require("../../models/monitoring_env_data");
const monitoring_request_rate_data = require("../../models/monitoring_request_rate_data");
var deployment_build_data = require('../../models/deployment_build_data');
var deployment_status_data = require("../../models/deployment_status_data");
var pipeline = require("../../models/pipeline");
var pipeline_dashboard_components = require('../../models/pipeline_dashboard_components')
var dashboard_components = require('../../models/dashboard_components');
const { json } = require('body-parser');
const { join } = require('path');
const { ConnectionStates } = require('mongoose');

var PlanningDatas = require('../../models/planning_data');

moment().format();
var currentDate = new Date();
currentDate.setHours(23);
currentDate.setMinutes(59);
currentDate.setSeconds(59);


/**
 * This function gets build data for the application
 * @param {String} application_key
 *
 */

module.exports.addComponent = async (dashboard_component) => {
  try {
    //  pipeline_dashboard_components  dashboard_components
    await pipeline_dashboard_components.create(dashboard_component);
    return true;
  } catch (error) {
    throw error;
  }
},

  module.exports.getBuildData = async (application_key) => {
    try {
      let build = {
        build_ratio: 0,
        success_builds: 0,
        failure_builds: 0,
        aborted_builds: 0,
        unstable_builds: 0,
        total_builds: 0,
        periods: [],
      };

      let pipeline_keys = await getPipelineKeys(application_key);

      let filter_field_name = "week";
      let filter_intervals = 1;
      let total_duration = 4;
      let filterPeriods = Array.from(
        Array(Math.ceil(total_duration / filter_intervals)),
        (_, i) => i + 1
      );
      var date_interval = new Array();
      filterPeriods.forEach((period, index) => {
        let obj = {};
        obj["lte"] = moment()
          .subtract(filter_intervals * (period - 1), filter_field_name)
          .set({ hour: 23, minute: 59, second: 59 })
          .format();
        obj["gt"] = moment()
          .subtract(filter_intervals * period, filter_field_name)
          .set({ hour: 23, minute: 59, second: 59 })
          .format();
        let temp =
          filter_field_name.toUpperCase().charAt(0) +
          (filterPeriods.length - index).toString();
        obj["period"] = temp;
        date_interval.push(obj);
        build.periods.push({
          period: temp,
          success_builds: 0,
          failure_builds: 0,
          aborted_builds: 0,
          unstable_builds: 0,
        });
      });

      let ci_data = await CI_Data.aggregate([
        {
          $match: {
            pipeline_key: { $in: pipeline_keys },
          },
        },
        {
          $project: {
            _id: 0,
            pipeline_key: 1,
            build_number: 1,
            build_result: 1,
            [filter_field_name]: {
              $map: {
                input: date_interval,
                as: "date",
                in: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$createdAt", { $toDate: "$$date.gt" }] },
                        { $lte: ["$createdAt", { $toDate: "$$date.lte" }] },
                      ],
                    },
                    "$$date.period",
                    null,
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            [filter_field_name]: {
              $filter: {
                input: `$${filter_field_name}`,
                as: "a",
                cond: { $ne: ["$$a", null] },
              },
            },
          },
        },
        {
          $unwind: `$${filter_field_name}`,
        },
        {
          $group: {
            _id: {
              pipeline_key: "$pipeline_key",
              time_period: `$${filter_field_name}`,
              build_result: "$build_result",
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.pipeline_key": -1,
            "_id.time_period": -1,
            "_id.build_result": -1,
          },
        },
        {
          $group: {
            _id: {
              pipeline_key: "$_id.pipeline_key",
              build_result: "$_id.build_result",
            },
            builds: {
              $push: {
                success_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "SUCCESS"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
                failure_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "FAILURE"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
                aborted_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "ABORTED"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
                unstable_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "UNSTABLE"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
              },
            },
            periods: {
              $addToSet: {
                time_period: "$_id.time_period",
                count: "$count",
                pipeline_key: "$_id.pipeline_key",
                build_result: "$_id.build_result",
              },
            },
          },
        },
        {
          $unwind: { path: "$builds" },
        },
        {
          $group: {
            _id: "$_id.pipeline_key",
            success_builds: { $sum: "$builds.success_builds" },
            failure_builds: { $sum: "$builds.failure_builds" },
            aborted_builds: { $sum: "$builds.aborted_builds" },
            unstable_builds: { $sum: "$builds.unstable_builds" },
            periods: { $addToSet: "$periods" },
          },
        },
        {
          $addFields: {
            total_builds: {
              $sum: [
                {
                  $sum: [
                    { $sum: ["$success_builds", "$failure_builds"] },
                    "$aborted_builds",
                  ],
                },
                "$unstable_builds",
              ],
            },
          },
        },
        {
          $unwind: { path: "$periods" },
        },
        {
          $unwind: { path: "$periods" },
        },
        {
          $project: {
            _id: 0,
            pipeline_key: "$_id",
            success_builds: "$success_builds",
            failure_builds: "$failure_builds",
            aborted_builds: "$aborted_builds",
            unstable_builds: "$unstable_builds",
            build_ratio: {
              $multiply: [
                { $divide: ["$success_builds", "$total_builds"] },
                100,
              ],
            },
            periods: "$periods",
          },
        },
        {
          $group: {
            _id: {
              time_period: "$periods.time_period",
              build_result: "$periods.build_result",
            },
            data: {
              $addToSet: {
                build_ratio: "$build_ratio",
                success_builds: "$success_builds",
                failure_builds: "$failure_builds",
                aborted_builds: "$aborted_builds",
                unstable_builds: "$unstable_builds",
                pipeline_key: "$pipeline_key",
              },
            },
            count: { $sum: "$periods.count" },
            pipeline_keys: { $addToSet: "$pipeline_key" },
          },
        },
        {
          $group: {
            _id: "$_id.time_period",
            data: {
              $addToSet: "$data",
            },
            pipeline_keys: { $addToSet: "$pipeline_keys" },
            periods: {
              $push: {
                success_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "SUCCESS"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
                failure_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "FAILURE"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
                aborted_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "ABORTED"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
                unstable_builds: {
                  $cond: {
                    if: {
                      $eq: ["$_id.build_result", "UNSTABLE"],
                    },
                    then: "$count",
                    else: 0,
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            pipeline_keys: {
              $concatArrays: {
                $map: {
                  input: pipeline_keys,
                  as: "pipe",
                  in: "$$pipe",
                },
              },
            },
          },
        },
        {
          $unwind: { path: "$periods" },
        },
        {
          $group: {
            _id: "$_id",
            period_success: { $sum: "$periods.success_builds" },
            period_failure: { $sum: "$periods.failure_builds" },
            period_aborted: { $sum: "$periods.aborted_builds" },
            period_unstable: { $sum: "$periods.unstable_builds" },
            pipeline_keys: { $addToSet: "$pipeline_keys" },
            data: { $addToSet: "$data" },
          },
        },
        {
          $unwind: "$data",
        },
        {
          $unwind: "$data",
        },
        {
          $unwind: "$data",
        },
        {
          $group: {
            _id: {
              period: "$_id",
              pipeline_key: "$data.pipeline_key",
            },
            period_success: { $first: "$period_success" },
            period_failure: { $first: "$period_failure" },
            period_aborted: { $first: "$period_aborted" },
            period_unstable: { $first: "$period_unstable" },
            success_builds: { $first: "$data.success_builds" },
            failure_builds: { $first: "$data.failure_builds" },
            aborted_builds: { $first: "$data.aborted_builds" },
            unstable_builds: { $first: "$data.unstable_builds" },
            build_ratio: { $first: "$data.build_ratio" },
          },
        },
        {
          $group: {
            _id: "$_id.pipeline_key",
            time_period_data: {
              $addToSet: {
                period: "$_id.period",
                period_success: "$period_success",
                period_failure: "$period_failure",
                period_aborted: "$period_aborted",
                period_unstable: "$period_unstable",
              },
            },
            success_builds: { $first: "$success_builds" },
            failure_builds: { $first: "$failure_builds" },
            aborted_builds: { $first: "$aborted_builds" },
            unstable_builds: { $first: "$unstable_builds" },
            build_ratio: { $first: "$build_ratio" },
          },
        },
        {
          $group: {
            _id: null,
            build_ratio: { $sum: "$build_ratio" },
            no_of_pipeline_builds: { $sum: 1 }, //number of pipelines whos build data found in DB i.e. whos builds were run. So for remaining pipelines whose build never ran initial build_ratio should be 100%
            success_builds: { $sum: "$success_builds" },
            failure_builds: { $sum: "$failure_builds" },
            aborted_builds: { $sum: "$aborted_builds" },
            unstable_builds: { $sum: "$unstable_builds" },
            time_period_data: { $addToSet: "$time_period_data" },
          },
        },
        {
          $project: {
            _id: 0,
            build_ratio: {
              $divide: [
                {
                  $sum: [
                    "$build_ratio",
                    {
                      $multiply: [
                        {
                          $subtract: [
                            pipeline_keys.length,
                            "$no_of_pipeline_builds",
                          ],
                        },
                        100,
                      ],
                    },
                  ],
                },
                pipeline_keys.length,
              ],
            },
            success_builds: "$success_builds",
            failure_builds: "$failure_builds",
            aborted_builds: "$aborted_builds",
            unstable_builds: "$unstable_builds",
            total_builds: {
              $sum: [
                {
                  $sum: [
                    { $sum: ["$success_builds", "$failed_builds"] },
                    "$aborted_builds",
                  ],
                },
                "$unstable_builds",
              ],
            },
            time_period_data: "$time_period_data",
          },
        },
        {
          $unwind: "$time_period_data",
        },
        {
          $unwind: "$time_period_data",
        },
        {
          $group: {
            _id: "$time_period_data.period",
            success_builds: { $first: "$success_builds" },
            failure_builds: { $first: "$failure_builds" },
            aborted_builds: { $first: "$aborted_builds" },
            unstable_builds: { $first: "$unstable_builds" },
            total_builds: { $first: "$total_builds" },
            build_ratio: { $first: "$build_ratio" },
            period_success: { $first: "$time_period_data.period_success" },
            period_failure: { $first: "$time_period_data.period_failure" },
            period_aborted: { $first: "$time_period_data.period_aborted" },
            period_unstable: { $first: "$time_period_data.period_unstable" },
          },
        },
      ]);

      if (ci_data.length > 0) {
        build.build_ratio = Math.round(ci_data[0].build_ratio);
        build.success_builds = ci_data[0].success_builds;
        build.failure_builds = ci_data[0].failure_builds;
        build.aborted_builds = ci_data[0].aborted_builds;
        build.unstable_builds = ci_data[0].unstable_builds;
        build.total_builds = ci_data[0].total_builds;
        // ci_data.forEach((data) => {
        //   let period = (element) => element.period == data._id;
        //   let index = build.periods.findIndex(period);
        //   build.periods[index] = {
        //     period: data._id,
        //     success_builds: data.period_success,
        //     failure_builds: data.period_failure,
        //     aborted_builds: data.period_aborted,
        //     unstable_builds: data.period_unstable,
        //   };
        // });
        for (let data of ci_data) {
          let period = (element) => element.period == data._id;
          let index = build.periods.findIndex(period);
          build.periods[index] = {
            period: data._id,
            success_builds: data.period_success,
            failure_builds: data.period_failure,
            aborted_builds: data.period_aborted,
            unstable_builds: data.period_unstable,
          };

        }
      }

      return build;
    } catch (err) {
      throw err;
    }
  },

  module.exports.getComponetList = async (application_key, user_email) => {
    var available_component_list = [];
    var dashboard_preference_list = [];
    try {
      var dashboard_preference = await Application.findOne(
        { application_key: application_key },
        {
          _id: 0,
          dashboard_available_component: 1,
          users: { $elemMatch: { user_email: user_email.toLowerCase() } },
          dashboard_preference: 1,
        }
      );

      if (dashboard_preference.users.length > 0) {
        if (dashboard_preference.users[0].dashboard_preference.length > 0) {
          var dashboard_preference_component = await dashboard_components.find(
            { _id: dashboard_preference.users[0].dashboard_preference },
            { dashboard_component_key: 1 }
          );

          for (let preference of dashboard_preference.users[0]
            .dashboard_preference) {
            for (let list of dashboard_preference_component) {
              if (preference.equals(list._id)) {
                dashboard_preference_list.push(list.dashboard_component_key);
                break;
              }
            }
          }

          var dashboard_available_component = await dashboard_components.find(
            { _id: dashboard_preference.dashboard_available_component },
            { _id: 0, dashboard_component_key: 1 }
          );

          available_component_list = dashboard_available_component.map(
            (x) => x.dashboard_component_key
          );
        } else if (
          dashboard_preference.dashboard_available_component.length > 0
        ) {
          var dashboard_available_component = await dashboard_components.find(
            { _id: dashboard_preference.dashboard_available_component },
            { _id: 0, dashboard_component_key: 1 }
          );

          available_component_list = dashboard_available_component.map(
            (x) => x.dashboard_component_key
          );

          dashboard_preference_list = available_component_list;
        }
      }

      let dashboard_components_list = {
        dashboard_available_list: available_component_list,
        dashboard_preference_list: dashboard_preference_list,
      };
      return dashboard_components_list;
    } catch (error) {
      throw error;
    }
  },

  module.exports.saveDashboardPreference = async (dashboard_preference_data) => {
    try {
      var new_preference_ids = [];
      var user_email = dashboard_preference_data.user_email.toLowerCase();
      var application_key = dashboard_preference_data.application_key;

      var component_list = await dashboard_components.find(
        { dashboard_component_key: dashboard_preference_data.preference_list },
        { _id: 1, dashboard_component_key: 1 }
      );

      for (let preference of dashboard_preference_data.preference_list) {
        for (let list of component_list) {
          if (list.dashboard_component_key == preference) {
            new_preference_ids.push(list._id);
            break;
          }
        }
      }

      await Application.updateOne(
        { application_key: application_key, "users.user_email": user_email },
        {
          $set: {
            "users.$.dashboard_preference": new_preference_ids,
          },
        }
      );
      return { msg: "Success" };
    } catch (err) {
      throw err;
    }
  },

  module.exports.calculateAvailableList = async (application_key, user_email) => {
    let pipeline_keys = await getPipelineKeys(application_key);
    let tempresult;
    var available_component_list = []; //["SNOW"];
    try {
      var plan = await pipeline
        .find({
          $and: [
            { pipeline_key: { $in: pipeline_keys } },
            {
              "plan.creation_status": "SUCCESS",
            },
          ],
        })
        .countDocuments();

      tempresult = plan > 0 ? available_component_list.push("PLAN") : {};

      var code_quality = await pipeline
        .find({
          $and: [
            { pipeline_key: { $in: pipeline_keys } },
            {
              "code_quality.creation_status": "SUCCESS",
            },
          ],
        })
        .countDocuments();
      tempresult =
        code_quality > 0 ? available_component_list.push("COQU") : {};

      var continuous_integration = await pipeline
        .find({
          $and: [
            { pipeline_key: { $in: pipeline_keys } },
            {
              "continuous_integration.creation_status": "SUCCESS",
            },
          ],
        })
        .countDocuments();
      tempresult =
        continuous_integration > 0 ? available_component_list.push("BUIL") : {};

      var available_list_id = await dashboard_components.find(
        { dashboard_component_key: { $in: available_component_list } },
        { _id: 1 }
      );

      await Application.findOneAndUpdate(
        { application_key: application_key, "users.user_email": user_email },
        {
          $addToSet: {
            dashboard_available_component: available_list_id,
          },
        }
      );

      var dashboard_preference_count = await Application.findOne(
        { application_key: application_key },
        {
          _id: 0,
          users: { $elemMatch: { user_email: user_email.toLowerCase() } },
          dashboard_preference: 1,
        }
      );

      if (dashboard_preference_count.users[0].dashboard_preference < 1) {
        await Application.findOneAndUpdate(
          { application_key: application_key, "users.user_email": user_email },
          {
            $set: {
              "users.$.dashboard_preference": available_list_id[0],
            },
          }
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * This function gets code analysis data for the application
   * @param {String} application_key
   */
  module.exports.getCodeAnalysisData = async (application_key) => {
    try {
      let code_analysis = {
        bugs: 0,
        code_smells: 0,
        duplication: 0,
        technical_debt: 0,
        tech_debt_txt: "Hrs",
      };

      let pipeline_keys = await getPipelineKeys(application_key);

      let ca_data = await Code_analysis.aggregate([
        {
          $match: {
            pipeline_key: { $in: pipeline_keys },
          },
        },
        { $sort: { pipeline_key: -1, build_number: -1 } },
        {
          $group: {
            _id: "$pipeline_key",
            build_number: { $max: "$build_number" },
            bugs: { $first: "$bugs" },
            code_smells: { $first: "$code_smells" },
            duplication: { $first: "$duplication" },
            technical_debt: { $first: "$technical_debt" },
          },
        },
        {
          $group: {
            _id: null,
            bugs: { $sum: "$bugs" },
            code_smells: { $sum: "$code_smells" },
            duplication: { $sum: "$duplication" },
            technical_debt: { $sum: "$technical_debt" },
          },
        },
        {
          $project: {
            bugs: { $divide: ["$bugs", pipeline_keys.length] },
            code_smells: { $divide: ["$code_smells", pipeline_keys.length] },
            duplication: { $divide: ["$duplication", pipeline_keys.length] },
            technical_debt: {
              $divide: [
                "$technical_debt",
                { $multiply: [pipeline_keys.length, 60] },
              ],
            },
          },
        },
      ]);

      if (ca_data.length > 0) {
        code_analysis.duplication = Math.round(ca_data[0].duplication);
        code_analysis.technical_debt = Math.round(ca_data[0].technical_debt);
        code_analysis.bugs = Math.round(ca_data[0].bugs);
        code_analysis.code_smells = Math.round(ca_data[0].code_smells);

      }

      return code_analysis;
    } catch (err) {
      throw err;
    }
  },
  module.exports.getUnitTestingData = async (application_key) => {
    let ut_data = await unit_testing_data.findOne({
      application_key: application_key,
    });

    return ut_data;
  },
  module.exports.getFunctionalTestingData = async (application_key) => {
    let ft_data = await functional_testing_data.findOne({
      application_key: application_key,
    });
    return ft_data;
  },
  module.exports.getCodeSecurityData = async (application_key) => {
    let cs_data = await code_security_data.findOne({
      application_key: application_key,
    });
    return cs_data;
  },
  module.exports.getLoadTestingData = async (application_key) => {
    let lt_data = await load_testing_data.findOne({
      application_key: application_key,
    });
    return lt_data;
  },
  module.exports.getSpikeTestingData = async (application_key) => {
    let spike_test_data = await spike_testing_data.findOne({
      application_key: application_key,
    });
    return spike_test_data;
  },
  module.exports.getStressTestingData = async (application_key) => {
    let stress_data = await stress_testing_data.findOne({
      application_key: application_key,
    });
    return stress_data;
  },
  module.exports.getMonitoringHealthData = async (application_key) => {
    let health_data = await monitoring_health_data.findOne({
      application_key: application_key,
    });
    return health_data;
  },
  module.exports.getMonitoringRefreshRateData = async (application_key) => {
    let refresh_rate_data = await monitoring_request_rate_data.findOne({
      application_key: application_key,
    });
    return refresh_rate_data;
  },
  module.exports.getMonitoringEnvData = async (application_key) => {
    let env_data = await monitoring_env_data.findOne({
      application_key: application_key,
    });
    return env_data;
  },
  module.exports.getDeploymentBuildData = async (application_key) => {
    let deploy_build_data = await deployment_build_data.findOne({
      application_key: application_key,
    });
    return deploy_build_data;
  },
  module.exports.getDeploymentStatusData = async (application_key) => {
    let deploy_status_data = await deployment_status_data.findOne({
      application_key: application_key,
    });
    return deploy_status_data;
  },

  /**
   * This function gets planning data for the application
   * @param {String} application_key
   */
  module.exports.getPlanningData = async (application_key) => {
    try {
      let plan = {
        epics: 00,
        stories: 00,
        bugs: 00,
        tasks: 00,
        total_bugs: 00,
        total_epics: 00,
        total_stories: 00,
        total_tasks: 00,
        active_sprints: 00,
        todo: 0,
        inprogress: 0,
        done: 0,
        backlog: 0,
        features: 0,
      };

      let pipeline_keys = await getPipelineKeys(application_key);

      let plan_data = await Sprint.aggregate([
        {
          $match: {
            pipeline_key: { $in: pipeline_keys },
            sprint_active: true,
          },
        },
        {
          $project: {
            _id: 0,
            pipeline_key: "$pipeline_key",
            epic_count: { $size: "$epics" },
            story_count: { $size: "$stories" },
            bug_count: { $size: "$bugs" },
            task_count: { $size: "$tasks" },
            sprint_logical_name: "$sprint_logical_name",
          },
        },
        {
          $lookup: {
            from: "planning_datas",
            localField: "pipeline_key",
            foreignField: "pipeline_key",
            as: "issues",
          },
        },
        {
          $addFields: {
            backlog_issues: {
              $map: {
                input: "$issues",
                as: "issue",
                in: {
                  $cond: {
                    if: {
                      $eq: ["$$issue.issue_sprint", ""],
                    },
                    then: "$$issue.issue_type",
                    else: null,
                  },
                },
              },
            },
            active_issues: {
              $map: {
                input: "$issues",
                as: "issue",
                in: {
                  $cond: {
                    if: {
                      $eq: ["$$issue.issue_sprint", "$sprint_logical_name"],
                    },
                    then: "$$issue.issue_status",
                    else: null,
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            backlog_issues: {
              $filter: {
                input: "$backlog_issues",
                as: "issue",
                cond: {
                  $ne: ["$$issue", null],
                },
              },
            },
            active_issues: {
              $filter: {
                input: "$active_issues",
                as: "issue",
                cond: {
                  $ne: ["$$issue", null],
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: "$backlog_issues",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              pipeline_key: "$pipeline_key",
              backlog_issues: "$backlog_issues",
            },
            backlog_count: { $sum: 1 },
            epics: { $first: "$epic_count" },
            stories: { $first: "$story_count" },
            bugs: { $first: "$bug_count" },
            tasks: { $first: "$task_count" },
            active_issues: { $first: "$active_issues" },
          },
        },
        {
          $addFields: {
            backlog_bugs: {
              $cond: {
                if: {
                  $eq: ["$_id.backlog_issues", "BUG"],
                },
                then: "$backlog_count",
                else: 0,
              },
            },
            backlog_stories: {
              $cond: {
                if: {
                  $eq: ["$_id.backlog_issues", "STORY"],
                },
                then: "$backlog_count",
                else: 0,
              },
            },
            backlog_epics: {
              $cond: {
                if: {
                  $eq: ["$_id.backlog_issues", "EPIC"],
                },
                then: "$backlog_count",
                else: 0,
              },
            },
            backlog_tasks: {
              $cond: {
                if: {
                  $eq: ["$_id.backlog_issues", "TASK"],
                },
                then: "$backlog_count",
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.pipeline_key",
            epics: { $first: "$epics" },
            stories: { $first: "$stories" },
            bugs: { $first: "$bugs" },
            tasks: { $first: "$tasks" },
            backlog_bugs: { $max: "$backlog_bugs" },
            backlog_epics: { $max: "$backlog_epics" },
            backlog_stories: { $max: "$backlog_stories" },
            backlog_tasks: { $max: "$backlog_tasks" },
            active_issues: { $first: "$active_issues" },
          },
        },
        {
          $unwind: { path: "$active_issues", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: {
              pipeline_key: "$_id",
              active_issues: "$active_issues",
            },
            epics: { $first: "$epics" },
            stories: { $first: "$stories" },
            bugs: { $first: "$bugs" },
            tasks: { $first: "$tasks" },
            backlog_bugs: { $first: "$backlog_bugs" },
            backlog_epics: { $first: "$backlog_epics" },
            backlog_stories: { $first: "$backlog_stories" },
            backlog_tasks: { $first: "$backlog_tasks" },
            issue_count: { $sum: 1 },
          },
        },
        {
          $addFields: {
            todo_count: {
              $cond: {
                if: {
                  $eq: ["$_id.active_issues", "TO DO"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
            inprogress_count: {
              $cond: {
                if: {
                  $eq: ["$_id.active_issues", "INPROGRESS"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
            done_count: {
              $cond: {
                if: {
                  $eq: ["$_id.active_issues", "DONE"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.pipeline_key",
            epics: { $first: "$epics" },
            stories: { $first: "$stories" },
            bugs: { $first: "$bugs" },
            tasks: { $first: "$tasks" },
            backlog_bugs: { $first: "$backlog_bugs" },
            backlog_epics: { $first: "$backlog_epics" },
            backlog_stories: { $first: "$backlog_stories" },
            backlog_tasks: { $first: "$backlog_tasks" },
            todo_count: { $max: "$todo_count" },
            inprogress_count: { $max: "$inprogress_count" },
            done_count: { $max: "$done_count" },
          },
        },
        {
          $group: {
            _id: null,
            epics: { $sum: "$epics" },
            stories: { $sum: "$stories" },
            bugs: { $sum: "$bugs" },
            tasks: { $sum: "$tasks" },
            backlog_bugs: { $sum: "$backlog_bugs" },
            backlog_epics: { $sum: "$backlog_epics" },
            backlog_stories: { $sum: "$backlog_stories" },
            backlog_tasks: { $sum: "$backlog_tasks" },
            active_sprints: { $sum: 1 },
            todo_count: { $sum: "$todo_count" },
            inprogress_count: { $sum: "$inprogress_count" },
            done_count: { $sum: "$done_count" },
          },
        },
        {
          $project: {
            _id: 0,
            active_sprints: "$active_sprints",
            bugs: "$bugs",
            epics: "$epics",
            stories: "$stories",
            tasks: "$tasks",
            total_bugs: { $sum: ["$backlog_bugs", "$bugs"] },
            total_epics: { $sum: ["$backlog_epics", "$epics"] },
            total_stories: { $sum: ["$backlog_stories", "$stories"] },
            total_tasks: { $sum: ["$backlog_tasks", "$tasks"] },
            todo: {
              $multiply: [
                {
                  $cond: {
                    if: {
                      $eq: [
                        {
                          $sum: [
                            { $sum: ["$todo_count", "$inprogress_count"] },
                            "$done_count",
                          ],
                        },
                        0,
                      ],
                    },
                    then: 0,
                    else: {
                      $divide: [
                        "$todo_count",
                        {
                          $sum: [
                            { $sum: ["$todo_count", "$inprogress_count"] },
                            "$done_count",
                          ],
                        },
                      ],
                    },
                  },
                },
                100,
              ],
            },
            inprogress: {
              $multiply: [
                {
                  $cond: {
                    if: {
                      $eq: [
                        {
                          $sum: [
                            { $sum: ["$todo_count", "$inprogress_count"] },
                            "$done_count",
                          ],
                        },
                        0,
                      ],
                    },
                    then: 0,
                    else: {
                      $divide: [
                        "$inprogress_count",
                        {
                          $sum: [
                            { $sum: ["$todo_count", "$inprogress_count"] },
                            "$done_count",
                          ],
                        },
                      ],
                    },
                  },
                },
                100,
              ],
            },
            done: {
              $multiply: [
                {
                  $cond: {
                    if: {
                      $eq: [
                        {
                          $sum: [
                            { $sum: ["$todo_count", "$inprogress_count"] },
                            "$done_count",
                          ],
                        },
                        0,
                      ],
                    },
                    then: 0,
                    else: {
                      $divide: [
                        "$done_count",
                        {
                          $sum: [
                            { $sum: ["$todo_count", "$inprogress_count"] },
                            "$done_count",
                          ],
                        },
                      ],
                    },
                  },
                },
                100,
              ],
            },
          },
        },
      ]);

      if (plan_data.length > 0) {
        plan = plan_data[0];
        plan.todo = Math.round(plan_data[0].todo);
        plan.inprogress = Math.round(plan_data[0].inprogress);
        plan.done = Math.round(plan_data[0].done);
      }

      let backlog_data = await PlanningData.aggregate([
        {
          $match: {
            pipeline_key: { $in: pipeline_keys },
            sprint_id: "",
          },
        },
        {
          $group: {
            _id: "$issue_type",
            issue_count: { $sum: 1 },
          },
        },
        {
          $addFields: {
            backlog_tasks: {
              $cond: {
                if: {
                  $eq: ["$_id", "TASK"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
            backlog_epics: {
              $cond: {
                if: {
                  $eq: ["$_id", "EPIC"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
            backlog_stories: {
              $cond: {
                if: {
                  $eq: ["$_id", "STORY"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
            backlog_bugs: {
              $cond: {
                if: {
                  $eq: ["$_id", "BUG"],
                },
                then: "$issue_count",
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            backlog_bugs: { $sum: "$backlog_bugs" },
            backlog_epics: { $sum: "$backlog_epics" },
            backlog_stories: { $sum: "$backlog_stories" },
            backlog_tasks: { $sum: "$backlog_tasks" },
          },
        },
      ]);

      if (backlog_data.length > 0) {
        plan.backlog =
          backlog_data[0].backlog_bugs +
          backlog_data[0].backlog_tasks +
          backlog_data[0].backlog_stories +
          backlog_data[0].backlog_epics;
        plan.total_bugs = plan.bugs + backlog_data[0].backlog_bugs;
        plan.total_tasks = plan.tasks + backlog_data[0].backlog_tasks;
        plan.total_epics = plan.epics + backlog_data[0].backlog_epics;
        plan.total_stories = plan.stories + backlog_data[0].backlog_stories;
      } else {
        plan.backlog = 00;
      }
      var done_count = await PlanningData.find({
        $and: [
          { pipeline_key: { $in: pipeline_keys } },
          { issue_status: "DONE" },
        ],
      }).countDocuments();
      var todo_count = await PlanningData.find({
        $and: [
          { pipeline_key: { $in: pipeline_keys } },
          { issue_status: "TO DO" },
        ],
      }).countDocuments();
      var inprogress_count = await PlanningData.find({
        $and: [
          { pipeline_key: { $in: pipeline_keys } },
          { issue_status: "INPROGRESS" },
        ],
      }).countDocuments();

      var total_count = done_count + todo_count + inprogress_count;
      plan.todo =
        todo_count < 1 ? 0 : await roundToTwo((todo_count / total_count) * 100);

      plan.inprogress =
        inprogress_count < 1
          ? 0
          : await roundToTwo((inprogress_count / total_count) * 100);
      plan.done =
        done_count < 1 ? 0 : await roundToTwo((done_count / total_count) * 100);

      async function roundToTwo(num) {
        var num = num + "e+2";
        return +(Math.round(num) + "e-2");
      }
      plan.active_sprints = 0;

      let sprint_data = await Sprint.aggregate([
        {
          $match: {
            pipeline_key: {
              $in: pipeline_keys,
            },
          },
        },
      ]);
      // sprint_data.forEach((sprint) => {
      //
      //   if (sprint.sprint_active) {
      //     plan.active_sprints++;
      //   }
      // });
      for (let sprint of sprint_data) {
        if (sprint.sprint_active) {
          plan.active_sprints++;
        }
      }

      plan.features = plan.total_epics + plan.total_stories + plan.total_tasks;

      let return_plan_value = {
        epics: plan.epics < 10 ? "0" + plan.epics : plan.epics,
        stories: plan.stories < 10 ? "0" + plan.stories : plan.stories,
        bugs: plan.bugs < 10 ? "0" + plan.bugs : plan.bugs,
        tasks: plan.tasks < 10 ? "0" + plan.tasks : plan.tasks,
        total_bugs:
          plan.total_bugs < 10 ? "0" + plan.total_bugs : plan.total_bugs,
        total_epics:
          plan.total_epics < 10 ? "0" + plan.total_epics : plan.total_epics,
        total_stories:
          plan.total_stories < 10
            ? "0" + plan.total_stories
            : plan.total_stories,
        total_tasks:
          plan.total_tasks < 10 ? "0" + plan.total_tasks : plan.total_tasks,
        active_sprints:
          plan.active_sprints < 10
            ? "0" + plan.active_sprints
            : plan.active_sprints,
        todo: plan.todo < 10 ? "0" + plan.todo : plan.todo,
        inprogress:
          plan.inprogress < 10 ? "0" + plan.inprogress : plan.inprogress,
        done: plan.done < 10 ? "0" + plan.done : plan.done,
        backlog: plan.backlog < 10 ? "0" + plan.backlog : plan.backlog,
        features: plan.features < 10 ? "0" + plan.features : plan.features,
      };

      return return_plan_value;
    } catch (err) {
      throw err;
    }

  },

  module.exports.getPlankpiData = async (application_key) => {


    if (application_key == "CANVASjwysp2") {

      return {
        sprint: {
          active_sprint: "02",
          total_sprint: "02",
        },
        stories: {
          completed_stories: "03",
          total_stories: "05",
        },
        epics: {
          completed_epics: "02",
          total_epics: "04",
        },
        bugs: {
          completed_bugs: "05",
          total_bugs: "33",
        },
        task: {
          to_do: "02",
          in_progress: "02",
          done: "04",
        },
        backlog: {
          data: "01",
          total_count: "03",
        },
        features: {
          completed_features: "11",
          total_features: "22",
        },
        tool_url: "www.google.com",
      };



    }
    else {
      try {
        //tool_project_key

        //application key not available in P

        let active_sprint_count = 0;
        let completed_stories = 0;
        let completed_bugs = 0;
        let completed_epics = 0;
        let sprint_data = await Sprint.aggregate([
          {
            $match: { application_key: application_key },
          },
        ]);

        let pipeline_kpi_data_epic = await PlanningDatas.aggregate([
          {
            $match: {
              application_key: application_key,
              issue_type: "EPIC",
            },
          },
        ]);

        let pipeline_kpi_data_story = await PlanningDatas.aggregate([
          {
            $match: {
              application_key: application_key,
              issue_type: "STORY",
            },
          },
        ]);

        let pipeline_kpi_data_bug = await PlanningDatas.aggregate([
          {
            $match: {
              application_key: application_key,
              issue_type: "BUG",
            },
          },
        ]);

        let task_done = await PlanningDatas.find({
          application_key: application_key,
          issue_type: "TASK",
          // "issue_status": "DONE"
        }).countDocuments();

        let task_to_do = await PlanningDatas.find({
          application_key: application_key,
          issue_type: "TASK",
          // "issue_status": "TO DO"
        }).countDocuments();

        let task_in_Progress = await PlanningDatas.find({
          application_key: application_key,
          // "issue_type": "TASK",
          // "issue_status": "IN PROGRESS"
        }).countDocuments();

        sprint_data.filter((sprint) => {
          if (sprint.sprint_active) {
            active_sprint_count++;
          }
        });
        pipeline_kpi_data_story.filter((story) => {
          if (story.issue_status == "DONE") {
            completed_stories++;
          }
        });
        pipeline_kpi_data_epic.filter((epic) => {
          if (epic.issue_status == "DONE") {
            completed_epics++;
          }
        });
        pipeline_kpi_data_bug.filter((bug) => {
          if (bug.issue_status == "DONE") {
            completed_bugs++;
          }
        });

        let backlog_data = await PlanningData.aggregate([
          {
            $match: {
              application_key: application_key,
              sprint_id: "",
            },
          },
          {
            $group: {
              _id: "$issue_type",
              issue_count: { $sum: 1 },
            },
          },
          {
            $addFields: {
              backlog_tasks: {
                $cond: {
                  if: {
                    $eq: ["$_id", "TASK"],
                  },
                  then: "$issue_count",
                  else: 0,
                },
              },
              backlog_epics: {
                $cond: {
                  if: {
                    $eq: ["$_id", "EPIC"],
                  },
                  then: "$issue_count",
                  else: 0,
                },
              },
              backlog_stories: {
                $cond: {
                  if: {
                    $eq: ["$_id", "STORY"],
                  },
                  then: "$issue_count",
                  else: 0,
                },
              },
              backlog_bugs: {
                $cond: {
                  if: {
                    $eq: ["$_id", "BUG"],
                  },
                  then: "$issue_count",
                  else: 0,
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              backlog_bugs: { $sum: "$backlog_bugs" },
              backlog_epics: { $sum: "$backlog_epics" },
              backlog_stories: { $sum: "$backlog_stories" },
              backlog_tasks: { $sum: "$backlog_tasks" },
            },
          },
        ]);

        let backlog_count = 0
        if (backlog_data.length > 0) {
          backlog_count =
            backlog_data[0].backlog_bugs +
            backlog_data[0].backlog_tasks +
            backlog_data[0].backlog_stories +
            backlog_data[0].backlog_epics;
          //   plan.total_bugs = plan.bugs + backlog_data[0].backlog_bugs;
          //   plan.total_tasks = plan.tasks + backlog_data[0].backlog_tasks;
          //   plan.total_epics = plan.epics + backlog_data[0].backlog_epics;
          //   plan.total_stories = plan.stories + backlog_data[0].backlog_stories;
        } else {
          backlog_count = 00;
        }
        let completed_features = completed_epics + completed_stories + task_done;
        let total_features =
          pipeline_kpi_data_epic.length +
          pipeline_kpi_data_story.length +
          task_to_do +
          task_done +
          task_in_Progress;;
        let tool_details = await Application.findOne({
          application_key: application_key,
        });
        let tool_url = "";

        if (tool_details != null && tool_details.plan && tool_details.plan.length > 0) {
          tool_url = tool_details.plan[0].project_url;
        }

        return {
          sprint: {
            active_sprint:
              active_sprint_count < 10 ? "0" + active_sprint_count : active_sprint_count,
            total_sprint: sprint_data.length < 10 ? "0" + sprint_data.length : sprint_data.length,
          },
          stories: {
            completed_stories: completed_stories < 10 ? "0" + completed_stories : completed_stories,
            total_stories: pipeline_kpi_data_story.length < 10 ? "0" + pipeline_kpi_data_story.length : pipeline_kpi_data_story.length,
          },
          epics: {
            completed_epics: completed_epics < 10 ? "0" + completed_epics : completed_epics,
            total_epics: pipeline_kpi_data_epic.length < 10 ? "0" + pipeline_kpi_data_epic.length : pipeline_kpi_data_epic.length,
          },
          bugs: {
            completed_bugs: completed_bugs < 10 ? "0" + completed_bugs : completed_bugs,
            total_bugs: pipeline_kpi_data_bug.length < 10 ? "0" + pipeline_kpi_data_bug.length : pipeline_kpi_data_bug.length,
          },
          task: {
            to_do: task_to_do < 10 ? "0" + task_to_do : task_to_do,
            in_progress: task_in_Progress < 10 ? "0" + task_in_Progress : task_in_Progress,
            done: task_done < 10 ? "0" + task_done : task_done,
          },
          backlog: {
            data: backlog_data < 10 ? "0" + backlog_data : backlog_data,
            total_count: backlog_count < 10 ? "0" + backlog_count : backlog_count,
          },
          features: {
            completed_features: completed_features < 10 ? "0" + completed_features : completed_features,
            total_features: total_features < 10 ? "0" + total_features : total_features,
          },
          tool_url: tool_url,
        };
      } catch (err) {
        throw err;
      }
    }
  },

  /**
   * This function calculates kpi of all applications for the logged in user
   * @param {Object} user_name
   */
  module.exports.getKpiData = async (user_name, application_keys) => {
    try {
      let data = await calculate_kpis.getApplicationsKpis(
        user_name,
        application_keys,
        true
      );

      return data;
    } catch (err) {
      throw err;
    }
  }



/**
 * This function gets pipeline_keys of the application
 * @param {String} application_key
 */
const getPipelineKeys = async (application_key) => {

  let check_application = await Application.findOne({ application_key: application_key });
  if (check_application == null) {
    return [];
  } else {

    let application = await Application.aggregate([
      {
        $match: { application_key: application_key }
      },
      {
        $lookup: {
          from: "pipelines",
          localField: "pipelines",
          foreignField: "_id",
          as: "pipelines"
        }
      },
      {
        $addFields: {
          pipeline_keys: {
            $map: {
              input: "$pipelines",
              as: "pipeline",
              in: "$$pipeline.pipeline_key"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          pipeline_keys: 1
        }
      }
    ]);

    return application[0].pipeline_keys;
  }
}