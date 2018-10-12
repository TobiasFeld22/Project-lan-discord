const spark = require("sparkbots")
const engine = spark.engine("twitch")
const request = require("request")
const ipc = require("node-ipc")
engine.code = function(client) {
    ipc.config.id = "clv-lan-server"
    ipc.config.retry = 1500
    ipc.serve(() => {
        ipc.server.on("twitch-confirm", url => {
            console.log("Twitch subscribtion: \n" + url)
        })
        ipc.server.on("twitch-online", async (data) => {
            try {
                var result = await client.r.table("twitch").get(data.id)
                if (result.nr !== 0) {
                    return
                }
            } catch (e) {
                return console.error(e)
            }
            try {
                if (data.body.type != "live") {
                    return
                }
                var embed = new spark.methods.RichEmbed()
                var username = data.body.thumbnail_url.replace("https://static-cdn.jtvnw.net/previews-ttv/live_user_", "").replace("-{width}x{height}.jpg", "")
                embed.setAuthor(username, "https://cdn.discordapp.com/attachments/237019716546199552/500091267506503692/111663_twitch_512x512.png", "https://twitch.tv/" + username)
                embed.timestamp = new Date(data.body.started_at)
                embed.setThumbnail(data.body.thumbnail_url.replace("{width}x{height}", "1920x1080"))
                embed.color = 0x6441A4
                embed.setFooter("Twitch live stream",)
                embed.setDescription(username + " is nu live! kom ook kijken!\n\n[Kijk mee](https://twitch.tv/" + username + ")\n\nTitel:\n" + data.body.title)
                var m = await client.channels.get("424238263700553728").send("", {embed})
                await client.r.table("twitch").get(data.id).update({nr: m.id})
            } catch (e) {
                return console.log(e)
            }


        })
        ipc.server.on("twitch-offline", async data => {
            try {
                data = await client.r.table("twitch").get(data.id)
                await client.r.table("twitch").get(data.id).update({nr: 0})
            } catch (e) {
                console.error(e)
            }
            try {

                var msg = await client.channels.get("424238263700553728").fetchMessage(data.nr)
                msg.delete()
            } catch (e) {
                console.error(e)
            }


        })
        ipc.server.on("socket.disconnected", (socket, id) => {
            console.log("client " + id + " has disconnected!");
        })
    })
    ipc.config.silent = true
    ipc.server.start();
    client.r.table("twitch")
        .then(i => {
            i.forEach(i => {
                subscribe(i.id)
            })
        })
        .catch(e => {
            console.error(e)
        })

}
engine.delay = 2000
module.exports = engine
var timeout = 0

function subscribe(id) {
    timeout = timeout + 2500
    if (timeout > 10000) {
        timeout = 0
    }
    setTimeout(function() {

        request.post({
            uri: "https://api.twitch.tv/helix/webhooks/hub",
            headers: {
                "Client-ID": "1mxctys6msroiraquphd50kuk19i2k",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "hub.callback": "https://api.discordspark.com/twitch/webhook",
                "hub.mode": "subscribe",
                "hub.topic": "https://api.twitch.tv/helix/streams?user_id=" + id,
                "hub.lease_seconds": 864000
            })
        }, function(error, response) {
            if (error) {
                console.error(error)
            } else if (response.statusCode == 202) {
                return console.log("subscribed to " + id)
            }
        })
    }, timeout)
}
