const spark = require("sparkbots")
const command = spark.command("clvlan")
command.addAlias("clv-lan")
command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.guild.id != "375636201648160768") {
        return message.channel.send("Dit command werkt alleen in de **Project:LAN** server.")
    }
    if (message.member.roles.has("679705140382400558")) {
        return message.member.removeRole("679705140382400558")
            .then(() => {
                message.channel.send("Ik heb de **" + message.guild.roles.get("679705140382400558").name + "** role weggehaald.")
            })
            .catch(e => {
                console.error(e)
                message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
            })
    }
    return message.member.addRole("679705140382400558")
        .then(() => {
            message.channel.send("Ik heb je de " + message.guild.roles.get("679705140382400558").name + " role gegeven.\nJe wordt vanaf nu gepinged bij belangrijke informatie.")
        })
        .catch(e => {
            console.error(e)
            message.channel.send(":x: Er is een fout opgetreden.\n Probeer het later opnieuw")
        })

}
module.exports = command
