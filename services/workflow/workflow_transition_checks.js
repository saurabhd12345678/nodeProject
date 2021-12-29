var logger = require('../..//configurations/logging/logger');
const Pipeline = require('../../models/pipeline');
const nodemailer = require("nodemailer");
var fs = require('fs');
var XState = require('xstate');

module.exports = {

    async pipelineCreated(pipeline_key, machine_id, state) {
        try {
            let pipeline = await Pipeline.findOne({ pipeline_key: pipeline_key }).lean().count();
            return pipeline == 1 ? true : false;
        } catch (error) {
            logger.error(error);
            return false;
        }
    }

}