const spark = require("sparkbots")
const perm = spark.permission("fa")
perm.setLevel(4)
perm.code = (client, message) => {
    if (!message.guild){return true}
    if (message.guild.id == "375636201648160768" && (message.member.roles.has("489484578734473237") || message.member.roles.has("375694610233819136"))) {
        return false
    }
    return true
}

module.exports = perm
