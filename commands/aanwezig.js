const spark = require("sparkbots")
const command = spark.command("aanwezig")

command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.guild.id != "375636201648160768") {
        return message.channel.send("Dit command werkt alleen in de **Project:LAN** server.")
    }
    if (message.member.roles.has("537062265044598787")) {
        return message.member.removeRole("537062265044598787")
            .then(() => {
                message.channel.send("Ik heb de **Aanwezig GameBattle 2019** role weggehaald.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })
    }
    return message.member.addRole("537062265044598787")
        .then(() => {
            message.channel.send("Leuk dat je naar de Gamebattle 2019 komt!\n\nIk heb je de **Aanwezig GameBattle 2019** role gegeven.")
        })
        .catch(e => {
            console.error(e)
            message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
        })

}
module.exports = command
