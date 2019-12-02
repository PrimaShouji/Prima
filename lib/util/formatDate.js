const { daysOfWeek, daysPerMonth, months } = require("./common");

module.exports = (dayOfRun, day) => {
    const dayOfWeekOfRun = daysOfWeek.indexOf(day);
    if (dayOfWeekOfRun > dayOfRun[1]) {
        const diff = dayOfWeekOfRun - dayOfRun[1];
        dayOfRun[2] += diff;
    } else if (dayOfWeekOfRun < dayOfRun[1]) {
        const diff = 7 - dayOfRun[1] + dayOfWeekOfRun;
        dayOfRun[2] += diff;
    }
    if (dayOfRun[2] > daysPerMonth[dayOfRun[0]]) {
        dayOfRun[2] -= daysPerMonth[dayOfRun[0]];
        dayOfRun[0]++;
    }
    if (dayOfRun[0] > 11) {
        dayOfRun[0] -= 12;
    }
    dayOfRun[1] = dayOfWeekOfRun;
    return [months[dayOfRun[0]], daysOfWeek[dayOfRun[1]], dayOfRun[2]];
};
