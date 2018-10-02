const spark = require("sparkbots")
const command = spark.command("update")
command.level = 5
command.code = (client, message) => {
    var content = message.content.split(" ")
    if (content.length == 1) {
        return message.channel.send("Gebruik het command op deze manier: \n\n **!update <tekst>**")
    }
    var text = content.splice(1).join(" ")
    var x = null
    if (text[0] == text[0].replace(/[A-Za-z0-9]/gi, "")) {
        x = client.channels.get("495938024614395906").setName(text)
    } else {
        x = client.channels.get("495938024614395906").setName("🎮 " + text)

    }
    x.then(() => {
            message.channel.send("Update succesvol")
        })
        .catch(e => {
            console.error(e)
            message.channel.send(":x: Er is iets mis gegaan, probeer een andere zin.")
        })

}
module.exports = command
