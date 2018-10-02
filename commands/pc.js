const spark = require("sparkbots")
const command = spark.command("pc")
command.aliases = [
"laptop",
"pcmasterrace",
"mac",
"apple"
]
command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.guild.id != "375636201648160768") {
        return message.channel.send("Dit command werkt alleen in de **Project:LAN** server.")
    }
    if (message.member.roles.has("378149906780520449")) {
        return message.member.removeRole("378149906780520449")
            .then(() => {
                message.channel.send("Ik heb de **Pc** role weggehaald.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })
    }
        return message.member.addRole("378149906780520449")
            .then(() => {
                message.channel.send("Ik heb je de **Pc** role gegeven.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })

}
module.exports = command
