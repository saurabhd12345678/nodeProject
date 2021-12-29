
module.exports = {

    /**
 * This function generates random key of length 12 where first half is on application or pipeline name based and second half is random. If you want to increase length of key change "second_half_length" variable to set the length.
 * @param {String} name
 */
    generatePipelineKey() {
        var text = "PIP";
        var length = 7;
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (var i = 0; i < length; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
       
        return text;
      }

}