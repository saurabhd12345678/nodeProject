var activity_log = require('../../models/activity_log');
var activity_logger = require('../../service_helpers/common/activity_logger')


module.exports = {


    getActivityLogs: async (logs_request_data) => {

        let application_key = logs_request_data.body.application_key;
        let page_requested = logs_request_data.body.page_requested;
        let sort_on = (logs_request_data.body.active == "Default") ? "createdAt" : logs_request_data.body.active;
        let sort_direction = (logs_request_data.body.direction == "desc") ? Number(-1) : Number(1);
        let start_count = (7 * page_requested)
        let filter_pipline_name = [];
        let filter_user_email = [];
        let filter_duration = logs_request_data.body.duration;
        var filter_date = (new Date().getTime() - 1000 * 60 * 60 * filter_duration);

        try {


            let filter_all_data = await activity_log.aggregate([
                {
                    $match: { "application_key": application_key }
                },
                { $sort: { "initiate_by": -1 } },
                {
                    $group:
                    {
                        _id: 0,
                        pipeline_name: { $addToSet: '$pipeline_name' },
                        initiate_by: { $addToSet: '$initiate_by' },
                        "oldest_date": { $first: "$$ROOT" },

                    }
                }
            ]);
            if (filter_all_data && filter_all_data.length > 0) {


                filter_pipline_name = logs_request_data.body.pipeline_name.length < 1 ? filter_all_data[0].pipeline_name : logs_request_data.body.pipeline_name;

                filter_user_email = logs_request_data.body.user_email.length < 1 ? filter_all_data[0].initiate_by : logs_request_data.body.user_email;


                if (filter_duration == 0) {
                    filter_date = (new Date(filter_all_data[0].oldest_date.createdAt).getTime() - 1000 * 60 * 60)
                }


                let logs = await activity_log.find(
                    {
                        application_key: application_key,
                        pipeline_name:filter_pipline_name,
                        initiate_by:filter_user_email,
                        "createdAt": { 
                         
                            $gte: filter_date
                        }
                    }).sort( { [sort_on]: sort_direction } )//skip(start_count).limit(10).



                var log_data = {
                    "total_count": logs.length,
                    "logs": logs.slice(start_count, (start_count + 7)),
                    "pipeline_name": filter_all_data[0].pipeline_name,
                    "user_email": filter_all_data[0].initiate_by

                }

                return log_data;
            }
            else {
                return {
                    "total_count": 0,
                    "logs": [],
                    "pipeline_name": "",
                    "user_email": ""
                }
            }
        } catch (err) {
            throw err;
        }
    }
    ,
    getActivityLogs1: async (data) => {

        try {

            await activity_logger.logActivity(data.application_key, data.pipeline_key, data.msg, data.token);

            return "addded";
        } catch (err) {
            throw err;
        }
    }

}