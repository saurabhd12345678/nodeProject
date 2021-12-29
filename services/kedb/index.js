module.exports = (app) => {
    require('./kedb_controller')(app);
    require('./kedb_service');
    require('../../service_helpers/amazons3');
}