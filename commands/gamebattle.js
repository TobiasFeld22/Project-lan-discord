const spark = require("sparkbots")
const command = spark.command("gamebattle")
command.addAlias("gb")

command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.guild.id != "375636201648160768") {
        return message.channel.send("Dit command werkt alleen in de **Project:LAN** server.")
    }
    if (message.member.roles.has("679705218497118225")) {
        return message.member.removeRole("679705218497118225")
            .then(() => {
                message.channel.send("Ik heb de **" + message.guild.roles.get("679705218497118225").name + "** role weggehaald.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })
    }
    return message.member.addRole("679705218497118225")
        .then(() => {
            message.channel.send("Ik heb je de " + message.guild.roles.get("679705218497118225").name + " role gegeven.\nJe wordt vanaf nu gepinged bij belangrijke informatie.")
        })
        .catch(e => {
            console.error(e)
            message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
        })

}
module.exports = command
