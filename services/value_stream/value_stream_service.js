var sprint = require("../../models/sprint");
var tool = require("../../models/tool");
var planning_data = require("../../models/planning_data");
var pipeline_data = require("../../models/pipeline");
var scm_data = require("../../models/scm_data");
var snow_data = require("../../models/snow_vsm_data");
var sprint_data = require("../../models/sprint");
var ci_data = require("../../models/ci_data");
var application = require("../../models/application");
var azure_sevices = require("../../services/azure_devops_services/azure_services");
var get_current_date = require("../../service_helpers/common/get_current_date");
var servicenow_connector = require("../../connectors/servicenow/servicenow_crud");
var snow_vsm_data = require("../../models/itsm_incidents");
var moment = require("moment");
var jira_sync = require("../../connectors/jira/jira_sync");
var ca = require("../../models/code_analysis");
var unirest = require("unirest");
const { json } = require("body-parser");
var application_service = require("../application/application_service");
const logger = require('../../configurations/logging/logger')
/**
 * This function returns the Efficiency for application sprint
 * @param {String} application_key
 * RAHULSlyqd13
 */
module.exports.getEfficiency = async (application_key) => {
  // let pipeline_keys = await this.getPipelinesOfApplication(application_key);
  let issue_details_list = [];
  let month_name = [],
    month_list = [];
  // issue_details_list = await this.getAllIssuesOfPipeline(application_key);
  issue_details_list = await getAllIssuesOfPipeline(application_key);
  let n = 6;
  let record_start_date_temp;

  let record_start_date;
  let bug_efficiency = {},
    story_efficiency = {},
    epic_efficiency = {},
    task_efficiency = {};
  let bug_efficiency_avg = {},
    story_efficiency_avg = {},
    epic_efficiency_avg = {},
    task_efficiency_avg = {};
  for (let i = 0; i < n; i++) {
    bug_efficiency["month-" + (i + 1)] = [];
    bug_efficiency_avg["month-" + (i + 1)] = [];
    story_efficiency["month-" + (i + 1)] = [];
    story_efficiency_avg["month-" + (i + 1)] = [];
    task_efficiency["month-" + (i + 1)] = [];
    task_efficiency_avg["month-" + (i + 1)] = [];
    epic_efficiency["month-" + (i + 1)] = [];
    epic_efficiency_avg["month-" + (i + 1)] = [];
  }
  try {
    let system_date_temp = await get_current_date.getCurrentDate();
    let system_date_temp_old = await get_current_date.getCurrentDate();

    // let system_date_temp = await get_current_date.addMonths(system_date_temp_old,-6)//

    //record_start_date_temp = await get_current_date.addMonths(system_date_temp, -6);//
    let system_date = system_date_temp.getMonth();

    record_start_date_temp = await get_current_date.addMonths(
      system_date_temp,
      -n
    ); //

    record_start_date = system_date - (n - 1);
    if (record_start_date < 0) {
      record_start_date = 12 + record_start_date;
    }
    for (let i = 0; i < n; i++) {
      month_list.push(
        record_start_date + i <= 11
          ? record_start_date + i
          : ((record_start_date + i) % 11) - 1
      );
    }

    for await (let issue of issue_details_list) {
      // let d=new Date(issue.issue_actual_start_date);
      if (issue.issue_actual_start_date.getMonth() >= record_start_date) {
        // count = count+1

        issue.issue_actual_start_date =
          issue.issue_actual_start_date == null
            ? 0
            : issue.issue_actual_start_date;
        issue.issue_actual_end_date =
          issue.issue_actual_end_date == null ? 0 : issue.issue_actual_end_date;
        issue.sprint_start_date =
          issue.sprint_start_date == null ? 0 : issue.sprint_start_date;
        if (issue.issue_type == "BUG") {
          let x = await calculateEffectiveTime(
            issue.timeoriginalestimate,
            issue.timespent
          );
          let eff = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          bug_efficiency[eff].push(x);
        } else if (issue.issue_type == "STORY") {
          let x = await calculateEffectiveTime(
            issue.timeoriginalestimate,
            issue.timespent
          );
          let eff = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          story_efficiency[eff].push(x);
        } else if (issue.issue_type == "EPIC") {
          let x = await calculateEffectiveTime(
            issue.timeoriginalestimate,
            issue.timespent
          );
          let eff = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          epic_efficiency[eff].push(x);
        } else if (issue.issue_type == "TASK") {
          let x = await calculateEffectiveTime(
            issue.timeoriginalestimate,
            issue.timespent
          );
          let eff = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          task_efficiency[eff].push(x);
        }
      } else {
      }
    }

    for (let i = 0; i < n; i++) {
      month_name.push(await getMonthName(month_list[i]));
      if (bug_efficiency["month-" + (i + 1)].length != 0) {
        bug_efficiency_avg["month-" + (i + 1)] = await calculateAverage(
          bug_efficiency["month-" + (i + 1)]
        );
      } else if (bug_efficiency["month-" + (i + 1)].length == 0) {
        bug_efficiency_avg["month-" + (i + 1)] = 0;
      }
      if (story_efficiency["month-" + (i + 1)].length != 0) {
        story_efficiency_avg["month-" + (i + 1)] = await calculateAverage(
          story_efficiency["month-" + (i + 1)]
        );
      } else if (story_efficiency["month-" + (i + 1)].length == 0) {
        story_efficiency_avg["month-" + (i + 1)] = 0;
      }
      if (epic_efficiency["month-" + (i + 1)].length != 0) {
        epic_efficiency_avg["month-" + (i + 1)] = await calculateAverage(
          epic_efficiency["month-" + (i + 1)]
        );
      } else if (epic_efficiency["month-" + (i + 1)].length == 0) {
        epic_efficiency_avg["month-" + (i + 1)] = 0;
      }
      if (task_efficiency["month-" + (i + 1)].length != 0) {
        task_efficiency_avg["month-" + (i + 1)] = await calculateAverage(
          task_efficiency["month-" + (i + 1)]
        );
      } else if (task_efficiency["month-" + (i + 1)].length == 0) {
        task_efficiency_avg["month-" + (i + 1)] = 0;
      }
    }
    let bug_eff = [],
      story_eff = [],
      epic_eff = [],
      task_eff = [],
      issue_eff_avg = [],
      eff_avg = 0;
    let efficiency_data = {
      bug_efficiency: bug_efficiency_avg,
      story_efficiency: story_efficiency_avg,
      epic_efficiency: epic_efficiency_avg,
      task_efficiency: task_efficiency_avg,
    };
    for (let i = 0; i < n; i++) {
      bug_eff.push(efficiency_data.bug_efficiency["month-" + (i + 1)]);
      task_eff.push(efficiency_data.task_efficiency["month-" + (i + 1)]);
      epic_eff.push(efficiency_data.epic_efficiency["month-" + (i + 1)]);
      story_eff.push(efficiency_data.story_efficiency["month-" + (i + 1)]);
    }
    issue_eff_avg.push(await calculateAverage(bug_eff));
    issue_eff_avg.push(await calculateAverage(task_eff));
    issue_eff_avg.push(await calculateAverage(epic_eff));
    issue_eff_avg.push(await calculateAverage(story_eff));
    eff_avg = await calculateAverage(issue_eff_avg);
    efficiency_data = {
      bug_efficiency: bug_eff,
      story_efficiency: story_eff,
      epic_efficiency: epic_eff,
      task_efficiency: task_eff,
      efficiency_avg: eff_avg,
      month_name: month_name,
    };
    return efficiency_data;
  } catch (error) {
    throw error;
  }
}
  /**
   * This function returns the CycleTime for application sprint
   * @param {String} application_key
   */
  module.exports.getCycleTime = async (application_key) => {
    // let pipeline_keys = await this.getPipelinesOfApplication(application_key);
    let issue_details_list = [];
    issue_details_list = await getAllIssuesOfPipeline(application_key);
    let n = 6;
    let system_date_temp;
    let record_start_date_temp;
    let record_start_date;
    let system_date;
    let month_name = [],
      month_list = [];
    let bug_ct = {},
      story_ct = {},
      epic_ct = {},
      task_ct = {};
    let bug_ct_avg = {},
      story_ct_avg = {},
      epic_ct_avg = {},
      task_ct_avg = {};
    for (let i = 0; i < n; i++) {
      bug_ct["month-" + (i + 1)] = [];
      bug_ct_avg["month-" + (i + 1)] = [];
      story_ct["month-" + (i + 1)] = [];
      story_ct_avg["month-" + (i + 1)] = [];
      task_ct["month-" + (i + 1)] = [];
      task_ct_avg["month-" + (i + 1)] = [];
      epic_ct["month-" + (i + 1)] = [];
      epic_ct_avg["month-" + (i + 1)] = [];
    }

    try {
      // system_date_temp = await get_current_date.getCurrentDate();//
      //  let system_date_temp_old = await get_current_date.getCurrentDate()
      let system_date_temp = await get_current_date.getCurrentDate();
      let system_date_temp_old = await get_current_date.getCurrentDate();
      // let system_date_temp = await get_current_date.addMonths(system_date_temp_old,-4)//

      system_date = system_date_temp.getMonth();

      record_start_date_temp = await get_current_date.addMonths(
        system_date_temp,
        -n
      ); //

      record_start_date = system_date - (n - 1);
      if (record_start_date < 0) {
        record_start_date = 12 + record_start_date;
      }
      for (let i = 0; i < n; i++) {
        month_list.push(
          record_start_date + i <= 11
            ? record_start_date + i
            : ((record_start_date + i) % 11) - 1
        );
      }

      for await (let issue of issue_details_list) {
        let sprint_start_date = issue.sprint_start_date[0];

        if (issue.issue_actual_start_date.getMonth() >= record_start_date) {
          issue.issue_actual_start_date =
            issue.issue_actual_start_date == null
              ? 0
              : issue.issue_actual_start_date;
          issue.issue_actual_end_date =
            issue.issue_actual_end_date == null
              ? 0
              : issue.issue_actual_end_date;
          issue.sprint_start_date =
            issue.sprint_start_date == null ? 0 : issue.sprint_start_date;
          if (issue.issue_type == "BUG") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            bug_ct[eff].push(x);
          } else if (issue.issue_type == "STORY") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            story_ct[eff].push(x);
          } else if (issue.issue_type == "EPIC") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            epic_ct[eff].push(x);
          } else if (issue.issue_type == "TASK") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            task_ct[eff].push(x);
          }
        } else {
        }
      }
      for (let i = 0; i < n; i++) {
        month_name.push(await getMonthName(month_list[i]));
        if (bug_ct["month-" + (i + 1)].length != 0) {
          bug_ct_avg["month-" + (i + 1)] = await calculateAverage(
            bug_ct["month-" + (i + 1)]
          );
        } else if (bug_ct["month-" + (i + 1)].length == 0) {
          bug_ct_avg["month-" + (i + 1)] = 0;
        }
        if (story_ct["month-" + (i + 1)].length != 0) {
          story_ct_avg["month-" + (i + 1)] = await calculateAverage(
            story_ct["month-" + (i + 1)]
          );
        } else if (story_ct["month-" + (i + 1)].length == 0) {
          story_ct_avg["month-" + (i + 1)] = 0;
        }
        if (epic_ct["month-" + (i + 1)].length != 0) {
          epic_ct_avg["month-" + (i + 1)] = await calculateAverage(
            epic_ct["month-" + (i + 1)]
          );
        } else if (epic_ct["month-" + (i + 1)].length == 0) {
          epic_ct_avg["month-" + (i + 1)] = 0;
        }
        if (task_ct["month-" + (i + 1)].length != 0) {
          task_ct_avg["month-" + (i + 1)] = await calculateAverage(
            task_ct["month-" + (i + 1)]
          );
        } else if (task_ct["month-" + (i + 1)].length == 0) {
          task_ct_avg["month-" + (i + 1)] = 0;
        }
      }
      let bug_cycle = [],
        story_cycle = [],
        epic_cycle = [],
        task_cycle = [],
        issue_ct_avg = [],
        ct_avg = 0;
      let ct_data = {
        bug_ct: bug_ct_avg,
        story_ct: story_ct_avg,
        epic_ct: epic_ct_avg,
        task_ct: task_ct_avg,
      };
      for (let i = 0; i < n; i++) {
        bug_cycle.push(ct_data.bug_ct["month-" + (i + 1)]);
        task_cycle.push(ct_data.task_ct["month-" + (i + 1)]);
        epic_cycle.push(ct_data.epic_ct["month-" + (i + 1)]);
        story_cycle.push(ct_data.story_ct["month-" + (i + 1)]);
      }
      issue_ct_avg.push(await calculateAverage(bug_cycle));
      issue_ct_avg.push(await calculateAverage(task_cycle));
      issue_ct_avg.push(await calculateAverage(epic_cycle));
      issue_ct_avg.push(await calculateAverage(story_cycle));
      ct_avg = await calculateAverage(issue_ct_avg);
      ct_data = {
        bug_ct: bug_cycle,
        story_ct: story_cycle,
        epic_ct: epic_cycle,
        task_ct: task_cycle,
        ct_avg: ct_avg,
        month_name: month_name,
      };
      return ct_data;
    } catch (error) {
      throw error;
    }
  }
  module.exports.getAppsCycleTime = async (user_mail) => {
    // let pipeline_keys = await this.getPipelinesOfApplication(application_key);
    let applications = await application_service.getUserApplicationsbyEmail(user_mail);

    let Objapplication = (applications && applications.hasOwnProperty('user_allocation')) ? applications.user_allocation.map(
      (elem) => elem.application_key
    ) : []

    let issue_details_list = [];
    issue_details_list = await getAppsAllIssuesOfPipeline(Objapplication);
    let n = 6;
    let system_date_temp;
    let record_start_date_temp;
    let record_start_date;
    let system_date;
    let month_name = [],
      month_list = [];
    let bug_ct = {},
      story_ct = {},
      epic_ct = {},
      task_ct = {};
    let bug_ct_avg = {},
      story_ct_avg = {},
      epic_ct_avg = {},
      task_ct_avg = {};
    for (let i = 0; i < n; i++) {
      bug_ct["month-" + (i + 1)] = [];
      bug_ct_avg["month-" + (i + 1)] = [];
      story_ct["month-" + (i + 1)] = [];
      story_ct_avg["month-" + (i + 1)] = [];
      task_ct["month-" + (i + 1)] = [];
      task_ct_avg["month-" + (i + 1)] = [];
      epic_ct["month-" + (i + 1)] = [];
      epic_ct_avg["month-" + (i + 1)] = [];
    }

    try {
      // system_date_temp = await get_current_date.getCurrentDate();//
      //  let system_date_temp_old = await get_current_date.getCurrentDate()
      let system_date_temp = await get_current_date.getCurrentDate();
      let system_date_temp_old = await get_current_date.getCurrentDate();
      // let system_date_temp = await get_current_date.addMonths(system_date_temp_old,-4)//

      system_date = system_date_temp.getMonth();

      record_start_date_temp = await get_current_date.addMonths(
        system_date_temp,
        -n
      ); //

      record_start_date = system_date - (n - 1);
      if (record_start_date < 0) {
        record_start_date = 12 + record_start_date;
      }
      for (let i = 0; i < n; i++) {
        month_list.push(
          record_start_date + i <= 11
            ? record_start_date + i
            : ((record_start_date + i) % 11) - 1
        );
      }

      for await (let issue of issue_details_list) {
        let sprint_start_date = issue.sprint_start_date[0];

        if (issue.issue_actual_start_date.getMonth() >= record_start_date) {
          issue.issue_actual_start_date =
            issue.issue_actual_start_date == null
              ? 0
              : issue.issue_actual_start_date;
          issue.issue_actual_end_date =
            issue.issue_actual_end_date == null
              ? 0
              : issue.issue_actual_end_date;
          issue.sprint_start_date =
            issue.sprint_start_date == null ? 0 : issue.sprint_start_date;
          if (issue.issue_type == "BUG") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            bug_ct[eff].push(x);
          } else if (issue.issue_type == "STORY") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            story_ct[eff].push(x);
          } else if (issue.issue_type == "EPIC") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            epic_ct[eff].push(x);
          } else if (issue.issue_type == "TASK") {
            let x = await calculateCTElement(
              issue.issue_actual_end_date,
              sprint_start_date
            );
            let eff = await returnMonthBucket(
              issue.issue_actual_start_date,
              record_start_date,
              n
            );
            task_ct[eff].push(x);
          }
        } else {
        }
      }
      for (let i = 0; i < n; i++) {
        month_name.push(await getMonthName(month_list[i]));
        if (bug_ct["month-" + (i + 1)].length != 0) {
          bug_ct_avg["month-" + (i + 1)] = await calculateAverage(
            bug_ct["month-" + (i + 1)]
          );
        } else if (bug_ct["month-" + (i + 1)].length == 0) {
          bug_ct_avg["month-" + (i + 1)] = 0;
        }
        if (story_ct["month-" + (i + 1)].length != 0) {
          story_ct_avg["month-" + (i + 1)] = await calculateAverage(
            story_ct["month-" + (i + 1)]
          );
        } else if (story_ct["month-" + (i + 1)].length == 0) {
          story_ct_avg["month-" + (i + 1)] = 0;
        }
        if (epic_ct["month-" + (i + 1)].length != 0) {
          epic_ct_avg["month-" + (i + 1)] = await calculateAverage(
            epic_ct["month-" + (i + 1)]
          );
        } else if (epic_ct["month-" + (i + 1)].length == 0) {
          epic_ct_avg["month-" + (i + 1)] = 0;
        }
        if (task_ct["month-" + (i + 1)].length != 0) {
          task_ct_avg["month-" + (i + 1)] = await calculateAverage(
            task_ct["month-" + (i + 1)]
          );
        } else if (task_ct["month-" + (i + 1)].length == 0) {
          task_ct_avg["month-" + (i + 1)] = 0;
        }
      }
      let bug_cycle = [],
        story_cycle = [],
        epic_cycle = [],
        task_cycle = [],
        issue_ct_avg = [],
        ct_avg = 0;
      let ct_data = {
        bug_ct: bug_ct_avg,
        story_ct: story_ct_avg,
        epic_ct: epic_ct_avg,
        task_ct: task_ct_avg,
      };
      for (let i = 0; i < n; i++) {
        bug_cycle.push(ct_data.bug_ct["month-" + (i + 1)]);
        task_cycle.push(ct_data.task_ct["month-" + (i + 1)]);
        epic_cycle.push(ct_data.epic_ct["month-" + (i + 1)]);
        story_cycle.push(ct_data.story_ct["month-" + (i + 1)]);
      }
      issue_ct_avg.push(await calculateAverage(bug_cycle));
      issue_ct_avg.push(await calculateAverage(task_cycle));
      issue_ct_avg.push(await calculateAverage(epic_cycle));
      issue_ct_avg.push(await calculateAverage(story_cycle));
      ct_avg = await calculateAverage(issue_ct_avg);
      ct_data = {
        bug_ct: bug_cycle,
        story_ct: story_cycle,
        epic_ct: epic_cycle,
        task_ct: task_cycle,
        ct_avg: ct_avg,
        month_name: month_name,
      };
      return ct_data;
    } catch (error) {
      throw error;
    }
  };
/**
 * This function returns the Velocity for application sprint
 * @param {String} application_key
 */
const getVelocity = async (application_key) => {
  // let pipeline_keys = await this.getPipelinesOfApplication(application_key);
  let issue_details_list = [];
  issue_details_list = await getAllIssuesOfPipeline(application_key);
  let n = 6;
  let eff_completed;
  let eff_plan;
  let system_date_temp;
  let record_start_date_temp;
  let record_start_date;

  let system_date;
  let bug_planned = {},
    story_planned = {},
    epic_planned = {},
    task_planned = {};
  let bug_completed = {},
    story_completed = {},
    epic_completed = {},
    task_completed = {};
  let task_planned_length = {},
    bug_planned_length = {},
    story_planned_length = {},
    epic_planned_length = {};
  let task_completed_length = {},
    bug_completed_length = {},
    story_completed_length = {},
    epic_completed_length = {};
  for (let i = 0; i < n; i++) {
    bug_planned["month-" + (i + 1)] = [];
    bug_completed["month-" + (i + 1)] = [];
    bug_planned_length["month-" + (i + 1)] = 0;
    bug_completed_length["month-" + (i + 1)] = 0;
    story_planned["month-" + (i + 1)] = [];
    story_completed["month-" + (i + 1)] = [];
    story_planned_length["month-" + (i + 1)] = 0;
    story_completed_length["month-" + (i + 1)] = 0;
    epic_planned["month-" + (i + 1)] = [];
    epic_completed["month-" + (i + 1)] = [];
    epic_planned_length["month-" + (i + 1)] = 0;
    epic_completed_length["month-" + (i + 1)] = 0;
    task_planned["month-" + (i + 1)] = [];
    task_completed["month-" + (i + 1)] = [];
    task_planned_length["month-" + (i + 1)] = 0;
    task_completed_length["month-" + (i + 1)] = 0;
  }
  try {
    system_date_temp = await get_current_date.getCurrentDate();

    //  let system_date_temp_old = await get_current_date.getCurrentDate()

    system_date = system_date_temp.getMonth();

    record_start_date_temp = await get_current_date.addMonths(
      system_date_temp,
      -n
    ); //

    record_start_date = system_date - (n - 1);
    if (record_start_date < 0) {
      record_start_date = 12 + record_start_date;
    }

    for await (let issue of issue_details_list) {
      if (issue.issue_actual_start_date.getMonth() >= record_start_date) {
        issue.issue_actual_start_date =
          issue.issue_actual_start_date == null
            ? 0
            : issue.issue_actual_start_date;
        issue.issue_actual_end_date =
          issue.issue_actual_end_date == null ? 0 : issue.issue_actual_end_date;
        issue.sprint_start_date =
          issue.sprint_start_date == null ? 0 : issue.sprint_start_date;
        if (issue.issue_type == "BUG") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          bug_planned[eff_plan].push(issue);
          bug_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            bug_completed[eff_completed].push(issue);
            bug_completed_length[eff_completed] += 1;
          }
        } else if (issue.issue_type == "STORY") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          story_planned[eff_plan].push(issue);
          story_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            story_completed[eff_completed].push(issue);
            story_completed_length[eff_completed] += 1;
          }
        } else if (issue.issue_type == "EPIC") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          epic_planned[eff_plan].push(issue);
          epic_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            epic_completed[eff_completed].push(issue);
            epic_completed_length[eff_completed] += 1;
          }
        } else if (issue.issue_type == "TASK") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          task_planned[eff_plan].push(issue);
          task_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            task_completed[eff_completed].push(issue);
            task_completed_length[eff_completed] += 1;
          }
        }
      } else {
      }
    }
    let velocity_data = {
      task: {
        task_planned: task_planned_length,
        task_completed: task_completed_length,
      },
      epic: {
        epic_planned: epic_planned_length,
        epic_completed: epic_completed_length,
      },
      bug: {
        bug_planned: bug_planned_length,
        bug_completed: bug_completed_length,
      },
      story: {
        story_planned: story_planned_length,
        story_completed: story_completed_length,
      },
    };
    return velocity_data;
  } catch (error) {
    throw error;
  }
};

const getAppsVelocity = async (application_key) => {
  // let pipeline_keys = await this.getPipelinesOfApplication(application_key);

  let issue_details_list = [];
  issue_details_list = await getAppsAllIssuesOfPipeline(application_key);
  let n = 6;
  let eff_completed;
  let eff_plan;
  let system_date_temp;
  let record_start_date_temp;
  let record_start_date;

  let system_date;
  let bug_planned = {},
    story_planned = {},
    epic_planned = {},
    task_planned = {};
  let bug_completed = {},
    story_completed = {},
    epic_completed = {},
    task_completed = {};
  let task_planned_length = {},
    bug_planned_length = {},
    story_planned_length = {},
    epic_planned_length = {};
  let task_completed_length = {},
    bug_completed_length = {},
    story_completed_length = {},
    epic_completed_length = {};
  for (let i = 0; i < n; i++) {
    bug_planned["month-" + (i + 1)] = [];
    bug_completed["month-" + (i + 1)] = [];
    bug_planned_length["month-" + (i + 1)] = 0;
    bug_completed_length["month-" + (i + 1)] = 0;
    story_planned["month-" + (i + 1)] = [];
    story_completed["month-" + (i + 1)] = [];
    story_planned_length["month-" + (i + 1)] = 0;
    story_completed_length["month-" + (i + 1)] = 0;
    epic_planned["month-" + (i + 1)] = [];
    epic_completed["month-" + (i + 1)] = [];
    epic_planned_length["month-" + (i + 1)] = 0;
    epic_completed_length["month-" + (i + 1)] = 0;
    task_planned["month-" + (i + 1)] = [];
    task_completed["month-" + (i + 1)] = [];
    task_planned_length["month-" + (i + 1)] = 0;
    task_completed_length["month-" + (i + 1)] = 0;
  }
  try {
    system_date_temp = await get_current_date.getCurrentDate();

    //  let system_date_temp_old = await get_current_date.getCurrentDate()

    system_date = system_date_temp.getMonth();

    record_start_date_temp = await get_current_date.addMonths(
      system_date_temp,
      -n
    ); //

    record_start_date = system_date - (n - 1);
    if (record_start_date < 0) {
      record_start_date = 12 + record_start_date;
    }

    for await (let issue of issue_details_list) {
      if (issue.issue_actual_start_date.getMonth() >= record_start_date) {
        issue.issue_actual_start_date =
          issue.issue_actual_start_date == null
            ? 0
            : issue.issue_actual_start_date;
        issue.issue_actual_end_date =
          issue.issue_actual_end_date == null ? 0 : issue.issue_actual_end_date;
        issue.sprint_start_date =
          issue.sprint_start_date == null ? 0 : issue.sprint_start_date;
        if (issue.issue_type == "BUG") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          bug_planned[eff_plan].push(issue);
          bug_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            bug_completed[eff_completed].push(issue);
            bug_completed_length[eff_completed] += 1;
          }
        } else if (issue.issue_type == "STORY") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          story_planned[eff_plan].push(issue);
          story_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            story_completed[eff_completed].push(issue);
            story_completed_length[eff_completed] += 1;
          }
        } else if (issue.issue_type == "EPIC") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          epic_planned[eff_plan].push(issue);
          epic_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            epic_completed[eff_completed].push(issue);
            epic_completed_length[eff_completed] += 1;
          }
        } else if (issue.issue_type == "TASK") {
          eff_plan = await returnMonthBucket(
            issue.issue_actual_start_date,
            record_start_date,
            n
          );
          task_planned[eff_plan].push(issue);
          task_planned_length[eff_plan] += 1;
          if (issue.issue_status == "DONE") {
            eff_completed = await returnMonthBucket(
              issue.issue_actual_end_date,
              record_start_date,
              n
            );
            task_completed[eff_completed].push(issue);
            task_completed_length[eff_completed] += 1;
          }
        }
      } else {
      }
    }
    let velocity_data = {
      task: {
        task_planned: task_planned_length,
        task_completed: task_completed_length,
      },
      epic: {
        epic_planned: epic_planned_length,
        epic_completed: epic_completed_length,
      },
      bug: {
        bug_planned: bug_planned_length,
        bug_completed: bug_completed_length,
      },
      story: {
        story_planned: story_planned_length,
        story_completed: story_completed_length,
      },
    };
    return velocity_data;
  } catch (error) {
    throw error;
  }
};
module.exports.getVelocityData = async (application_key) => {
  let vel_data = await getVelocity(application_key);
  let bug_plan = [],
    story_plan = [],
    epic_plan = [],
    task_plan = [],
    n = 6;
  let month_name = [],
    month_list = [];
  let bug_comp = [],
    story_comp = [],
    epic_comp = [],
    task_comp = [],
    issue_velocity_avg = [],
    velocity_avg = 0;
  let system_date_temp = await get_current_date.getCurrentDate(); //

  let system_date = system_date_temp.getMonth();

  let record_start_date_temp = await get_current_date.addMonths(
    system_date_temp,
    -n
  ); //

  let record_start_date = system_date - (n - 1);
  if (record_start_date < 0) {
    record_start_date = 12 + record_start_date;
  }
  for (let i = 0; i < n; i++) {
    month_list.push(
      record_start_date + i <= 11
        ? record_start_date + i
        : ((record_start_date + i) % 11) - 1
    );
  }
  for (let i = 0; i < n; i++) {
    month_name.push(await getMonthName(month_list[i]));
    bug_plan.push(vel_data["bug"].bug_planned["month-" + (i + 1)]);
    bug_comp.push(vel_data["bug"].bug_completed["month-" + (i + 1)]);
    task_plan.push(vel_data["task"].task_planned["month-" + (i + 1)]);
    task_comp.push(vel_data["task"].task_completed["month-" + (i + 1)]);
    epic_plan.push(vel_data["epic"].epic_planned["month-" + (i + 1)]);
    epic_comp.push(vel_data["epic"].epic_completed["month-" + (i + 1)]);
    story_plan.push(vel_data["story"].story_planned["month-" + (i + 1)]);
    story_comp.push(vel_data["story"].story_completed["month-" + (i + 1)]);
  }
  issue_velocity_avg.push(await calculateAverage(bug_plan));
  issue_velocity_avg.push(await calculateAverage(bug_comp));
  issue_velocity_avg.push(await calculateAverage(task_plan));
  issue_velocity_avg.push(await calculateAverage(task_comp));
  issue_velocity_avg.push(await calculateAverage(epic_plan));
  issue_velocity_avg.push(await calculateAverage(epic_comp));
  issue_velocity_avg.push(await calculateAverage(story_plan));
  issue_velocity_avg.push(await calculateAverage(story_comp));
  velocity_avg = await calculateAverage(issue_velocity_avg);
  let velocity_data = {
    bug_plan: bug_plan,
    bug_comp: bug_comp,
    task_plan: task_plan,
    task_comp: task_comp,
    epic_plan: epic_plan,
    epic_comp: epic_comp,
    story_plan: story_plan,
    story_comp: story_comp,
    velocity_avg: velocity_avg,
    month_name: month_name,
    //"month_name":month_name
  };
  return velocity_data;
},
  module.exports.getAppsVelocityData = async (user_mail) => {
    let applications = await application_service.getUserApplicationsbyEmail(user_mail);

    let Objapplication = (applications && applications.hasOwnProperty('user_allocation')) ? applications.user_allocation.map(
      (elem) => elem.application_key
    ) : []

    let vel_data = await getAppsVelocity(Objapplication);
    let bug_plan = [],
      story_plan = [],
      epic_plan = [],
      task_plan = [],
      n = 6;
    let month_name = [],
      month_list = [];
    let bug_comp = [],
      story_comp = [],
      epic_comp = [],
      task_comp = [],
      issue_velocity_avg = [],
      velocity_avg = 0;
    let system_date_temp = await get_current_date.getCurrentDate(); //

    let system_date = system_date_temp.getMonth();

    let record_start_date_temp = await get_current_date.addMonths(
      system_date_temp,
      -n
    ); //

    let record_start_date = system_date - (n - 1);
    if (record_start_date < 0) {
      record_start_date = 12 + record_start_date;
    }
    for (let i = 0; i < n; i++) {
      month_list.push(
        record_start_date + i <= 11
          ? record_start_date + i
          : ((record_start_date + i) % 11) - 1
      );
    }
    for (let i = 0; i < n; i++) {
      month_name.push(await getMonthName(month_list[i]));
      bug_plan.push(vel_data["bug"].bug_planned["month-" + (i + 1)]);
      bug_comp.push(vel_data["bug"].bug_completed["month-" + (i + 1)]);
      task_plan.push(vel_data["task"].task_planned["month-" + (i + 1)]);
      task_comp.push(vel_data["task"].task_completed["month-" + (i + 1)]);
      epic_plan.push(vel_data["epic"].epic_planned["month-" + (i + 1)]);
      epic_comp.push(vel_data["epic"].epic_completed["month-" + (i + 1)]);
      story_plan.push(vel_data["story"].story_planned["month-" + (i + 1)]);
      story_comp.push(vel_data["story"].story_completed["month-" + (i + 1)]);
    }
    issue_velocity_avg.push(await calculateAverage(bug_plan));
    issue_velocity_avg.push(await calculateAverage(bug_comp));
    issue_velocity_avg.push(await calculateAverage(task_plan));
    issue_velocity_avg.push(await calculateAverage(task_comp));
    issue_velocity_avg.push(await calculateAverage(epic_plan));
    issue_velocity_avg.push(await calculateAverage(epic_comp));
    issue_velocity_avg.push(await calculateAverage(story_plan));
    issue_velocity_avg.push(await calculateAverage(story_comp));
    velocity_avg = await calculateAverage(issue_velocity_avg);
    let velocity_data = {
      bug_plan: bug_plan,
      bug_comp: bug_comp,
      task_plan: task_plan,
      task_comp: task_comp,
      epic_plan: epic_plan,
      epic_comp: epic_comp,
      story_plan: story_plan,
      story_comp: story_comp,
      velocity_avg: velocity_avg,
      month_name: month_name,
      //"month_name":month_name
    };
    return velocity_data;
  },
  /**
   * This function returns the Distribution for application sprint
   * @param {String} application_key
   */
  module.exports.getDistribution = async (application_key) => {
    let vel_data = await getVelocity(application_key);
    let n = 6;
    let month_name = [],
      month_list = [];
    let bug_distribution = {},
      story_distribution = {},
      epic_distribution = {},
      task_distribution = {},
      task_data = {},
      dist_data = {};
    let system_date_temp = await get_current_date.getCurrentDate();
    // let system_date_temp_old = await get_current_date.getCurrentDate()

    // let system_date_temp = await get_current_date.addMonths(system_date_temp_old,-4)//

    let system_date = system_date_temp.getMonth();

    // let record_start_date_temp = await get_current_date.addMonths(system_date_temp, -n);//

    let record_start_date = system_date - (n - 1);
    if (record_start_date < 0) {
      record_start_date = 12 + record_start_date;
    }
    for (let i = 0; i < n; i++) {
      month_list.push(
        record_start_date + i <= 11
          ? record_start_date + i
          : ((record_start_date + i) % 11) - 1
      );
    }
    for (let i = 0; i < n; i++) {
      bug_distribution["month-" + (i + 1)] = [];
      story_distribution["month-" + (i + 1)] = [];
      epic_distribution["month-" + (i + 1)] = [];
      task_distribution["month-" + (i + 1)] = [];
    }
    try {
      for (let i = 0; i < n; i++) {
        month_name.push(await getMonthName(month_list[i]));
        task_distribution["month-" + (i + 1)] = await calculatePercentage(
          vel_data.task.task_planned["month-" + (i + 1)],
          vel_data.task.task_completed["month-" + (i + 1)]
        );
        story_distribution["month-" + (i + 1)] = await calculatePercentage(
          vel_data.story.story_planned["month-" + (i + 1)],
          vel_data.story.story_completed["month-" + (i + 1)]
        );
        epic_distribution["month-" + (i + 1)] = await calculatePercentage(
          vel_data.epic.epic_planned["month-" + (i + 1)],
          vel_data.epic.epic_completed["month-" + (i + 1)]
        );
        bug_distribution["month-" + (i + 1)] = await calculatePercentage(
          vel_data.bug.bug_planned["month-" + (i + 1)],
          vel_data.bug.bug_completed["month-" + (i + 1)]
        );
      }
      let bug_dist = [],
        story_dist = [],
        epic_dist = [],
        task_dist = [],
        issue_distribution_avg = [],
        distribution_avg = 0;
      let task_data = {
        task_distribution: task_distribution,
        story_distribution: story_distribution,
        epic_distribution: epic_distribution,
        bug_distribution: bug_distribution,
      };
      for (let i = 0; i < n; i++) {
        bug_dist.push(task_data.bug_distribution["month-" + (i + 1)]);
        task_dist.push(task_data.task_distribution["month-" + (i + 1)]);
        epic_dist.push(task_data.epic_distribution["month-" + (i + 1)]);
        story_dist.push(task_data.story_distribution["month-" + (i + 1)]);
      }
      dist_data = {
        bug_distribution: bug_dist,
        epic_distribution: epic_dist,
        story_distribution: story_dist,
        task_distribution: task_dist,
        month_name: month_name,
        // "month_name" : ["Jan","Feb","Mar","Apr","May","Jun"]
      };
      return dist_data;
    } catch (error) {
      throw error;
    }
  },
  /**
   * This function returns the MTTR for application sprint
   * @param {String} application_key
   */
  module.exports.getMTTR = async (application_key) => {
    //  return await get_current_date.convertSecToDays(2*86400);

    try {
      // var responseData = await servicenow_connector.get_all_servicenow_data(
      //   application_key
      // );

      // if (responseData !== "ERROR") {
      //   await snow_vsm_data.deleteMany({ application_key: application_key });
      //   for await (var res of responseData) {
      //     if (
      //       res.u_application_key != null &&
      //       typeof res.u_application_key != undefined &&
      //       res.u_application_key != ""
      //     ) {
      //       await snow_vsm_data.create({
      //         application_key: res.u_application_key,
      //         opened_at: res.opened_at,
      //         calendar_stc: res.calendar_stc,
      //       });
      //     }
      //   }
      // }

      var vsm_data = await snow_vsm_data.find({
        application_key: application_key,
      });

      // var current_date = new Date().getMonth();
      let system_date_temp_old = await get_current_date.getCurrentDate();

      let system_date_temp = await get_current_date.addMonths(
        system_date_temp_old,
        -4
      ); //
      var current_date = system_date_temp.getMonth();

      //var current_date =12;
      var response_time = [0, 0, 0, 0, 0, 0];
      var ticket_count = [0, 0, 0, 0, 0, 0];
      var ticket_month = [];
      var avg_response_time = [];
      var monthname = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      ticket_month[0] =
        monthname[
        current_date - 5 < 0 ? 12 + current_date - 5 : current_date - 5
        ];
      ticket_month[1] =
        monthname[
        current_date - 4 < 0 ? 12 + current_date - 4 : current_date - 4
        ];
      ticket_month[2] =
        monthname[
        current_date - 3 < 0 ? 12 + current_date - 3 : current_date - 3
        ];
      ticket_month[3] =
        monthname[
        current_date - 2 < 0 ? 12 + current_date - 2 : current_date - 2
        ];
      ticket_month[4] =
        monthname[
        current_date - 1 < 0 ? 12 + current_date - 1 : current_date - 1
        ];
      ticket_month[5] = monthname[current_date];
      for await (let res of vsm_data) {
        // (june : total resolved : no of tickets)
        let irs_date = new Date(res.opened_at);
        let month = irs_date.getMonth();

        // current_date = 12;
        switch (month) {
          case current_date: {
            response_time[5] =
              response_time[5] +
              (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
            ticket_count[5] = ticket_count[5] + 1;
          
            break;
          }
          case current_date - 1 < 0
            ? 12 + current_date - 1
            : current_date - 1: {
              response_time[4] =
                response_time[4] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[4] = ticket_count[4] + 1;
           
              break;
            }
          case current_date - 2 < 0
            ? 12 + current_date - 2
            : current_date - 2: {
              response_time[3] =
                response_time[3] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[3] = ticket_count[3] + 1;
            
              break;
            }
          case current_date - 3 < 0
            ? 12 + current_date - 3
            : current_date - 3: {
              response_time[2] =
                response_time[2] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[2] = ticket_count[2] + 1;
         
              break;
            }
          case current_date - 4 < 0
            ? 12 + current_date - 4
            : current_date - 4: {
              response_time[1] =
                response_time[1] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[1] = ticket_count[1] + 1;
            
              break;
            }
          case current_date - 5 < 0
            ? 12 + current_date - 5
            : current_date - 5: {
              response_time[0] =
                response_time[0] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[0] = ticket_count[0] + 1;
          
              break;
            }
        }
      }
      
      for (let i = 0; i < 6; i++) {
        avg_response_time[i] =
          response_time[i] == 0 ? 0 : response_time[i] / ticket_count[i];
        avg_response_time[i] = await get_current_date.convertSecToDays(
          avg_response_time[i]
        );
      }
      let servicenow_data = {
        ticket_month: ticket_month,
        // "ticket_month": ["Jan","Feb","Mar","Apr","May","Jun"],
        ticket_count: ticket_count,
        avg_response_time: avg_response_time,
        response_time: response_time,
      };
    
      return servicenow_data;
    } catch (err) {
  
      throw err;
    }
  };
/**
 * This function segregates the issue according to the start date into a month bucket
 * @param {Date} issue_actual_start_date
 * @param {Date} record_start_date
 * @param {Integer} n
 */
const returnMonthBucket = async (issue_date, record_start_date, n) => {
  let issue_month = new Date(issue_date).getMonth();
  for (let i = 0; i < n; i++) {
    let new_date = record_start_date + i;
    if (issue_month == new_date) {
      return "month-" + (i + 1);
    }
  }
},
  /**
   * This function calculates the effective element(old formula -> not used currently)
   * @param {Date} issue_actual_end_date
   * @param {Date} issue_actual_start_date
   * @param {Date} sprint_start_date
   */
  calculateEffElement = async (
    issue_actual_end_date,
    issue_actual_start_date,
    sprint_start_date
  ) => {
    try {
      let actual_end_date = moment(issue_actual_end_date, "YYYY-MM-DD");
      let actual_start_date = moment(issue_actual_start_date, "YYYY-MM-DD");
      let actual_sprint_start_date = moment(sprint_start_date, "YYYY-MM-DD");
      let num = actual_end_date.diff(actual_start_date, "days");
      let den = actual_end_date.diff(actual_sprint_start_date, "days");
      let x = [num / den] * 100;
      return x;
    } catch (error) {
      throw error;
    }
  };

/**
 * This function calculates the cycle time element
 * @param {Date} issue_actual_end_date
 * @param {Date} sprint_start_date
 */
const calculateCTElement = async (issue_actual_end_date, sprint_start_date) => {
  try {
    let actual_end_date;
    let actual_sprint_start_date;
    if (issue_actual_end_date != 0) {
      actual_end_date = moment(issue_actual_end_date, "YYYY-MM-DD");
      actual_sprint_start_date = moment(sprint_start_date, "YYYY-MM-DD");
      let ct = actual_end_date.diff(actual_sprint_start_date, "days");
      return ct;
    } else return 0;
  } catch (error) {
    throw error;
  }
};
/**
 * This function calculates average of list of items
 * @param {String} list_items
 */
const calculateAverage = async (list_items) => {
  try {
    let count = 0;
    let average;
    for await (let list_item of list_items) {
      count += isNaN(list_item) ? 0 : list_item;;
    }
    average = count / list_items.length;
    if (isNaN(average)) {
      return 0;
    } else {
      return parseFloat(average.toFixed(2));
    }
    // if(average != 'NaN'){
    //   return parseFloat(average.toFixed(2));
    // }
    // else{
    //   return 0;
    // }
  } catch (error) {
    throw error;
  }
};
/**
 * This function calculates percentage
 * @param {Integer} issue_planned
 * @param {Integer} issue_completed
 */
const calculatePercentage = async (issue_planned, issue_completed) => {
  try {
    if (issue_planned != 0) {
      let percentage = (issue_completed / issue_planned) * 100;
      return parseFloat(percentage.toFixed(2));
    } else {
      return 0;
    }
  } catch (error) {
    throw error;
  }
};
/**
 * This function calculates the month according to date library used
 *  where 0 represents Jan and 11 represents Dec
 * @param {Integer} month_number
 */
const getMonthName = async (month_number) => {
  switch (month_number) {
    case 0:
      return "Jan";

    case 1:
      return "Feb";

    case 2:
      return "Mar";

    case 3:
      return "Apr";

    case 4:
      return "May";

    case 5:
      return "June";

    case 6:
      return "July";

    case 7:
      return "Aug";

    case 8:
      return "Sep";

    case 9:
      return "Oct";

    case 10:
      return "Nov";

    case 11:
      return "Dec";
  }
},
  /**
   * This function returns a list of all pipeline in an application
   * @param {String} application_key
   */
  getPipelinesOfApplication = async (application_key) => {
    try {
      let pipeline_data = await application
        .findOne({ application_key: application_key })
        .populate("pipelines", "pipeline_key");
      let pipeline_keys = [];
      for await (let pipeline of pipeline_data.pipelines) {
        pipeline_keys.push(pipeline.pipeline_key);
      }
      return pipeline_keys;
    } catch (error) {
      throw new Error(error);
    }
  };
/**
 * This function calculates the effective element according to time
 * @param {Integer} timeoriginalestimate
 * @param {Integer} timespent
 */

const calculateEffectiveTime = async (timeoriginalestimate, timespent) => {
  try {
    let efficiency_factor = (timespent / timeoriginalestimate) * 100;
    if (isNaN(efficiency_factor)) {
      return 0;
    } else {
      if (timespent == timeoriginalestimate) {
        return 100;
      } else if (timespent < timeoriginalestimate) {
        return efficiency_factor + 100;
      } else {
        return efficiency_factor - 100;
      }
    }
    // if(efficiency_factor != NaN){
    //   if (timespent <= timeoriginalestimate) {
    //     return (efficiency_factor + 100);
    //   }
    //   else {
    //     return (efficiency_factor - 100);
    //   }
    // }
    // else{
    //   return 0;
    // }
  } catch (error) {
    logger.error("Error", error);

    throw error;
  }
};
/**
 * This function returns a list of all issues in a pipeline.
 * @param {Array<String>} pipeline_keys
 */

const getAllIssuesOfPipeline = async (application_key) => {
  try {
    // let plan_data= await planning_data.find({"application_key":application_key});

    let issue_details_list = await planning_data.aggregate([
      {
        $match: {
          application_key: application_key,
          is_delete: false,
          actual_start_date: { $ne: null, $exists: true },
          actual_end_date: { $ne: null, $exists: true },
        },
      },
      {
        $lookup: {
          from: "sprints",
          localField: "issue_sprint",
          foreignField: "sprint_logical_name",
          as: "sprint_details",
        },
      },
      // { $unwind: { path: '$sprint_details' } },
      {
        $addFields: {
          sprint_start_date: "$sprint_details.start_date",
          sprint_end_date: "$sprint_details.end_date",
          sprint_logical_name: "$sprint_details.sprint_logical_name",
          sprint_active: "$sprint_details.sprint_active",
          issue_actual_start_date: "$actual_start_date",
          issue_actual_end_date: "$actual_end_date",
        },
      },
      {
        $project: {
          issue_actual_start_date: 1,
          issue_actual_end_date: 1,
          issue_key: 1,
          timeoriginalestimate: 1,
          timespent: 1,
          sprint_start_date: 1,
          sprint_end_date: 1,
          sprint_active: 1,
          issue_type: 1,
          issue_status: 1,
        },
      },
    ]);

    return issue_details_list;
  } catch (error) {
    throw new Error(error);
  }
};
const getTotalIssuesOfPipeline = async (application_key) => {
  try {
    // let plan_data= await planning_data.find({"application_key":application_key});

    let issue_details_list = await planning_data.aggregate([
      {
        $match: {
          application_key: { $in: application_key },
          is_delete: false,
          actual_start_date: { $ne: null, $exists: true },
          actual_end_date: { $ne: null, $exists: true },
        },
      },
      {
        $lookup: {
          from: "sprints",
          localField: "issue_sprint",
          foreignField: "sprint_logical_name",
          as: "sprint_details",
        },
      },
      // { $unwind: { path: '$sprint_details' } },
      {
        $addFields: {
          sprint_start_date: "$sprint_details.start_date",
          sprint_end_date: "$sprint_details.end_date",
          sprint_logical_name: "$sprint_details.sprint_logical_name",
          sprint_active: "$sprint_details.sprint_active",
          issue_actual_start_date: "$actual_start_date",
          issue_actual_end_date: "$actual_end_date",
        },
      },
      {
        $project: {
          issue_actual_start_date: 1,
          issue_actual_end_date: 1,
          issue_key: 1,
          timeoriginalestimate: 1,
          timespent: 1,
          sprint_start_date: 1,
          sprint_end_date: 1,
          sprint_active: 1,
          issue_type: 1,
          issue_status: 1,
        },
      },
    ]);

    return issue_details_list;
  } catch (error) {
    throw new Error(error);
  }
};

const getAppsAllIssuesOfPipeline = async (application_key) => {
  try {
    // let plan_data= await planning_data.find({"application_key":application_key});

    let issue_details_list = await planning_data.aggregate([
      {
        $match: {
          application_key: { $in: application_key },
          is_delete: false,
          actual_start_date: { $ne: null, $exists: true },
          actual_end_date: { $ne: null, $exists: true },
        },
      },
      {
        $lookup: {
          from: "sprints",
          localField: "issue_sprint",
          foreignField: "sprint_logical_name",
          as: "sprint_details",
        },
      },
      // { $unwind: { path: '$sprint_details' } },
      {
        $addFields: {
          sprint_start_date: "$sprint_details.start_date",
          sprint_end_date: "$sprint_details.end_date",
          sprint_logical_name: "$sprint_details.sprint_logical_name",
          sprint_active: "$sprint_details.sprint_active",
          issue_actual_start_date: "$actual_start_date",
          issue_actual_end_date: "$actual_end_date",
        },
      },
      {
        $project: {
          issue_actual_start_date: 1,
          issue_actual_end_date: 1,
          issue_key: 1,
          timeoriginalestimate: 1,
          timespent: 1,
          sprint_start_date: 1,
          sprint_end_date: 1,
          sprint_active: 1,
          issue_type: 1,
          issue_status: 1,
        },
      },
    ]);

    return issue_details_list;
  } catch (error) {
    throw new Error(error);
  }
};
module.exports.getDevelopmentMetrics = async (body) => {
  try {
    let active_sprints = await sprint.find({
      application_key: body,
      sprint_active: true,
    });
    let sprints = await sprint.find({ application_key: body });
    let active_sprints_count = await sprint
      .find({ application_key: body, sprint_active: true })
      .countDocuments();
    let date_data = [];
    var avg_comp_time = 0;
    let tool_details = await tool.find({ application_key: body });
    let azure_auth_token;
    let jira_auth_token;
    var comp_time = 0;
    var average_completion_time;
    let resp;
    let development_metrics;
    let pipelines_of_application;
    let commits_array = [];
    let commits_array_length = 0;
    let code_change_array = [];
    let new_change_array = [];
    let deleted_change_array = [];
    let update_change_array = [];
    let code_change = 0;
    let delete_code_change = 0;
    let update_code_change = 0;
    let new_code_change = 0;
    for await (let active of active_sprints) {
      let work_items = await planning_data.find({
        application_key: body,
        sprint_id: active.sprint_id,
      });
      // for (let tool_detail of tool_details) {
      //   if (tool_detail.tool_name == 'Azure Boards') {
      //     azure_auth_token = new Buffer.from(
      //       ':' +
      //       tool_detail.tool_auth.auth_password
      //     ).toString('base64');
      //     for (let workitem of work_items) {
      //       resp = await azure_sevices.getDetailsOfWorkItem(workitem.issue_id, active.tool_project_key, azure_auth_token, tool_detail.tool_url);

      //       if (!isNaN(resp)) {
      //         date_data.push(resp);
      //       }
      //     }
      //   }
      //   else if (tool_detail.tool_name == 'Jira') {
      //     jira_auth_token = new Buffer.from(
      //       tool_detail.tool_auth.auth_user_mail + ':' + tool_detail.tool_auth.auth_password
      //     ).toString('base64');
      //     for (let workitem of work_items) {
      //       resp = await jira_sync.getWorkItemsHistory(tool_detail.tool_url, active.tool_project_key, active.sprint_id, workitem.issue_id, jira_auth_token)

      //       if (!isNaN(resp) && resp != 0) {
      //         date_data.push(resp);
      //       }

      //     }
      //   }
      // }
      for await (let work_item of work_items) {
        if (
          work_item.issue_status == "DONE" ||
          work_item.issue_status == "COMPLETED"
        ) {
          date_data.push(work_item.completionTime);
        }
      }
      for await (let data of date_data) {
        comp_time = comp_time + data;
      }
      avg_comp_time = comp_time / date_data.length;
      if (isNaN(avg_comp_time)) {
        return 0;
      } else {
        average_completion_time = avg_comp_time.toFixed(2);
        // average_completion_time = avg_comp_time;
      }
      let details_of_application = await application.findOne({
        application_key: body,
      });
      pipelines_of_application = details_of_application.pipelines;
      if (pipelines_of_application.length == 0) {
        commits_array = [];
      } else {
        for await (let pipeline of pipelines_of_application) {
          let pipelined = await pipeline_data.findOne({ _id: pipeline });
          let pip_key = pipelined.pipeline_key;
          let scm_commits = await scm_data.find({
            pipeline_key: pip_key,
            type: "COMMIT",
          });
          for await (let commit of scm_commits) {
            let commit_date = new Date(commit.commit_timestamp);
            let sprint_startdate = new Date(active.start_date);
            let sprint_enddate = new Date(active.end_date);
            if (
              +commit_date <= +sprint_enddate &&
              +commit_date >= +sprint_startdate
            ) {
              commits_array.push(commit_date);

              code_change_array.push(commit.stats.total);
              new_change_array.push(commit.stats.additions);
              deleted_change_array.push(commit.stats.deletions);
              if (commit.stats.edits != undefined) {
                update_change_array.push(commit.stats.edits);
              }
            }
          }
        }
      }
    }

    if (sprints.length == 0) {
      development_metrics = {
        average_days: 0,
        commits: 0,
        code_changes: 0,
        new_changes: 0,
        delete_changes: 0,
        update_changes: 0,
      };
    } else {
      commits_array_length = commits_array.length;
      for (let i = 0; i < code_change_array.length; i++) {
        code_change += code_change_array[i];
      }
      for (let i = 0; i < new_change_array.length; i++) {
        new_code_change += new_change_array[i];
      }
      for (let i = 0; i < deleted_change_array.length; i++) {
        delete_code_change += deleted_change_array[i];
      }
      if (update_change_array.length >= 1) {
        for (let i = 0; i < update_change_array.length; i++) {
          update_code_change += update_change_array[i];
        }
      }

      development_metrics = {
        average_days: average_completion_time,
        commits: commits_array_length,
        code_changes: code_change,
        new_changes: new_code_change,
        delete_changes: delete_code_change,
        update_changes: update_code_change,
      };
    }

    return development_metrics;
  } catch (error) {
    throw error;
  }
};
module.exports.getTestMetrics = async (body) => {
  try {
    let active_sprints = await sprint.find({
      application_key: body,
      sprint_active: true,
    });
    let sprints = await sprint.find({ application_key: body });
    let active_sprints_count = await sprint
      .find({ application_key: body, sprint_active: true })
      .countDocuments();
    let tool_details = await tool.find({ application_key: body });
    let details_of_application = await application.findOne({
      application_key: body,
    });
    let pipelines_of_application = details_of_application.pipelines;
    let bugs_array = [];
    let vulnerabilities_array = [];
    let codeCoverage_array = [];
    let technicalDebt_array = [];
    let vulnerability_count = 0;
    let codeCoverage_count = 0;
    let technicalDebt_count = 0;
    let bugs_count = 0;
    let bugs;
    let count = 0;
    let testMetrics;
    let counttest = 0;
    let pipcounttest = 0;
    let totalTest = [];
    let passTest = [];
    let failTest = [];
    let totalTestft = [];
    let passTestft = [];
    let failTestft = [];
    let passCount = 0;
    let failCount = 0;
    let totalcount = 0;
    let totalSeleniumTest = [];
    let passSeleniumTest = [];
    let failSeleniumTest = [];
    let passSeleniumCount = 0;
    let failSeleniumCount = 0;
    let totalSeleniumcount = 0;
    let passSeleniumTestv = 0;
    if (pipelines_of_application.length == 0) {
    } else {
      for await (let pipeline of pipelines_of_application) {
        let pipelined = await pipeline_data.findOne({ _id: pipeline });
        let pip_key = pipelined.pipeline_key;
        if (pipelined.code_quality.configured == true) {
          count++;
          let ca_results = await ca.find({ pipeline_key: pip_key });
          for await (let result of ca_results) {
            if (
              result.bugs != 0 ||
              result.bugs != undefined ||
              result.bugs != null
            ) {
              bugs_array.push(result.bugs);
            }
            if (
              result.vulnerabilities != 0 ||
              result.vulnerabilities != undefined ||
              result.vulnerabilities != null
            ) {
              vulnerabilities_array.push(result.vulnerabilities);
            }
            if (
              result.line_coverage != 0 ||
              result.line_coverage != undefined ||
              result.line_coverage != null
            ) {
              codeCoverage_array.push(result.line_coverage);
            }
            if (
              result.technical_debt != 0 ||
              result.technical_debt != undefined ||
              result.technical_debt != null
            ) {
              technicalDebt_array.push(result.technical_debt);
            }
          }
        }
        let ci_detail = await ci_data.find({ pipeline_key: pip_key }).lean();

        if (ci_detail.length != 0) {
          pipcounttest++;
          for (let detail of ci_detail) {
            // detail.toObject();
            if (
              detail.build_test.unit_test != undefined &&
              detail.build_test.functional_test != undefined
            ) {
              if (
                detail.build_test.unit_test.totalCount != 0 ||
                detail.build_test.unit_test.totalCount != null
              ) {
                totalTest.push(detail.build_test.unit_test.totalCount);
                failTest.push(detail.build_test.unit_test.failCount);
                let passValue =
                  detail.build_test.unit_test.totalCount -
                  detail.build_test.unit_test.failCount;
                passTest.push(passValue);
              }
              if (
                detail.build_test.functional_test.totalCount != 0 ||
                detail.build_test.functional_test.totalCount != null ||
                detail.build_test.functional_test.totalCount != undefined
              ) {
                totalTestft.push(detail.build_test.functional_test.totalCount);
                failTestft.push(detail.build_test.functional_test.failCount);
                let passV =
                  detail.build_test.functional_test.totalCount -
                  detail.build_test.functional_test.failCount;

                passTestft.push(passV);
              }
            }
          }
        }
      }
    }
    for (let i = 0; i < bugs_array.length; i++) {
      bugs_count += bugs_array[i];
    }
    for (let i = 0; i < vulnerabilities_array.length; i++) {
      vulnerability_count += vulnerabilities_array[i];
    }
    for (let i = 0; i < technicalDebt_array.length; i++) {
      technicalDebt_count += technicalDebt_array[i];
    }
    for (let i = 0; i < codeCoverage_array.length; i++) {
      codeCoverage_count += codeCoverage_array[i];
    }
    for (let i = 0; i < totalTest.length; i++) {
      totalcount += totalTest[i];
    }
    for (let i = 0; i < failTest.length; i++) {
      failCount += failTest[i];
    }
    for (let i = 0; i < passTest.length; i++) {
      passCount += passTest[i];
    }
    for (let i = 0; i < totalTestft.length; i++) {
      totalSeleniumcount += totalTestft[i];
    }
    for (let i = 0; i < failTestft.length; i++) {
      failSeleniumCount += failTestft[i];
    }
    for (let i = 0; i < passTestft.length; i++) {
      passSeleniumCount += Number(passTestft[i]);
    }

    if (count == 0) {
      testMetrics = {
        technicalDebt: 0,
        codeCoverage: 0,
        bugs: 0,
        vulnerabilities: 0,
        test: {
          unit_test: {
            pass: passCount,
            fail: failCount,
          },
          functional_test: {
            pass: passSeleniumCount,
            fail: failSeleniumCount,
          },
        },
      };
    } else {
      testMetrics = {
        technicalDebt: technicalDebt_count / count,
        codeCoverage: codeCoverage_count / count,
        bugs: Math.ceil(bugs_count / count),
        vulnerabilities: vulnerability_count / count,
        test: {
          unit_test: {
            pass: passCount / count,
            fail: failCount / count,
          },
          functional_test: {
            pass: passSeleniumCount / count,
            fail: failSeleniumCount / count
          }
        }
      }
    }

    return testMetrics;
  } catch (error) {
    throw error;
  }
};

module.exports.getPlanMetrics = async (body) => {
  try {

    var epic_count;
    var story_count;
    var bug_count;
    var task_count;
    var spillover_count;
    let planMetrics;
    let active_sprints = await sprint.find({
      application_key: body,
      sprint_active: true,
    });
    let sprints = await sprint.find({ application_key: body });
    let active_sprints_count = await sprint.find({ application_key: body, sprint_active: true }).countDocuments();
    // console.log("hii", Math.random() < 0.5);
    for await (let active of active_sprints) {
      // epic_count = active.epics.length;
      // story_count = active.stories.length;
      // bug_count = active.bugs.length;
      // task_count = active.tasks.length;
      task_count = await planning_data.find({ application_key: body, issue_type: "TASK", sprint_id: active.sprint_id }).countDocuments();
      epic_count = await planning_data.find({ application_key: body, issue_type: "EPIC", sprint_id: active.sprint_id }).countDocuments();
      bug_count = await planning_data.find({ application_key: body, issue_type: "BUG", sprint_id: active.sprint_id }).countDocuments();
      story_count = await planning_data.find({ application_key: body, issue_type: "STORY", sprint_id: active.sprint_id }).countDocuments();

      spillover_count = await planning_data
        .find({
          application_key: body,
          isSpillOver: true,
          sprint_id: active.sprint_id,
        })
        .countDocuments();
      total_stories = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "STORY",
        })
        .countDocuments();
      completed_stories = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "STORY",
          issue_status: { $in: ["DONE", "DEVELOPED", "CLOSED"] },
        })
        .countDocuments();
      inprogress_stories = await await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "STORY",
          issue_status: { $in: ["IN PROGRESS", "DOING", "IN-PROGRESS"] },
        })
        .countDocuments();

      total_task = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "TASK",
        })
        .countDocuments();
      completed_task = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "TASK",
          issue_status: { $in: ["DONE", "DEVELOPED", "CLOSED"] },
        })
        .countDocuments();
      inprogress_task = await await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "TASK",
          issue_status: { $in: ["IN PROGRESS", "DOING", "IN-PROGRESS"] },
        })
        .countDocuments();

      total_epics = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "EPIC",
        })
        .countDocuments();
      completed_epics = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "EPIC",
          issue_status: { $in: ["DONE", "DEVELOPED", "CLOSED"] },
        })
        .countDocuments();
      inprogress_epics = await await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "EPIC",
          issue_status: { $in: ["IN PROGRESS", "DOING", "IN-PROGRESS"] },
        })
        .countDocuments();

      total_bugs = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "BUG",
        })
        .countDocuments();
      completed_bugs = await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "BUG",
          issue_status: { $in: ["DONE", "DEVELOPED", "CLOSED"] },
        })
        .countDocuments();
      inprogress_bugs = await await planning_data
        .find({
          application_key: body,
          sprint_id: active.sprint_id,
          issue_type: "BUG",
          issue_status: { $in: ["IN PROGRESS", "DOING", "IN-PROGRESS"] },
        })
        .countDocuments();

      try {
        let sprint_start = JSON.stringify(active.start_date);
        let sprint_end = JSON.stringify(active.end_date);
        let sprint_startt = active.start_date;
        let sprint_endt = active.end_date;

        let start_date = sprint_start.split("T");
        let end_date = sprint_end.split("T");
        let strtt = new Date(start_date);
        let endd = new Date(end_date);

        const diffTime = Math.abs(sprint_endt - sprint_startt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (error) {
        throw error;
      }
    }

    let backlogs = await planning_data.find({ application_key: body, sprint_id: "", issue_status: { $nin: ["DONE", "DEVELOPED", "CLOSED"] } }).countDocuments();



    if (sprints.length == 0) {
      planMetrics = {
        epics: 0,
        stories: 0,
        bugs: 0,
        backlog: 0,
        tasks: 0,
        activeSprints: 0,
        spillOver: 0,
        story: {
          total: 0,
          inprogress: 0,
          completed: 0,
        },
        task: {
          total: 0,
          inprogress: 0,
          completed: 0,
        },
        bug: {
          total: 0,
          inprogress: 0,
          completed: 0,
        },
        epic: {
          total: 0,
          inprogress: 0,
          completed: 0,
        },
      };
    } else {
      planMetrics = {
        epics: epic_count,
        stories: story_count,
        bugs: bug_count,
        backlog: backlogs,
        tasks: task_count,
        activeSprints: active_sprints_count,
        spillOver: spillover_count,
        story: {
          total: total_stories,
          inprogress: inprogress_stories,
          completed: completed_stories,
        },
        task: {
          total: total_task,
          inprogress: inprogress_task,
          completed: completed_task,
        },
        bug: {
          total: total_bugs,
          inprogress: inprogress_bugs,
          completed: completed_bugs,
        },
        epic: {
          total: total_epics,
          inprogress: inprogress_epics,
          completed: completed_epics,
        },
      };
    }

    return planMetrics;
  } catch (error) {
    throw error;
  }
};

module.exports.getDeployementMetrics = async (body) => {
  try {
    let Count = 0;
    let sum = 0;
    let TotalDays_array = [];
    let MTTR = 0;
    let TotalDays_count = 0;
    let buildratio = 0;
    let avgbuildduration = 0;
    let incidents = 0;
    var ccount = 0;
    let active_sprints = await sprint.find({
      application_key: body,
      sprint_active: true,
    });
    let application_details = await application.findOne({
      application_key: body,
    });
    let pipelines_of_application = application_details.pipelines;
    let application_key = application_details.application_key;
    for await (let pipeline of pipelines_of_application) {
      let pipelineid = await pipeline_data.findOne({ _id: pipeline });
      if (
        pipelineid.continuous_integration != undefined &&
        pipelineid.scm != undefined
      ) {
        if (
          pipelineid.continuous_integration.creation_status == "SUCCESS" &&
          pipelineid.scm.creation_status == "SUCCESS"
        ) {
          Count++;
        }
        let pip_key = pipelineid.pipeline_key;
        let pipeid = await ci_data.findOne({ pipeline_key: pip_key });
        if (pipeid != undefined || pipeid != null) {
          if (pipeid.build_duration != 0) {
            sum = sum + pipeid.build_duration;
          } else if (pipeid.build_duration == 0) {
            sum = 0;
          }
        }
      }
    }
    if (Count != 0) {
      buildratio = Count / pipelines_of_application.length;
    }
    if (sum != 0) {
      avgbuildduration = sum / pipelines_of_application.length;
    }
    let responseData = await snow_data.find(
      { application_key }
    );
   
    if (responseData.length != 0) {
      let incd = responseData.length;
      for await (let active of active_sprints) {
        let sprint_startdate = new Date(active.start_date);
        let sprint_enddate = new Date(active.end_date);

        for (let i = 0; i < responseData.length; i++) {
          var start_date =
            new Date(responseData[i].opened_at);
          var end_date =
            new Date(responseData[i].closed_at);
          if (+start_date >= +sprint_startdate && +end_date <= +sprint_enddate) {
            incidents++;
          }
        }
        for (let i = 0; i < responseData.length; i++) {
          if (responseData[i].incident_state == 'Closed') {
            ccount++;
            var start_date =
              new Date(responseData[i].opened_at);
            var end_date =
              new Date(responseData[i].closed_at);
            // var difTime = (end_date - start_date) / 60 / 60;
            // var difDays = difTime / 24;
            const diffTime = Math.abs(end_date - start_date);
        
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
            if (
              +end_date <= +sprint_enddate &&
              +start_date >= +sprint_startdate
            ) {
              if (isNaN(diffDays)) {

              }
              else {
                TotalDays_array.push(diffDays);
              }
            }
          }
        }
      }
      if (TotalDays_array.length != 0) {
        for (let i = 0; i < TotalDays_array.length; i++) {
          TotalDays_count += TotalDays_array[i];
        }
      }
   
      if (TotalDays_array.length != 0) {
        MTTR = Math.round(TotalDays_count / ccount);
      }
      if (isNaN(MTTR)) {
        MTTR = 0;
      }
    }
 
    deployementMetrics = {
      BuildRatio: buildratio.toFixed(2),
      BuildDuration: avgbuildduration.toFixed(2),
      MTTR: MTTR.toFixed(2),
      Incidents: incidents
    }
    // console.log(deployementMetrics);
    return deployementMetrics;
  } catch (error) {
    throw error;
  }
};

module.exports.getDevelopementLtpt = async (body) => {
  let app_key = body;
  let sprint_details = [];

  try {
    let app_details = await application.findOne({ application_key: app_key });
    let plan_tool = await tool
      .find({ application_key: app_key, tool_category: "Planning" })
      .lean();
    if (plan_tool[0].tool_name == "Jira") {
      project_key = await app_details.plan[0].tool_project_key;
    } else if (plan_tool[0].tool_name == "Azure Boards") {
      project_key = await app_details.plan[0].tool_project_name;
    }
    sprint_details = await sprint_data
      .find({ application_key: app_key, tool_project_key: project_key })
      .lean();
    let responseResult;
    let recorded_date;
    let inProgress_date;
    let date_recorded;
    let processingTime_array = [];
    let latencyTime_array = [];
    let processingTime = 0;
    let latencyTime = 0;
    let pT = 0;
    let lT = 0;
    let token = new Buffer.from(
      plan_tool[0].tool_auth.auth_user_mail +
      ":" +
      plan_tool[0].tool_auth.auth_password
    ).toString("base64");

    for (let j = 0; j < sprint_details.length; j++) {
      if (sprint_details[j].sprint_active == true) {
        let sprint_id = sprint_details[j].sprint_id;
        let development_issues = await planning_data.find({ application_key: app_key, sprint_id: sprint_id, phase: "Development" }).lean();
        // for await (let issue of issues) {
        //   let url = `${plan_tool[0].tool_url}/rest/api/2/search?jql=project=${project_key} AND Sprint=${sprint_id}&expand=changelog`;

        //   if (plan_tool[0].tool_name == "Jira") {
        //     await unirest('GET', `${plan_tool[0].tool_url}/rest/api/2/search?jql=project=${project_key} AND Sprint=${sprint_id}&expand=changelog`)
        //       .headers({
        //         'Authorization': 'Basic' + " " + token
        //       })
        //       .then((response) => {
        //         responseResult = response.body.issues;

        //       });

        //     for await (let response of responseResult) {
        //       if (response.fields.customfield_10800 != null || response.fields.customfield_10800 != undefined) {
        //         if (response.fields.customfield_10800[0].value == "Development") {

        //           let issue_created_date = new Date(response.fields.created);
        //           let history_of_a_issue = response.changelog.histories;
        //           for await (let history of history_of_a_issue) {
        //             let detail_history = history.items;
        //             for (let i = 0; i < detail_history.length; i++) {
        //               if (detail_history[i].fromString == "To Do" && detail_history[i].toString == "In Progress") {
        //                 inProgress_date = new Date(history.created);
        //                 let lt = Math.abs(inProgress_date - issue_created_date);

        //                 let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

        //                 latencyTime_array.push(diffDay);

        //               }
        //               else if (detail_history[i].fromString == "In Progress" && detail_history[i].toString == "Done") {
        //                 recorded_date = new Date(history.created);
        //                 let pt = Math.abs(recorded_date - inProgress_date);

        //                 let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));

        //                 processingTime_array.push(diffDays);

        //               }
        //             }
        //           }


        //         }
        //       }
        //     }

        //   }

        //   else if (plan_tool[0].tool_name == "Azure Boards") {
        //     let azure_tokenn = new Buffer.from(
        //       ':' +
        //       plan_tool[0].tool_auth.auth_password
        //     ).toString('base64');

        //     await unirest('GET', `${plan_tool[0].tool_url}/${project_key}/_apis/wit/workItems/${issue.issue_id}/updates/?api-version=6.1-preview.3`)
        //       .headers({
        //         'Authorization': 'Basic' + " " + azure_tokenn,
        //       })
        //       .then((response) => {
        //         azure_updates = response.body.value
        //       });

        //     for await (let update of azure_updates) {
        //       if (update.fields["System.State"].newValue == "To Do") {
        //         createdAtDate = new Date(update.fields["System.CreatedDate"].newValue);
        //       }
        //       else if (update.fields["System.State"].newValue == "Doing" && update.fields["System.State"].oldValue == "To Do") {
        //         doingDate = new Date(update.fields["System.ChangedDate"].newValue);
        //         let lt = Math.abs(doingDate - createdAtDate);

        //         let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

        //         latencyTime_array.push(diffDay);

        //       }
        //       else if (update.fields["System.State"].newValue == "Done" && update.fields["System.State"].oldValue == "Doing") {
        //         doneDate = new Date(update.fields["System.ChangedDate"].newValue);
        //         let pt = Math.abs(doneDate - doingDate);

        //         let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));

        //         processingTime_array.push(diffDays);

        //       }
        //     }
        //   }
        // }
        for await (let issue of development_issues) {
          if (issue.lT != 0 && issue.lT != null && issue.lT != undefined) {
            latencyTime_array.push(issue.lT);
          }
          if (issue.pT != 0 && issue.pT != null && issue.pT != undefined) {
            processingTime_array.push(issue.pT);
          }

        }

      }
    }

    if (processingTime_array.length != 0) {
      for (i = 0; i < processingTime_array.length; i++) {
        processingTime += processingTime_array[i];
      }
      pT = Math.ceil(processingTime / processingTime_array.length);
    }
    if (latencyTime_array.length != 0) {
      for (i = 0; i < latencyTime_array.length; i++) {
        latencyTime += latencyTime_array[i];
      }
      lT = Math.ceil(latencyTime / latencyTime_array.length);
    }
    let development_LTPT = {
      Lt: lT,
      Pt: pT
    }
    // console.log("development_LTPT ltp",development_LTPT);

    return development_LTPT;
  } catch (error) {
    throw error;
  }
};
module.exports.getTestLtpt = async (body) => {
  let app_key = body;
  let sprint_details = [];

  try {
    let app_details = await application.findOne({ application_key: app_key });
    let plan_tool = await tool
      .find({ application_key: app_key, tool_category: "Planning" })
      .lean();

    if (plan_tool[0].tool_name == "Jira") {
      project_key = await app_details.plan[0].tool_project_key;
    } else if (plan_tool[0].tool_name == "Azure Boards") {
      project_key = await app_details.plan[0].tool_project_name;
    }
    sprint_details = await sprint_data
      .find({ application_key: app_key, tool_project_key: project_key })
      .lean();
    let responseResult;
    let recorded_date;
    let inProgress_date;
    let date_recorded;
    let processingTime_array = [];
    let latencyTime_array = [];
    let processingTime = 0;
    let latencyTime = 0;
    let pT = 0;
    let lT = 0;
    let token = new Buffer.from(
      plan_tool[0].tool_auth.auth_user_mail +
      ":" +
      plan_tool[0].tool_auth.auth_password
    ).toString("base64");

    for (let j = 0; j < sprint_details.length; j++) {
      if (sprint_details[j].sprint_active == true) {
        let sprint_id = sprint_details[j].sprint_id;
        let test_issues = await planning_data.find({ application_key: app_key, sprint_id: sprint_id, phase: "Testing" }).lean();
        // for await (let issue of issues) {
        //   let url = `${plan_tool[0].tool_url}/rest/api/2/search?jql=project=${project_key} AND Sprint=${sprint_id}&expand=changelog`;

        //   if (plan_tool[0].tool_name == "Jira") {
        //     await unirest('GET', `${plan_tool[0].tool_url}/rest/api/2/search?jql=project=${project_key} AND Sprint=${sprint_id}&expand=changelog`)
        //       .headers({
        //         'Authorization': 'Basic' + " " + token
        //       })
        //       .then((response) => {
        //         responseResult = response.body.issues;

        //       });

        //     for await (let response of responseResult) {
        //       if (response.fields.customfield_10800 != null || response.fields.customfield_10800 != undefined) {
        //         if (response.fields.customfield_10800[0].value == "Testing") {
        //           let issue_created_date = new Date(response.fields.created);
        //           let history_of_a_issue = response.changelog.histories;
        //           for await (let history of history_of_a_issue) {
        //             let detail_history = history.items;
        //             for (let i = 0; i < detail_history.length; i++) {
        //               if (detail_history[i].fromString == "To Do" && detail_history[i].toString == "In Progress") {
        //                 inProgress_date = new Date(history.created);
        //                 let lt = Math.abs(inProgress_date - issue_created_date);

        //                 let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

        //                 latencyTime_array.push(diffDay);

        //               }
        //               else if (detail_history[i].fromString == "In Progress" && detail_history[i].toString == "Done") {
        //                 recorded_date = new Date(history.created);
        //                 let pt = Math.abs(recorded_date - inProgress_date);

        //                 let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));

        //                 processingTime_array.push(diffDays);

        //               }
        //             }
        //           }
        //         }
        //       }
        //     }

        //   }
        // else if (plan_tool[0].tool_name == "Azure Boards") {
        //   let azure_tokenn = new Buffer.from(
        //     ':' +
        //     plan_tool[0].tool_auth.auth_password
        //   ).toString('base64');

        //   await unirest('GET', `${plan_tool[0].tool_url}/${project_key}/_apis/wit/workItems/${issue.issue_id}/updates/?api-version=6.1-preview.3`)
        //     .headers({
        //       'Authorization': 'Basic' + " " + azure_tokenn,
        //     })
        //     .then((response) => {
        //       azure_updates = response.body.value
        //     });

        //   for await (let update of azure_updates) {
        //     if (update.fields["System.State"].newValue == "To Do") {
        //       createdAtDate = new Date(update.fields["System.CreatedDate"].newValue);
        //     }
        //     else if (update.fields["System.State"].newValue == "Doing" && update.fields["System.State"].oldValue == "To Do") {
        //       doingDate = new Date(update.fields["System.ChangedDate"].newValue);
        //       let lt = Math.abs(doingDate - createdAtDate);

        //       let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

        //       latencyTime_array.push(diffDay);

        //     }
        //     else if (update.fields["System.State"].newValue == "Done" && update.fields["System.State"].oldValue == "Doing") {
        //       doneDate = new Date(update.fields["System.ChangedDate"].newValue);
        //       let pt = Math.abs(doneDate - doingDate);

        //       let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));

        //       processingTime_array.push(diffDays);

        //     }
        //   }
        // }
        // }
        for await (let issue of test_issues) {
          if (issue.lT != 0 && issue.lT != null && issue.lT != undefined) {
            latencyTime_array.push(issue.lT);
          }
          if (issue.pT != 0 && issue.pT != null && issue.pT != undefined) {
            processingTime_array.push(issue.pT);
          }

        }

      }
    }

    if (processingTime_array.length != 0) {
      for (i = 0; i < processingTime_array.length; i++) {
        processingTime += processingTime_array[i];
      }
      pT = Math.ceil(processingTime / processingTime_array.length);
    }
    if (latencyTime_array.length != 0) {
      for (i = 0; i < latencyTime_array.length; i++) {
        latencyTime += latencyTime_array[i];
      }
      lT = Math.ceil(latencyTime / latencyTime_array.length);
    }

    let testing_LTPT = {
      Lt: lT,
      Pt: pT
    }
    // console.log("test ltp",testing_LTPT);

    return testing_LTPT;
  } catch (error) {
    throw error;
  }
};
module.exports.getDeployementLtpt = async (body) => {
  let app_key = body;
  let sprint_details = [];
  let project_key;

  try {
    let plan_tool = await tool
      .find({ application_key: app_key, tool_category: "Planning" })
      .lean();
    let app_details = await application.findOne({ application_key: app_key });

    if (plan_tool[0].tool_name == "Jira") {
      project_key = await app_details.plan[0].tool_project_key;
    } else if (plan_tool[0].tool_name == "Azure Boards") {
      project_key = await app_details.plan[0].tool_project_name;
    }
    sprint_details = await sprint_data
      .find({ application_key: app_key, tool_project_key: project_key })
      .lean();
    let responseResult;
    let recorded_date;
    let inProgress_date;
    let date_recorded;
    let processingTime_array = [];
    let latencyTime_array = [];
    let processingTime = 0;
    let latencyTime = 0;
    let azure_updates;
    let createdAtDate;
    let doingDate;
    let doneDate;
    let pT = 0;
    let lT = 0;
    let token = new Buffer.from(
      plan_tool[0].tool_auth.auth_user_mail +
      ":" +
      plan_tool[0].tool_auth.auth_password
    ).toString("base64");

    for (let j = 0; j < sprint_details.length; j++) {
      if (sprint_details[j].sprint_active == true) {
        let sprint_id = sprint_details[j].sprint_id;
        let deployment_issues = await planning_data.find({ application_key: app_key, sprint_id: sprint_id, phase: "Deployment" }).lean();
        if (deployment_issues.length != 0) {
          // for await (let issue of issues) {
          //   // let url = `${plan_tool[0].tool_url}/rest/api/2/search?jql=project=${project_key} AND Sprint=${sprint_id}&expand=changelog`;

          //   if (plan_tool[0].tool_name == "Jira") {
          //     await unirest('GET', `${plan_tool[0].tool_url}/rest/api/2/search?jql=project=${project_key} AND Sprint=${sprint_id}&expand=changelog`)
          //       .headers({
          //         'Authorization': 'Basic' + " " + token
          //       })
          //       .then((response) => {
          //         responseResult = response.body.issues;

          //       });

          //     for await (let response of responseResult) {
          //       if (response.fields.customfield_10800 != null || response.fields.customfield_10800 != undefined) {
          //         if (response.fields.customfield_10800[0].value == "Deployment") {
          //           let issue_created_date = new Date(response.fields.created);
          //           let history_of_a_issue = response.changelog.histories;
          //           for await (let history of history_of_a_issue) {
          //             let detail_history = history.items;
          //             for (let i = 0; i < detail_history.length; i++) {
          //               if (detail_history[i].fromString == "To Do" && detail_history[i].toString == "In Progress") {
          //                 inProgress_date = new Date(history.created);
          //                 let lt = Math.abs(inProgress_date - issue_created_date);

          //                 let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

          //                 latencyTime_array.push(diffDay);

          //               }
          //               else if (detail_history[i].fromString == "In Progress" && detail_history[i].toString == "Done") {
          //                 recorded_date = new Date(history.created);
          //                 let pt = Math.abs(recorded_date - inProgress_date);

          //                 let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));

          //                 processingTime_array.push(diffDays);

          //               }
          //             }
          //           }
          //         }
          //       }
          //     }

          //   }
          //   else if (plan_tool[0].tool_name == "Azure Boards") {
          //     let azure_tokenn = new Buffer.from(
          //       ':' +
          //       plan_tool[0].tool_auth.auth_password
          //     ).toString('base64');
          //     await unirest('GET', `${plan_tool[0].tool_url}/${project_key}/_apis/wit/workItems/${issue.issue_id}/updates/?api-version=6.1-preview.3`)
          //       .headers({
          //         'Authorization': 'Basic' + " " + azure_tokenn,
          //       })
          //       .then((response) => {
          //         azure_updates = response.body.value
          //       });

          //     for await (let update of azure_updates) {
          //       if (update.fields["System.State"].newValue == "To Do") {
          //         createdAtDate = new Date(update.fields["System.CreatedDate"].newValue);
          //       }
          //       else if (update.fields["System.State"].newValue == "Doing" && update.fields["System.State"].oldValue == "To Do") {
          //         doingDate = new Date(update.fields["System.ChangedDate"].newValue);
          //         let lt = Math.abs(doingDate - createdAtDate);

          //         let diffDay = Math.ceil(lt / (1000 * 60 * 60 * 24));

          //         latencyTime_array.push(diffDay);

          //       }
          //       else if (update.fields["System.State"].newValue == "Done" && update.fields["System.State"].oldValue == "Doing") {
          //         doneDate = new Date(update.fields["System.ChangedDate"].newValue);
          //         let pt = Math.abs(doneDate - doingDate);

          //         let diffDays = Math.ceil(pt / (1000 * 60 * 60 * 24));

          //         processingTime_array.push(diffDays);

          //       }
          //     }
          //   }

          // }
          for await (let issue of deployment_issues) {
            if (issue.lT != 0 && issue.lT != null && issue.lT != undefined) {
              latencyTime_array.push(issue.lT);
            }
            if (issue.pT != 0 && issue.pT != null && issue.pT != undefined) {
              processingTime_array.push(issue.pT);
            }
          }
        }
      }
    }
    if (processingTime_array.length != 0) {
      for (i = 0; i < processingTime_array.length; i++) {
        processingTime += processingTime_array[i];
      }
      pT = Math.ceil(processingTime / processingTime_array.length);
    }
    if (latencyTime_array.length != 0) {
      for (i = 0; i < latencyTime_array.length; i++) {
        latencyTime += latencyTime_array[i];
      }
      lT = Math.ceil(latencyTime / latencyTime_array.length);
    }
    let deployment_LTPT = {
      Lt: pT,
      Pt: lT
    }
    // console.log("deployment ltp",deployment_LTPT);

    return deployment_LTPT;
  } catch (error) {
    throw error;
  }
};

module.exports.getTotalMTTR = async (user_mail) => {
  //  return await get_current_date.convertSecToDays(2*86400);
  try {
    let applications = await application_service.getUserApplicationsbyEmail(
      user_mail
    );
    let Objapplication = applications.user_allocation.map(elem => elem.application_key)
      // var responseData = await servicenow_connector.get_all_servicenow_data(
      //   application_key
      // );

      // if (responseData !== "ERROR") {
      //   await snow_vsm_data.deleteMany({ application_key: application_key });
      //   for await (var res of responseData) {
      //     if (
      //       res.u_application_key != null &&
      //       typeof res.u_application_key != undefined &&
      //       res.u_application_key != ""
      //     ) {
      //       await snow_vsm_data.create({
      //         application_key: res.u_application_key,
      //         opened_at: res.opened_at,
      //         calendar_stc: res.calendar_stc,
      //       });
      //     }
      //   }
      // }

      var vsm_data = await snow_vsm_data.find({ application_key: { $in: Objapplication } });
    
      // var current_date = new Date().getMonth();
      let system_date_temp_old = await get_current_date.getCurrentDate();

      let system_date_temp = await get_current_date.addMonths(
        system_date_temp_old,
        -4
      ); //
      var current_date = system_date_temp.getMonth();

      //var current_date =12;
      var response_time = [0, 0, 0, 0, 0, 0];
      var ticket_count = [0, 0, 0, 0, 0, 0];
      var ticket_month = [];
      var avg_response_time = [];
      var monthname = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      ticket_month[0] =
        monthname[
        current_date - 5 < 0 ? 12 + current_date - 5 : current_date - 5
        ];
      ticket_month[1] =
        monthname[
        current_date - 4 < 0 ? 12 + current_date - 4 : current_date - 4
        ];
      ticket_month[2] =
        monthname[
        current_date - 3 < 0 ? 12 + current_date - 3 : current_date - 3
        ];
      ticket_month[3] =
        monthname[
        current_date - 2 < 0 ? 12 + current_date - 2 : current_date - 2
        ];
      ticket_month[4] =
        monthname[
        current_date - 1 < 0 ? 12 + current_date - 1 : current_date - 1
        ];
      ticket_month[5] = monthname[current_date];
      for await (let res of vsm_data) {
        // (june : total resolved : no of tickets)
        let irs_date = new Date(res.opened_at);
        let month = irs_date.getMonth();

        // current_date = 12;
        switch (month) {
          case current_date: {
            response_time[5] =
              response_time[5] +
              (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
            ticket_count[5] = ticket_count[5] + 1;
          
            break;
          }
          case current_date - 1 < 0
            ? 12 + current_date - 1
            : current_date - 1: {
              response_time[4] =
                response_time[4] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[4] = ticket_count[4] + 1;
           
              break;
            }
          case current_date - 2 < 0
            ? 12 + current_date - 2
            : current_date - 2: {
              response_time[3] =
                response_time[3] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[3] = ticket_count[3] + 1;
            
              break;
            }
          case current_date - 3 < 0
            ? 12 + current_date - 3
            : current_date - 3: {
              response_time[2] =
                response_time[2] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[2] = ticket_count[2] + 1;
         
              break;
            }
          case current_date - 4 < 0
            ? 12 + current_date - 4
            : current_date - 4: {
              response_time[1] =
                response_time[1] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[1] = ticket_count[1] + 1;
            
              break;
            }
          case current_date - 5 < 0
            ? 12 + current_date - 5
            : current_date - 5: {
              response_time[0] =
                response_time[0] +
                (parseInt(res.calendar_stc) > 0 ? parseInt(res.calendar_stc) : 0);
              ticket_count[0] = ticket_count[0] + 1;
          
              break;
            }
        }
      }
      for (let i = 0; i < 6; i++) {
        avg_response_time[i] =
          response_time[i] == 0 ? 0 : response_time[i] / ticket_count[i];
        avg_response_time[i] = await get_current_date.convertSecToDays(
          avg_response_time[i]
        );
      }
      let servicenow_data = {
        ticket_month: ticket_month,
        // "ticket_month": ["Jan","Feb","Mar","Apr","May","Jun"],
        ticket_count: ticket_count,
        avg_response_time: avg_response_time,
        response_time: response_time,
      };
    
      return servicenow_data;
    } catch (err) {
  
      throw err;
    }
  }
/**
* This function returns the MTTR for Particular user_mail
* @param {String} user_mail
*/
module.exports.getTotalEfficiency = async (user_mail) => {
  // let pipeline_keys = await this.getPipelinesOfApplication(application_key);
  let issue_details_list = [];
  let month_name = [], month_list = [];
  // issue_details_list = await this.getAllIssuesOfPipeline(application_key);
  let applications = await application_service.getUserApplicationsbyEmail(
    user_mail
  );
  let Objapplication = (applications && applications.hasOwnProperty('user_allocation')) ? applications.user_allocation.map(elem => elem.application_key) : []
  issue_details_list = await getTotalIssuesOfPipeline(Objapplication);
  let n = 6;
  let record_start_date_temp

  let record_start_date
  let bug_efficiency = {}, story_efficiency = {}, epic_efficiency = {}, task_efficiency = {};
  let bug_efficiency_avg = {}, story_efficiency_avg = {}, epic_efficiency_avg = {}, task_efficiency_avg = {}
  for (let i = 0; i < n; i++) {
    bug_efficiency["month-" + (i + 1)] = [];
    bug_efficiency_avg["month-" + (i + 1)] = [];
    story_efficiency["month-" + (i + 1)] = [];
    story_efficiency_avg["month-" + (i + 1)] = [];
    task_efficiency["month-" + (i + 1)] = [];
    task_efficiency_avg["month-" + (i + 1)] = [];
    epic_efficiency["month-" + (i + 1)] = [];
    epic_efficiency_avg["month-" + (i + 1)] = [];
  }
  try {

    let system_date_temp = await get_current_date.getCurrentDate();
    let system_date_temp_old = await get_current_date.getCurrentDate();

    // let system_date_temp = await get_current_date.addMonths(system_date_temp_old,-6)//


    //record_start_date_temp = await get_current_date.addMonths(system_date_temp, -6);//
    let system_date = system_date_temp.getMonth();

    record_start_date_temp = await get_current_date.addMonths(system_date_temp, -n);//

    record_start_date = system_date - (n - 1);
    if (record_start_date < 0) {
      record_start_date = 12 + record_start_date;
    }
    for (let i = 0; i < n; i++) {
      month_list.push((record_start_date + i) <= 11 ? (record_start_date + i) : (((record_start_date + i) % 11) - 1));
    }

    for await (let issue of issue_details_list) {
      // let d=new Date(issue.issue_actual_start_date);
      if (issue.issue_actual_start_date.getMonth() >= record_start_date) {
        // count = count+1

        issue.issue_actual_start_date = issue.issue_actual_start_date == null ? 0 : issue.issue_actual_start_date;
        issue.issue_actual_end_date = issue.issue_actual_end_date == null ? 0 : issue.issue_actual_end_date;
        issue.sprint_start_date = issue.sprint_start_date == null ? 0 : issue.sprint_start_date;
        if (issue.issue_type == 'BUG') {
          let x = await calculateEffectiveTime(issue.timeoriginalestimate, issue.timespent);
          let eff = await returnMonthBucket(issue.issue_actual_start_date, record_start_date, n);
          bug_efficiency[eff].push(x);
        }
        else if (issue.issue_type == 'STORY') {
          let x = await calculateEffectiveTime(issue.timeoriginalestimate, issue.timespent);
          let eff = await returnMonthBucket(issue.issue_actual_start_date, record_start_date, n);
          story_efficiency[eff].push(x);
        }
        else if (issue.issue_type == 'EPIC') {
          let x = await calculateEffectiveTime(issue.timeoriginalestimate, issue.timespent);
          let eff = await returnMonthBucket(issue.issue_actual_start_date, record_start_date, n);
          epic_efficiency[eff].push(x);
        }
        else if (issue.issue_type == 'TASK') {
          let x = await calculateEffectiveTime(issue.timeoriginalestimate, issue.timespent);
          let eff = await returnMonthBucket(issue.issue_actual_start_date, record_start_date, n);
          task_efficiency[eff].push(x);
        }
      }
      else {

      }
    }

    for (let i = 0; i < n; i++) {
      month_name.push(await getMonthName(month_list[i]));
      if (bug_efficiency["month-" + (i + 1)].length != 0) {
        bug_efficiency_avg["month-" + (i + 1)] = await calculateAverage(bug_efficiency["month-" + (i + 1)]);
      }
      else if (bug_efficiency["month-" + (i + 1)].length == 0) {
        bug_efficiency_avg["month-" + (i + 1)] = 0;
      }
      if (story_efficiency["month-" + (i + 1)].length != 0) {
        story_efficiency_avg["month-" + (i + 1)] = await calculateAverage(story_efficiency["month-" + (i + 1)]);
      }
      else if (story_efficiency["month-" + (i + 1)].length == 0) {
        story_efficiency_avg["month-" + (i + 1)] = 0;
      }
      if (epic_efficiency["month-" + (i + 1)].length != 0) {
        epic_efficiency_avg["month-" + (i + 1)] = await calculateAverage(epic_efficiency["month-" + (i + 1)]);
      }
      else if (epic_efficiency["month-" + (i + 1)].length == 0) {
        epic_efficiency_avg["month-" + (i + 1)] = 0;
      }
      if (task_efficiency["month-" + (i + 1)].length != 0) {
        task_efficiency_avg["month-" + (i + 1)] = await calculateAverage(task_efficiency["month-" + (i + 1)]);
      }
      else if (task_efficiency["month-" + (i + 1)].length == 0) {
        task_efficiency_avg["month-" + (i + 1)] = 0;
      }

    }
    let bug_eff = [], story_eff = [], epic_eff = [], task_eff = [], issue_eff_avg = [], eff_avg = 0;
    let efficiency_data = {
      "bug_efficiency": bug_efficiency_avg,
      "story_efficiency": story_efficiency_avg,
      "epic_efficiency": epic_efficiency_avg,
      "task_efficiency": task_efficiency_avg
    };
    for (let i = 0; i < n; i++) {
      bug_eff.push(efficiency_data.bug_efficiency["month-" + (i + 1)]);
      task_eff.push(efficiency_data.task_efficiency["month-" + (i + 1)]);
      epic_eff.push(efficiency_data.epic_efficiency["month-" + (i + 1)]);
      story_eff.push(efficiency_data.story_efficiency["month-" + (i + 1)]);
    }
    issue_eff_avg.push(await calculateAverage(bug_eff));
    issue_eff_avg.push(await calculateAverage(task_eff));
    issue_eff_avg.push(await calculateAverage(epic_eff));
    issue_eff_avg.push(await calculateAverage(story_eff));
    eff_avg = await calculateAverage(issue_eff_avg);
    efficiency_data = {
      "bug_efficiency": bug_eff,
      "story_efficiency": story_eff,
      "epic_efficiency": epic_eff,
      "task_efficiency": task_eff,
      "efficiency_avg": eff_avg,
      "month_name": month_name
    }
    return efficiency_data;
  } catch (error) {

    throw error;
  }
};


