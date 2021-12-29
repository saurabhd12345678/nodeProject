module.exports = (app) => {
    require('./role_permission_controller')(app);
    require('./role_permission_service');
}