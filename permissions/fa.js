const spark = require("sparkbots")
const perm = spark.permission("fa")
perm.setLevel(4)
perm.code = (client) => {

    if (client.guilds.get("375636201648160768").roles.has("489484578734473237") || client.guilds.get("375636201648160768").roles.has(375694610233819136)) {
        return false
    }
    return true
}
module.exports = perm
