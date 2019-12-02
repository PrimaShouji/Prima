const getDaysInFeb = require("./getDaysInFeb");

module.exports = {
    months: ["Janurary", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    daysPerMonth: [31, getDaysInFeb(), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    daysOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
