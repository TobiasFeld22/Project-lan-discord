const spark = require("sparkbots")
const engine = spark.engine("connect")
const request = require("request")
const config = require("../../data/config.json")
const roles = [
    "637764396818366464",
    "489480374678978560",
    "637763172555554818",
    "637763310321664010",
    "489483634571739166"
]
engine.code = async (client) => {
    client.r = require("rethinkdbdash")({
        db: "global",
        servers: config.servers,
        user: config.username,
        password: config.password
    })

    if (config.spotifyChannel) {

        var songs = await client.r.table("songs")
        songs = songs.filter(i => {
            return i.user != null
        })
        var resolvedMessages = await Promise.all(songs.map(i => {
            return client.channels.get(config.spotifyChannel).fetchMessage(i.message)
        }))
        resolvedMessages.filter(i => {
            return i.embeds[0].color == 15105570
        }).forEach(i => {
            try {

                i.createReactionCollector(async function (reaction, user) {
                    if (!crew(client, "375636201648160768", user)) {
                        return false
                    }
                    const embed = new spark.methods.RichEmbed()
                    var song = await client.r.table("songs").filter({message: i.id})
                    if (song.length == 0){return console.error("No songs found!")}
                    song = song[0]
                    var bearer = await getBearer()
                    var songDetails = await getSong(bearer, song.spotify)
                    switch (reaction.emoji.name) {
                        case "🗑️":
                            try {
                                await client.fetchUser(song.user)
                                await client.r.table("songs").insert({
                                    id: song.user,
                                    blocked: true
                                })
                                embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
                                embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
                                embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
                                embed.addField("GEBLOKKEERD", "door " + user.tag)

                                embed.setFooter(songDetails.spotify, "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
                                embed.setThumbnail(songDetails.album.images.filter(i => {
                                    return i.width == 640
                                })[0].url)
                                embed.setTimestamp()
                                embed.setColor(0x111111)
                                i.edit(embed)
                                i.clearReactions()
                            } catch (e) {
                                console.error(e)
                            }
                            break
                        case "✅":
                            try {
                                if (i.embeds[0].color != 15105570) {
                                    return
                                }
                                await client.fetchUser(song.user)
                                await addToPlaylist(bearer, song.spotify)
                                try {
                                    client.users.get(song.user).send(":white_check_mark: Je nummer aanvraag **" + songDetails.name + "** is goedgekeurd en staat nu in de afspeellijst.")
                                } catch (e) {
                                    console.error(e)
                                }
                                embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
                                embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
                                embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
                                embed.addField("Goedgekeurd", "door " + user.tag)
                                embed.setFooter(songDetails.id, "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
                                embed.setThumbnail(songDetails.album.images.filter(i => {
                                    return i.width == 640
                                })[0].url)
                                embed.setTimestamp()
                                embed.setColor(0x1db954)
                                i.edit(embed)
                                i.clearReactions()
                            } catch (e) {
                                console.error(e)
                            }
                            break
                        case "❌":
                            try {

                                if (i.embeds[0].color != 15105570) {
                                    return
                                }
                                await client.fetchUser(song.user)
                                try {
                                    client.users.get(song.user).send(":x: Je nummer aanvraag **" + songDetails.name + "** is afgewezen.")
                                } catch (e) {
                                    console.error(e)
                                }
                                embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
                                embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
                                embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
                                embed.addField("Afgewezen", "door " + user.tag)

                                embed.setFooter(songDetails.spotify, "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
                                embed.setThumbnail(songDetails.album.images.filter(i => {
                                    return i.width == 640
                                })[0].url)
                                embed.setTimestamp()
                                embed.setColor(0xff0000)
                                i.edit(embed)
                                i.clearReactions()
                            } catch (e) {
                                console.error(e)
                            }
                            break
                    }
                    return false;
                })
            } catch (e) {
                console.error(e)
            }

        })
    }

}

function crew(client, guild, user) {
    var member = client.guilds.get(guild).members.get(user.id)
    // eslint-disable-next-line no-underscore-dangle
    return (roles.filter(value => member._roles.indexOf(value) !== -1)).length > 0
}

function getBearer() {
    return new Promise(function (resolve, reject) {
        request.post({
            uri: "https://accounts.spotify.com/api/token",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            form: {
                refresh_token: config.spotify_userData.refresh_token,
                grant_type: "refresh_token",
                client_id: config.spotifyClientID,
                client_secret: config.spotifyClientSecret
            },
            json: true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return reject()
            }
            if (!body.access_token) {
                return reject()
            }
            resolve(body.access_token)
        })
    })
}

function getSong(bearer, songid) {
    return new Promise(function (resolve, reject) {
        request({
            uri: "https://api.spotify.com/v1/tracks/" + songid,
            headers: {
                authorization: "Bearer " + bearer
            },
            json: true
        }, function (err, res, body) {
            if (err || res.statusCode != 200) {
                return reject()
            }

            return resolve(body)
        })
    })
}

function addToPlaylist(bearer, track) {
    return new Promise(function (resolve, reject) {
        request.post({
            uri: "https://api.spotify.com/v1/playlists/" + config.spotifyPlaylist + "/tracks",
            headers: {
                "authorization": "Bearer " + bearer
            },
            qs: {
                uris: "spotify:track:" + track
            },
            json: true
        }, function (err, response) {
            if (err || response.statusCode !== 201) {
                return reject(err || response.statusCode)
            }
            resolve()
        })
    })
}

module.exports = engine
