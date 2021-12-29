var unirest = require('unirest');

module.exports.validateTools = async (qualys_tool) => {

    await unirest('POST', `${qualys_tool.tool_url}/api/2.0/fo/session/`)
        .headers({
            'X-Requested-With': 'Curl Sample',
            'Content-Type': 'application/x-www-form-urlencoded',
        })

        .send('action=login')
        .send(`username=${qualys_tool.tool_auth.auth_username}`)
        .send(`password=${qualys_tool.tool_auth.auth_password}`)
        .then((response) => {
        
            resp = response.code
        });
    return resp;

}