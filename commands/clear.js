const spark = require("sparkbots")
const command = spark.command("clear")
command.aliases = [
    "clean",
    "purge"
]
command.level = 5
command.code = (client, message) => {
    if (!message.guild) {
        return message.channel.send("Dit command kan alleen in een server worden gebruikt.")
    }
    if (message.content.split(" ").length == 1) {
        return message.channel.send("Gebruik het command op deze manier: `!clear 1-99`")
    }
    if (isNaN(message.content.split(" ")[1])) {
        return message.channel.send("Gebruik het command op deze manier: `!clear 1-99`")
    }
    var nr = parseInt(message.content.split(" ")[1])
    nr = Math.floor(nr)
    if (nr < 1 || nr > 99) {
        return message.channel.send("Gebruik een nummer tussen 1 en 99")
    }
    message.channel.bulkDelete(nr, true)
        .then(i => {
            message.channel.send(`${i.size} berichten verwijderd.`)
                .then(msg => {
                    setTimeout(() => {
                        msg.delete()
                    }, 5000)
                })
        })
        .catch(e => {
            console.error(e)
            return message.channel.send(":x: Er is iets mis gegaan.")
        })



}
module.exports = command
