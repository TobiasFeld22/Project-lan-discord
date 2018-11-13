const spark = require("sparkbots")
const perm = spark.permission("crew")
perm.setLevel(5)
perm.code = (client, message) => {
    if (!message.guild){return true}
    if (message.guild.id == "375636201648160768" && message.user.roles.has("489484578734473237")){
        return false
    }
    return true
}
module.exports = perm
