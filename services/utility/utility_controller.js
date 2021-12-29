var token_method = require("../../service_helpers/verify_token");
var utility_service = require('./utility_service');
var activity_logger = require("../../service_helpers/common/activity_logger");
const { start } = require("xstate/lib/actions");
const sprint = require("../../models/sprint");
// var bb_push = require('../../service_helpers/bitbucket_push');
module.exports = (app) => {
    app.put('/api/utility/seed_app_data',
        // token_method.verifyToken,
        async (req, res) => {
            try {
               
                var application_key = req.body.application_key;
                var sprintCount_value = req.body.sprintCount_value;
                var sprint_duration = req.body.sprint_duration;
                var pipeline_name = req.body.pipeline_name;
                
                if (!application_key) {
                    res.status(400).send({ "data": 'Application Key not found' });
                    return;
                }

                var response = await utility_service.seed_app_data(application_key, pipeline_name);
                // var response = await utility_service.seed_app_data2(application_key);
                res.status(200).send({ "data": response });

            } catch (error) {
                res.status(500).send({ "data": error.message });
            }
        });
        // infinity testing end point !
                                    //!
                                    
    // app.put('/api/utility/seed_app_data2',
    //     // token_method.verifyToken,
    //     async (req, res) => {
    //         try {
    //             console.log("appn_key->",req.body.application_key);
    //             var application_key = req.body.application_key;
    //             // var sprintCount_value = req.body.sprintCount_value;
    //             // var sprint_duration = req.body.sprint_duration;
    //             // var pipeline_name = req.body.pipeline_name;
    //             // console.log("application_key: ",application_key);
    //             // if (!application_key) {
    //             //     res.status(400).send({ "data": 'Application Key not found' });
    //             //     return;
    //             // }

    //             var response = await utility_service.seed_app_data2(application_key);
    //             res.status(200).send({ "data": response });

    //         } catch (error) {
    //             res.status(500).send({ "data": error.message });
    //         }
    //     })


}
