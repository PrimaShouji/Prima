module.exports = () => {
    let year = (new Date()).getFullYear();

    if (year % 100 === 0 && year % 400 !== 0) {
        return 28;
    }

    if (year % 4 === 0) {
        return 29;
    }

    return 28;
};
