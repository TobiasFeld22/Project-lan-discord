const spark = require("sparkbots")
const command = spark.command("auth")
command.level = 10
// level = 4
command.code = (client, message) => {
    const args = message.content.split(" ")
    args.shift()
    if (args.length == 0) {
        return message.channel.send("Voer een verificatie code in.")
    }

    if (!client.sessies.get(args[0])) {
        return message.channel.send("Voer een geldige verificatie code in.")
    }
    message.channel.send(":lock: Je code: `" + client.sessies.get(args[0]) + "`")
}
module.exports = command
