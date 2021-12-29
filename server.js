var express = require("express");
var http = require("http");
var https = require("https");
const fs = require("fs");
var privateKey = fs.readFileSync("./certificates/infinitydevops.key");
var certificate = fs.readFileSync("./certificates/infinitydevops.crt");
var credentials = { key: privateKey, cert: certificate };
var app = express();
var dotenv = require("dotenv");
dotenv.config();
var bodyParser = require("body-parser");
var morgan = require("morgan");
const logger = require('./configurations/logging/logger');
var methodOverride = require("method-override");
const cors = require("cors");

var path = require("path");

var xssFilter = require("x-xss-protection");
app.use(xssFilter());

var helmet = require("helmet");
app.use(helmet());

app.use(helmet.frameguard({ action: "deny" }));

// https.createServer({
//     secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
//     pfx: fs.readFileSync(path.resolve(pathToCert))
// }, app).listen(443)

// app.use(csrf())

// app.use(function(req,res,next){
//     res.cookie('XSRF-TOKEN',req.csrfToken())
//     res.locals.csrfToken = req.csrfToken()
//     next()
// })

require("./configurations/database/database_connection");


app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'"
  );
  next();
});
app.disable("x-powered-by");
//Handling cors
app.use(cors());

// parse application/json // get all data/stuff of the body (POST) parameters
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// override with X-HTTP-Method-Override header.Simulate DELETE/PUT
app.use(methodOverride("X-HTTP-Method-Override"));

//HTTP-logging library used along with log4js
app.use(morgan("combined", { stream: {    write: function(str) { logger.debug(str); }} }));
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

require("./services/login")(app);
require("./services/home")(app);
require("./services/dashboard")(app);
require("./services/application")(app);
require("./services/maturity")(app);
require("./services/settings")(app);
require("./services/application_users")(app);
require("./services/pipeline/template_screen")(app);
require("./services/pipeline/onboarding_create")(app);
require("./services/pipeline/onboarding_sync")(app);
require("./services/pipeline/onboarding_existing")(app);
require("./services/kedb")(app);
require("./services/pipeline/summary")(app);
require("./services/pipeline/trigger_job")(app);
require("./services/pipeline/webhooks")(app);
require("./services/pipeline/dashboard")(app);
require("./services/workflow")(app);
require("./services/microsoft")(app);
require("./services/servicenow")(app);
require("./services/value_stream")(app);
require("./services/codeDX_service")(app);
//require("./service_helpers/amazons3")(app);
//require("./services/role")(app);
require("./services/role_permission_management")(app);



// require("./services/role")(app);
require("./services/activity_log")(app);
require("./services/servicenow")(app);
require("./services/application_configuration")(app);
require("./services/azure_devops_services")(app);
require("./services/poller")(app);
require("./services/utility")(app);
require("./services/sla_config")(app);
//404 Error handling
app.use((req, res) => {
  logger.error(
    "404 - NOT FOUND -" + `${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  res.status(404).send("Sorry can't find that!");
});

//500 Error handling
app.use((err, req, res) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );
  res.status(500).send("Something broke!");
});

const { constants } = require('crypto')
//New Version
// Use secure HTTPS protocol
// Load keys for establishing secure HTTPS connection
var httpsOptions = {
  key: fs.readFileSync(
    path.resolve(__dirname, "./certificates/infinitydevops.key")
  ),
  // setting Keys and Certificates

  cert: fs.readFileSync(
    path.resolve(__dirname, "./certificates/infinitydevops.crt")
  ),
};
https
  .createServer(httpsOptions, app)
  .listen(process.env.BACKEND_PORT, function () {
   
  });
// or HTTP2 const http2 = require('http2'); const fs = require('fs');  const options = {   key: fs.readFileSync('server-key.pem'),   cert: fs.readFileSync('server-cert.pem') };  // Create a secure HTTP/2 server const server = http2.createSecureServer(options); server.listen(config.port, function() {   console.log("Express http server listening on port " + config.port);   });

//OLD
//change 'httpsServer' to 'httpServer' in DEV
// var server = httpsServer.listen(process.env.BACKEND_PORT, () => {
//     logger.info("Server started on port " + process.env.BACKEND_PORT);
// });
//server.timeout = 900000;
