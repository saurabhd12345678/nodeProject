module.exports = (app) => {
    require('./login_controller')(app);
    require('./login_service');
}