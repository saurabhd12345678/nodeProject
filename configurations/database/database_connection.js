const mongoose = require('mongoose');
const logger = require('../logging/logger');
var dotenv = require('dotenv');
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useNewUrlParser', true);
dotenv.config();
var uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_IP}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&ssl=false`

mongoose.connect(uri, { useCreateIndex: true })
.then(() => logger.info(`Database Connected : ${process.env.MONGO_IP}:${process.env.MONGO_PORT} - ${process.env.MONGO_DB}`))
.catch(err => logger.error( err ));


