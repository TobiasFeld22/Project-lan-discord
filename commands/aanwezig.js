const spark = require("sparkbots")
const command = spark.command("aanwezig")

command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.guild.id != "375636201648160768") {
        return message.channel.send("Dit command werkt alleen in de **Project:LAN** server.")
    }
    if (message.member.roles.has("502811101365272587")) {
        return message.member.removeRole("502811101365272587")
            .then(() => {
                message.channel.send("Ik heb de **Aanwezig CLV-LAN 31** role weggehaald.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })
    }
    return message.member.addRole("502811101365272587")
        .then(() => {
            message.channel.send("Leuk dat je naar CLV-LAN 31 komt!\n\nIk heb je de **Aanwezig CLV-LAN 31** role gegeven.")
        })
        .catch(e => {
            console.error(e)
            message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
        })

}
module.exports = command
