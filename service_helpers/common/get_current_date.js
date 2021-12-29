var moment = require('moment');
module.exports = {
    /**
 * This function returns the current system date in ISO format
 */
    getCurrentDate: async () => {
        const date_ob = new Date();
        
        return date_ob;
        
    },
    /**
 * This function converts the date from mongodb's format to ISO format
 * @param {Date} date_obj
 */
    convertMongoDateToISO: async (date_obj) => {
        const date = new Date(date_obj);
        // new_date = date.toISOString();
        return date;
    },
    /**
* This function adds the number of months to the date provided
* @param {Date} date
* @param {Integer} months
* PS: Had to create a new_date object with the same value as using the same date object changes the
* variable itself and we may get incorrect results.
*/
    addMonths: async (date, months) => {
       let  new_date = new Date(date);
        new_date.setMonth(new_date.getMonth() + months);
        return new_date;
    },

    convertSecToDays: async (secs) => {
        var x = moment.utc(secs * 1000);

        // Get the days separately
        var dayNum = x.format('D') - 1;
        return dayNum;
    }
}