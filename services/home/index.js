module.exports = (app) => {
    require('./home_controller')(app);
    require('./home_service');
}