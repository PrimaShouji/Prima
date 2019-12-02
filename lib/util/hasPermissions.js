module.exports = (permissionLevel, member) => {
    const roleTiers = [
        "Administrator", "Admin",
        "Moderator", "Mod",
        "Chat Moderator", "Chat Mod",
        "Member",
    ];

    if (permissionLevel === "Admin") {
        if (!member.roles.some(roles => roleTiers.slice(0, 2).includes(roles.name))) return true;
    } else if (permissionLevel === "Moderator") {
        if (!member.roles.some(roles => roleTiers.slice(0, 4).includes(roles.name))) return true;
    } else if (permissionLevel === "Chat Moderator") {
        if (!member.roles.some(roles => roleTiers.slice(0, 6).includes(roles.name))) return true;
    } else if (permissionLevel === "Member") {
        if (!member.roles.some(roles => roleTiers.slice(0, 7).includes(roles.name))) return true;
    } else if (member.id === "128581209109430272") {
        return true;
    }

    return false;
};
