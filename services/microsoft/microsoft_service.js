const { response } = require('express');
var unirest = require('unirest');

var ps_number = ""
var photo_data
module.exports = {

    get_users: async (name, bearer_token) => {
        let user_array
        let searchedName = "mail:" + name//= "displayName:Rahul"
        var displayName = `"${searchedName}"`
        // var displayName  = `"displayName:Rahul"`
        let access_token = bearer_token


        try {
             await unirest('GET', `https://graph.microsoft.com/v1.0/users?$count=true&$search=${displayName}&$filter=endsWith(mail,\'lntinfotech.com\')&$orderBy=displayName&$select=id,displayName,mail`)
                .headers({
                    'Authorization': 'Bearer ' + access_token,
                    'ConsistencyLevel': 'eventual'
                })
                .then((response) => {
                    user_array = response.body.value
                })
            return user_array

        }
        catch (error) {
            throw new Error(error.message);
        }
    },


    getEmployeeId: async (access_token, mailId) => {

        try {
            await unirest('GET', `https://graph.microsoft.com/v1.0/users/${mailId}/employeeId`)
                .headers({
                    'Authorization': 'Bearer ' + access_token
                }).then((response) => {
                    ps_number = response.body.value
                })
            return ps_number
        } catch (error) {
            throw new Error(error.message);
        }

    },

    getProfilePhotos : async (access_token, mailId)=>{

 await unirest('GET', `https://graph.microsoft.com/v1.0/users/${mailId}/photo/$value`)
  .headers({
    'Authorization': 'Bearer ' + access_token
  })
  .then((response)=>{
      photo_data = response.raw_body


  })

  return photo_data


    },








}




