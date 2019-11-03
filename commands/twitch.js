var Spark = require("sparkbots")
var command = Spark.command("twitch")
var request = require("request")
command.level = 10
command.code = function(client, message) {
    if (message.content.split(" ").length <= 1) {
        return message.channel.send("Gebruik het command op deze manier: \n`!twitch <twitch-gebruikersnaam-hier>`")
    }
    var name = message.content.split(" ").splice(1).join(" ")
    message.channel.send("Profiel aan het zoeken op Twitch").then(msg => {

            request.get({
                uri: "https://api.twitch.tv/helix/users?login=" + name,
                headers: {"Client-ID": "1mxctys6msroiraquphd50kuk19i2k"},
                json: true
            }, function(error, response, data) {
                if (error) {
                    console.error(error)
                    return msg.edit(":x: Er is iets mis gegaan, probeer het later opnieuw")
                } else if (!response.statusCode.toString().startsWith("2")) {
                    return msg.edit(":x: Er is iets mis gegaan, probeer het later opnieuw")
                } else if (data.length == 0) {
                    msg.edit(":x: Niemand met deze gebruikersnaam gevonden")
                } else {
                    var user = data.data[0]
                    var embed = new Spark.methods.RichEmbed()
                    embed.setAuthor(user.login == user.display_name ? user.login : user.login + " / " + user.display_name, user.profile_image_url, "https://twitch.tv/" + user.login)
                    embed.setDescription("Totaal aantal keer bekeken: " + user.view_count)
                    embed.setThumbnail(user.profile_image_url)
                    embed.setFooter(user.id)
                    msg.edit("Is dit het profiel dat je zoekt? (:stopwatch: 30s)", {embed})
                    var triggered = false
                    msg.react("✅")
                    msg.react("❌")


                    const collector = msg.createReactionCollector((r, u) => {
                        return filter(message, r, u)
                    }, {time: 30000});
                    collector.on("collect", r => {
                        triggered = true
                        msg.clearReactions()

                        if (r.emoji.name === "✅") {
                            msg.edit("Abonneren op twitch notificaties...", {embed: {}})
                            request.post({
                                uri: "https://api.twitch.tv/helix/webhooks/hub",
                                headers: {
                                    "Client-ID": "1mxctys6msroiraquphd50kuk19i2k",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "hub.callback": "https://api.discordspark.com/twitch/webhook",
                                    "hub.mode": "subscribe",
                                    "hub.topic": "https://api.twitch.tv/helix/streams?user_id=" + user.id,
                                    "hub.lease_seconds": 864000
                                })
                            }, function(error, response) {
                                if (error) {
                                    console.error(error)
                                    return msg.edit(":x: Er is iets mis gegaan. Probeer het later opnieuw.")
                                } else if (response.statusCode == 202) {
                                    client.r.table("twitch").insert({
                                        id: user.id,
                                        nr: 0
                                    }, {conflict: "replace"})

                                    return msg.edit(":white_check_mark: notificaties zullen binnen ongeveer 3 - 5 minuten verschijnen nadat **" + user.login + "** online is gegaan.")
                                }
                            })

                        } else {
                            return msg.edit("Geannuleerd", {embed: {}})
                        }
                    })
                    collector.on("end", () => {
                        if (triggered == false) {
                            msg.clearReactions()
                            return msg.edit(":stopwatch: 30 seconden zijn verlopen", {embed: {}})
                        }
                    })
                }
            })
        })
        .catch(e => {
            console.error(e)
            return message.channel.send(":x: Er is iets mis gegaan, probeer het later opnieuw")
        })

}

function filter(message, reaction, user) {
    return ((reaction.emoji.name === "✅" || reaction.emoji.name === "❌") && user.id === message.author.id)
}
module.exports = command
