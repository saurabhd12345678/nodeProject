const log4js = require("log4js");
log4js.configure({
  appenders: {
    AppenderDs: {
      type: 'dateFile', filename: "logs/log",
      layout: { type: 'pattern', pattern: '[%d{dd-MM-yyyy hh:mm:ss}] [%p] %c - %m' },
      pattern: 'dd-MM-yyyy.log', alwaysIncludePattern: true,
    },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ["AppenderDs", "console"], level: 'info' },
    dev: { appenders: ["AppenderDs", "console"], level: 'info' },
    prod: { appenders: ["AppenderDs"], level: "info" }
  }
});
const logger = log4js.getLogger(process.env.CANVASDEVOPS_ENV);

module.exports = logger;
