module.exports = (app) => {
    require('./dashboard_controller')(app);
    require('./dashboard_service');
}