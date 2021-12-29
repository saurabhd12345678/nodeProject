
module.exports = {

    /**
 * This function generates random key of length 12 where first half is on application or pipeline name based and second half is random. If you want to increase length of key change "second_half_length" variable to set the length.
 * @param {String} name
 */
    async generateKey(name) {
        
        let name_length = name.replace(/\s/g, '').length;
        let first_half_key = name.replace(/\s/g, '').slice(0, name_length > 6 ? 6 : name_length) + Math.random().toString(36).slice(2, name_length > 6 ? 2 : 6 - name_length);
        let random_str = Math.random().toString(36);
        let second_half_length = 6;
        let str_int = Math.floor((random_str.length - 2) / second_half_length);
        let range = Math.floor((Math.random() * str_int) + 2);
        var key = first_half_key.toUpperCase() + random_str.slice(range, range + second_half_length);

        return key;
    },

    generateMaturityKey(name) {
        
        let name_length = name.replace(/\s/g, '').length;
        let first_half_key = name.replace(/\s/g, '').slice(0, name_length > 2 ? 2 : name_length) + Math.random().toString(36).slice(2, name_length > 2 ? 2 : 2 - name_length);
        let random_str = Math.random().toString(36);
        let second_half_length = 2;
        let str_int = Math.floor((random_str.length - 2) / second_half_length);
        let range = Math.floor((Math.random() * str_int) + 2);
        var key = first_half_key.toUpperCase() + random_str.slice(range, range + second_half_length);

        return key;
    }

}