const spark = require("sparkbots")
const command = spark.command("say")
command.aliases = [
    "zeg",
    "spreek",
    "praat"
]
command.code = (client, message) => {
    var content = message.content.split(" ")
    var text = ""
    var {channel} = message
    if (content.length == 1) {
        return message.channel.send("Gebruik het command op deze manier: \n\n **!zeg (#channel) <tekst>**")
    } else if (content[1].match(message.mentions.CHANNELS_PATTERN) == null) {
        text = content.splice(1).join(" ")
    } else if (content.length == 2) {
        text = content.splice(1).join(" ")
    } else {

        channel = message.mentions.channels.first()
        text = content.splice(2).join(" ")
    }
    channel.send(text)
}
module.exports = command
