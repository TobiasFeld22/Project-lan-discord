const spark = require("sparkbots")
const command = spark.command("xbox")
command.aliases = ["microsoft"]
command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.guild.id != "375636201648160768") {
        return message.channel.send("Dit command werkt alleen in de **Project:LAN** server.")
    }
    if (message.member.roles.has("378149909229993984")) {
        return message.member.removeRole("378149909229993984")
            .then(() => {
                message.channel.send("Ik heb de **Xbox** role weggehaald.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })
    }
    return message.member.addRole("378149909229993984")
        .then(() => {
            message.channel.send("Ik heb je de **Xbox** role gegeven.")
        })
        .catch(e => {
            console.error(e)
            message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
        })

}
module.exports = command
