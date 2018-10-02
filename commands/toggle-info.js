const spark = require("sparkbots")
const command = spark.command("toggle-info")
command.level = 5
command.code = (client, message) => {
    if (client.channels.get("480156820061683713").permissionOverwrites.get("375636201648160768").allow > 0) {
        message.channel.send("Normale gebruikers kunnen de live info niet meer zien.")
        return lock(client.channels.get("480156820061683713"))

    }

    message.channel.send("Normale gebruikers kunnen de live info nu zien.")
    return unlock(client.channels.get("480156820061683713"))



}
module.exports = command

function lock(cat) {
    // @everyone
    cat.overwritePermissions("375636201648160768", {
        "VIEW_CHANNEL": false,
        "CONNECT": false,
        "SEND_MESSAGES": false

    })

    // Crew
    cat.overwritePermissions("489484578734473237", {
        "VIEW_CHANNEL": true,
        "CONNECT": false,
        "SEND_MESSAGES": false

    })

    // FA
    cat.overwritePermissions("375694610233819136", {
        "VIEW_CHANNEL": true,
        "CONNECT": false,
        "SEND_MESSAGES": false

    })
}

function unlock(cat) {
    // @everyone
    cat.overwritePermissions("375636201648160768", {
        "VIEW_CHANNEL": true,
        "CONNECT": false,
        "SEND_MESSAGES": false

    })

    // Crew
    cat.overwritePermissions("489484578734473237", {
        "VIEW_CHANNEL": true,
        "CONNECT": false,
        "SEND_MESSAGES": false

    })

    // FA
    cat.overwritePermissions("375694610233819136", {
        "VIEW_CHANNEL": true,
        "CONNECT": false,
        "SEND_MESSAGES": false

    })
}
