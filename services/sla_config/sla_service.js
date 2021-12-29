const sla_config_schema = require('../../models/sla_config');
const sla_pip_config_schema = require('../../models/sla_pip_config');
const cron = require('node-cron');
var ci_data_schema = require('../../models/ci_data');
var sla_data_schema = require('../../models/sla_data');
var scm_data_schema = require('../../models/scm_data');
var sprint_schema = require('../../models/sprint');
var pipeline_schema = require('../../models/pipeline');
var code_analysis_schema = require('../../models/code_analysis');
var planning_data_schema = require('../../models/planning_data');

const sla_service = {};

sla_service.get_config = async (config_id) => {
  try {
    var sla_config = await sla_config_schema.findById(config_id);
    return sla_config;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.get_all_configs = async (pipeline_key) => {
  try {
    var sla_configs = await sla_config_schema.find({
      $or: [{ pipeline_key: pipeline_key }, { scope: 'APPLICATION' }]
    });
    return sla_configs;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.create_config = async (sla_config) => {
  try {
    delete sla_config._id;
    await sla_config_schema.create(sla_config);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.update_config = async (sla_config) => {
  try {
    await sla_config_schema.findByIdAndUpdate(sla_config['_id'], sla_config);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.delete_config = async (sla_config_id) => {
  try {
    await sla_config_schema.findByIdAndDelete(sla_config_id);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.get_pip_config = async (pipeline_key) => {
  try {
    var pipconfig = await sla_pip_config_schema.findOne({ pipeline_key }).lean();
    return pipconfig;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.create_pip_config = async (sla_pip_config) => {
  try {
    delete sla_pip_config['_id'];
    await sla_pip_config_schema.create(sla_pip_config);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.update_pip_config = async (sla_pip_config) => {
  try {
    await sla_pip_config_schema.findByIdAndUpdate(sla_pip_config['_id'], sla_pip_config);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

sla_service.get_sla_dashboard = async (pipeline_key) => {
  try {
    var dashboardData = await sla_config_schema.aggregate(
      [
        {
          '$match': {
            $and: [{ $or: [{ 'pipeline_key': pipeline_key }, { 'scope': 'APPLICATION' }] }, { status: true }]
          }
        }, {
          '$lookup': {
            'from': 'sla_datas',
            'localField': '_id',
            'foreignField': 'config_id',
            'as': 'sla_data'
          }
        }, {
          '$unwind': {
            'path': '$sla_data'
          }
        }, {
          '$project': {
            'latest_timeline': {
              '$last': '$sla_data.timeline'
            },
            '_id': 1,
            'pipeline_key': 1,
            'entity': 1,
            'scope': 1,
            'tool': 1,
            'updated': '$sla_data.updatedAt',
            'sla_data.updatedAt': 1
          }
        }
      ]
    )
    return dashboardData;
  } catch (error) {
    throw new Error(error.message);
  }
}


cron.schedule('0 0 0 * * *', async function () { //0 0 0 * * * everyday 12am , 0 0 * * 0 every monday 12am */10 * * * * *
  console.log('SLA Cron');
  var today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  var tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0)
  console.log(today, tomorrow);
  var configs = await sla_config_schema.find({ status: true });
  //   $and: [
  //     { status: true },
  //     {
  //       $or: [{ last_run: { $eq: null } }
  //         , { last_run: { $gte: today, $lt: tomorrow } }
  //       ]
  //     }
  //   ]
  // });
  var sla_pip_details = [];
  var eligible = [];
  if (configs && configs.length > 0) {
    for (const config of configs) {
      if (!config.last_run || config.last_run == null) {
        eligible.push(config);
      }
      else {
        var globalConfig = sla_pip_details.find(s => s.pipeline_key == config.pipeline_key);
        if (!globalConfig) {
          globalConfig = await sla_service.get_pip_config(config.pipeline_key);
          sla_pip_details.push(globalConfig);
        }
        console.log(globalConfig);
        var lr = new Date(config.last_run);
        lr.setUTCHours(0, 0, 0, 0);
        console.log("last run", lr);
        lr.setUTCDate(lr.getUTCDate() + globalConfig.refresh_interval);
        console.log("upcoming run", lr);

        if (lr >= today && lr < tomorrow) {
          config.window = globalConfig.window;
          config.refresh_interval = globalConfig.refresh_interval;
          eligible.push(config);
        }
      }
    }
    if (eligible.length > 0) {
      console.log(eligible);
      for (const elConfig of eligible) {
        await executeSlaConfig(elConfig);
      }

    }
    else {
      console.log('No SLA Configs RUNS for Today!');
    }
  }
  else {
    console.log('No SLA Configs Found!');
  }
  // console.log(configs);
  // last_run: { $eq:null }
});

const executeSlaConfig = async (config) => {
  console.log("Executing SLA Engine for ", config._id);
  switch (config.tool) {
    case 'CI':
      executeCIConfig(config);
      break;
    case 'SCM':
      executeSCMConfig(config);
      break;
    case 'CODE_ANALYSIS':
      executeCodeAnalysisConfig(config);
      break;
    case 'PLANNING':
      executePlanningConfig(config);
      break;
    default:
      console.log('Invalid Tool Type');
      break;
  }
}

const getWindowStartDate = (window) => {
  window--;
  var d = getTodaysDate();
  d.setUTCDate(d.getUTCDate() - (window));
  return d;
}

const getTodaysDate = () => {
  var d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const calculateIndicator = (criteria, value, actual) => {
  switch (criteria) {
    case "GT":
      return actual > value;
    case "GTE":
      return actual >= value;
    case "LT":
      return actual < value;
    case "LTE":
      return actual <= value;
    case "EQ":
      return actual == value;
    default:
      return false;
  }
}

const executeCIConfig = async (config) => {
  var startDate = getWindowStartDate(config.window);
  var endDate = getTodaysDate();
  console.log("Executing CI Config for ", config._id);
  var allBuilds = await ci_data_schema.find({
    $and: [
      { pipeline_key: config.pipeline_key },
      { updatedAt: { $gte: startDate, $lt: endDate } }
    ]
  }, { build_result: 1, pipeline_key: 1 }).lean();

  var response = { value: 0, indicator: "E", type: config.type };
  switch (config.entity) {
    case 'Successful Builds':

      var count = allBuilds.filter(a => a.build_result == "SUCCESS").length;
      if (config.type == "PERCENTAGE") {
        var percentage = Math.floor((count / allBuilds) * 100) || 0;
        response.value = percentage;
      }
      else {
        response.value = count;
      }

      console.log(response);
      break;
    case 'Failed Builds':
      var count = allBuilds.filter(a => a.build_result == "FAILURE").length;
      if (config.type == "PERCENTAGE") {
        var percentage = Math.floor((count / allBuilds) * 100) || 0;
        response.value = percentage;
      }
      else {
        response.value = count;
      }
      break;
    default:
      console.log('Invalid CI Entity Type');
      break;
  }
  if (calculateIndicator(config.success.criteria, config.success.value, response.value)) {
    response.indicator = "G";
  }
  else if (calculateIndicator(config.warning.criteria, config.warning.value, response.value)) {
    response.indicator = "Y";
  }
  else if (calculateIndicator(config.error.criteria, config.error.value, response.value)) {
    response.indicator = "R";
  }

  await updateSlaTimeline(config._id, config.pipeline_key, response);
}

const updateSlaTimeline = async (configId, pipeline_key, response) => {
  try {
    var res = await sla_data_schema.findOneAndUpdate({ config_id: configId },
      { $set: { pipeline_key: pipeline_key, config_id: configId }, $push: { timeline: response } }, { upsert: true, new: true, setDefaultsOnInsert: true }
      // { pipeline_key: pipeline_key, $push: { timeline: response }
    );
    console.log("updated", res);
    return true;
  } catch (error) {
    console.log(error.message);
  }
}

const executeSCMConfig = async (config) => {
  console.log("Executing SCM Config for ", config._id);
  var startDate = getWindowStartDate(config.window);
  var endDate = getTodaysDate();
  var response = { value: 0, indicator: "E", type: config.type };
  switch (config.entity) {
    case 'Commits':
      var allCommits = await scm_data_schema.countDocuments({
        "pipeline_key": config.pipeline_key,
        "type": "COMMIT",
        createdAt: { $gte: startDate, $lt: endDate }
      });
      response.value = allCommits;
      break;

    default:
      break;
  }
  if (calculateIndicator(config.success.criteria, config.success.value, response.value)) {
    response.indicator = "G";
  }
  else if (calculateIndicator(config.warning.criteria, config.warning.value, response.value)) {
    response.indicator = "Y";
  }
  else if (calculateIndicator(config.error.criteria, config.error.value, response.value)) {
    response.indicator = "R";
  }

  await updateSlaTimeline(config._id, config.pipeline_key, response);
}

const executeCodeAnalysisConfig = async (config) => {
  console.log("Executing Code Analysis Config for ", config._id);
  var response = { value: 0, indicator: "E", type: config.type };
  switch (config.entity) {
    case 'Lines of Code':
      var ca = await code_analysis_schema.findOne({
        "pipeline_key": config.pipeline_key,
        createdAt: { $gte: startDate, $lt: endDate }
      }, { line_coverage: 1 }, { sort: { createdAt: -1 } });

      if (ca) {
        var linesOfCode = ca.line_coverage || 0;
        response.value = linesOfCode;
      }

      break;
    case 'Bugs':
      var ca = await code_analysis_schema.findOne({
        "pipeline_key": config.pipeline_key,
        createdAt: { $gte: startDate, $lt: endDate }
      }, { bugs: 1 }, { sort: { createdAt: -1 } });
      if (ca) {
        var bugs = ca.bugs || 0;
        response.value = bugs;
      }
      break;
    case 'Code Smells':
      var ca = await code_analysis_schema.findOne({
        "pipeline_key": config.pipeline_key,
        createdAt: { $gte: startDate, $lt: endDate }
      }, { code_smells: 1 }, { sort: { createdAt: -1 } });
      if (ca) {
        var code_smells = ca.code_smells || 0;
        response.value = code_smells;
      }

      break;
    case 'Duplication %':
      var ca = await code_analysis_schema.findOne({
        "pipeline_key": config.pipeline_key,
        createdAt: { $gte: startDate, $lt: endDate }
      }, { duplication: 1 }, { sort: { createdAt: -1 } });
      if (ca) {
        var duplication = ca.duplication || 0;
        response.value = duplication;
      }

      break;
    case 'Vulnerabilities':
      var ca = await code_analysis_schema.findOne({
        "pipeline_key": config.pipeline_key,
        createdAt: { $gte: startDate, $lt: endDate }
      }, { vulnerabilities: 1 }, { sort: { createdAt: -1 } });
      if (ca) {
        var vulnerabilities = ca.vulnerabilities || 0;
        response.value = vulnerabilities;
      }
      break;
  }

  if (calculateIndicator(config.success.criteria, config.success.value, response.value)) {
    response.indicator = "G";
  }
  else if (calculateIndicator(config.warning.criteria, config.warning.value, response.value)) {
    response.indicator = "Y";
  }
  else if (calculateIndicator(config.error.criteria, config.error.value, response.value)) {
    response.indicator = "R";
  }

  await updateSlaTimeline(config._id, config.pipeline_key, response);

}

const executePlanningConfig = async (config) => {
  console.log("Executing Planning Config for ", config._id);
  var startDate = getWindowStartDate(config.window);
  var endDate = getTodaysDate();
  var response = { value: 0, indicator: "E", type: config.type };
  var pip = await pipeline_schema.findOne({ pipeline_key: config.pipeline_key }, { application_key: 1 });
  var application_key = pip.application_key
  switch (config.entity) {
    case 'Sprints - Running Sprints':
      var sprints = await sprint_schema.countDocuments({ sprint_active: true, application_key: application_key });
      if (config.type == 'PERCENTAGE') {
        var allSprints = await sprint_schema.countDocuments({ application_key: application_key });
        response.value = Math.floor((sprints / allSprints) * 100) || 0;
      }
      else {
        response.value = sprints;
      }
      break;
    case 'Sprint - Pending Issues':
      var active_sprints = await sprint_schema.find({ sprint_active: true, application_key: application_key }, { sprint_id: 1, application_key: 1 });
      if (active_sprints && active_sprints.length > 0) {
        var pendingIssues = await planning_data_schema.countDocuments({
          $and: [
            { $or: [{ issue_sprint: { $in: active_sprints.map(as => as.sprint_logical_name) } }, { issue_sprint: { $in: active_sprints.map(as => as.sprint_id) } }, , { sprint_id: { $in: active_sprints.map(as => as.sprint_id) } }] },
            { issue_status: { $in: ['TO DO', 'IN PROGRESS'] } }
          ]
        });

        response.value = pendingIssues || 0;

        if (config.type == 'PERCENTAGE') {
          var totalissues = await planning_data_schema.countDocuments({
            $and: [
              { $or: [{ issue_sprint: { $in: active_sprints.map(as => as.sprint_logical_name) } }, { issue_sprint: { $in: active_sprints.map(as => as.sprint_id) } }, , { sprint_id: { $in: active_sprints.map(as => as.sprint_id) } }] }
              // { issue_status: { $in: ['TO DO', 'IN PROGRESS'] } }
            ]
          });

          if (totalissues) {
            response.value = Math.floor((pendingIssues / totalissues) * 100) || 0;
          }
        }
      }


      break;
    case 'Backlog - Pending Issues':
      var pendingIssues = await planning_data_schema.countDocuments({
        $and: [
          { issue_sprint: "" },
          { issue_status: { $in: ['TO DO', 'IN PROGRESS'] } }
        ]
      });

      response.value = pendingIssues || 0;
      if (config.type == 'PERCENTAGE') {
        var totalIssues = await planning_data_schema.countDocuments({
          $and: [
            { issue_sprint: "" }
            // { issue_status: { $in: ['TO DO', 'IN PROGRESS'] } }
          ]
        });

        response.value = Math.floor((pendingIssues / totalIssues) * 100) || 0;
      }


      break;
    case 'Sprint - Story Points':
      var active_sprints = await sprint_schema.find({ sprint_active: true, application_key: application_key }, { 'story_points.points_committed': 1 });
      if (active_sprints && active_sprints.length > 0) {
        var totalPoints = 0;
        active_sprints.forEach(e => {
          if (e && e.story_points && e.story_points.points_committed) {
            totalPoints += e.story_points.points_committed;
          }
        });
        response.value = totalPoints;
      }

      break;
    case 'Estimated vs Actual':
      var active_sprints = await sprint_schema.find({ sprint_active: true, application_key: application_key }, { 'sprint_id': 1, 'sprint_logical_name': 1, 'application_key': 1 });
      if (active_sprints && active_sprints.length > 0) {
        var all_issues = await planning_data_schema.find({
          $and: [
            { $or: [{ issue_sprint: { $in: active_sprints.map(as => as.sprint_logical_name) } }, { issue_sprint: { $in: active_sprints.map(as => as.sprint_id) } }, { sprint_id: { $in: active_sprints.map(as => as.sprint_id) } }] },
            // { issue_status: { $in: ['TO DO', 'IN PROGRESS'] } }
          ]
        }, { timespent: 1, timeoriginalestimate: 1 });
        if(all_issues && all_issues.length > 0) {
          var ogEstimate = 0;
          var timeSpent = 0;
          all_issues.forEach(ai => {
            if(ai.timeoriginalestimate && ai.timespent) {
              ogEstimate += ai.timeoriginalestimate;
              timeSpent += ai.timespent;
            }
          });

          var factor = Math.floor((timeSpent/ogEstimate) * 100);
          if (timeSpent == ogEstimate) {
            factor = 100;
          }
          else if (timespent < ogEstimate) {
            factor += 100;
          }
          else {
            factor -= 100;
          }

          response.value = factor;
        }
      }
      break;
  }

  if (calculateIndicator(config.success.criteria, config.success.value, response.value)) {
    response.indicator = "G";
  }
  else if (calculateIndicator(config.warning.criteria, config.warning.value, response.value)) {
    response.indicator = "Y";
  }
  else if (calculateIndicator(config.error.criteria, config.error.value, response.value)) {
    response.indicator = "R";
  }

  await updateSlaTimeline(config._id, config.pipeline_key, response);
}

module.exports = sla_service;