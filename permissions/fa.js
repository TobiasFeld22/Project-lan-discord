/* eslint no-underscore-dangle: off */
const spark = require("sparkbots")
const perm = spark.permission("fa")
perm.setLevel(4)
const roles = [
    "637764396818366464",
    "489480374678978560",
    "637763172555554818",
    "637763310321664010",
    "489483634571739166"
]
perm.code = (client, message) => {
    if (!message.guild) {return true}
    if (message.guild.id == "375636201648160768" && (roles.filter(value => message.member._roles.indexOf(value) !== -1)).length > 0) {
        return false
    }
    return true
}

module.exports = perm
