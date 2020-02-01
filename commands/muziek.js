const spark = require("sparkbots")
const command = spark.command("muziek")
const config = require("../data/config.json")
const request = require("request")
const moment = require("moment");
const shortid = require("shortid");
require("moment-duration-format");
const roles = [
    "637764396818366464",
    "489480374678978560",
    "637763172555554818",
    "637763310321664010",
    "489483634571739166"
]
command.code = async (client, message) => {
	if (!config.spotifyClientID) {
		return
	}
	if (config.spotify_userData == null || config.spotifyPlaylist == null || config.spotifyChannel == null) {
		console.log("[Spotify] No playlist setup | No user setup")
		return
	}
	if (await client.r.table("songs").get(message.author.id) != null) {
		return
	}
	const args = message.content.split(" ")
	args.shift()
	if (args.length == 0) {
		return message.channel.send("Gebruik dit command op deze manier:\n\n`!muziek spotify:track:4uLU6hMCjMI75M1A2tKUQC`\n\n`!muziek https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=d7HNneBxRLGM4onebtk2NA`\n\nAlleen Spotify links worden ondersteund.")
	}
	const regex = new RegExp(/^(https:\/\/open.spotify.com\/track\/|spotify:track:)([a-zA-Z0-9]+)(.*)$/i)
	regex.lastIndex = 0
	if (regex.exec(args[0]) == null || regex.exec(args[0])[2] == null) {
		return message.channel.send(":x: Dit is geen geldige Spotify url!\n\nGebruik dit command op deze manier:\n\n`!muziek spotify:track:4uLU6hMCjMI75M1A2tKUQC`\n\n`!muziek https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=d7HNneBxRLGM4onebtk2NA`\n\nAlleen Spotify links worden ondersteund.")
	}
	const songid = regex.exec(args[0])[2]
	try {
		var embed = new spark.methods.RichEmbed()
		embed.setAuthor("Nummer zoeken", "https://cdn.discordapp.com/emojis/522770438900940810.gif")
		embed.setFooter(songid, "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
		embed.setTimestamp()
		embed.setColor(0x1db954)
		const sentMessage = await message.channel.send(embed)

		const bearer = await new Promise(function (resolve, reject) {
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

		const song = await new Promise(function (resolve) {
			request({
				uri: "https://api.spotify.com/v1/tracks/" + songid,
				headers: {
					authorization: "Bearer " + bearer
				},
				json: true
			}, function (err, res, body) {
				if (err || res.statusCode != 200) {
					return sentMessage.edit(":x: Dit is geen geldige Spotify url!\n\nGebruik dit command op deze manier:\n\n`!muziek spotify:track:4uLU6hMCjMI75M1A2tKUQC`\n\n`!muziek https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=d7HNneBxRLGM4onebtk2NA`\n\nAlleen Spotify links worden ondersteund.", {
						embed: {}
					})
				}

				return resolve(body)
			})

		})
		var songCheck = await client.r.table("songs").filter({spotify: song.id})
		songCheck = songCheck.filter(i => {
			return moment(i.date).isAfter(moment().subtract(1, "hours"));
		}).sort((a, b) => {
			if (a.date.getTime() > b.date.getTime()){
				return 1
			}else if (a.date.getTime() < b.date.getTime()){
				return -1
			}
			return 0
		})


		if (songCheck.length > 0) {
			var over = 60 - moment().diff(songCheck[0].date, "minutes")
			return sentMessage.edit(":x: Dit nummer kan niet worden toegevoegd. Mogelijke redenen: \n- Het nummer staat al in de afspeellijst\n- Het nummer staat in de reviewlijst\n- Het nummer is net al afgespeeld\n- Het nummer is net afgewezen.\n\nDit nummer kan weer worden toegevoegd in: ± " + over + " minuten.", {
				embed: {}
			})
		}

		embed = new spark.methods.RichEmbed()
		embed.setTitle(song.name)
		embed.setDescription("Toegevoegd aan de wachtrij, je suggestie wordt eerst bekeken door een crewlid.")
		embed.setFooter("⏱️ " + moment.duration(song.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
		embed.setThumbnail(song.album.images.filter(i => {
			return i.width == 640
		})[0].url)
		embed.setTimestamp()
		embed.setColor(0x1db954)
		sentMessage.edit("", {
			embed
		})
		message.author.send(embed)
		const id = shortid.generate()

		embed = new spark.methods.RichEmbed()
		embed.setAuthor(song.name, null, song.external_urls.spotify)
		embed.setDescription("Artiest(en):\n\n- " + song.artists.map(i => i.name).join("\n- "))
		embed.addField("Aangevraagd door", message.author.tag + " - " + message.author.id)
		embed.addField("Acties:", "✅ - Keur goed\n❌ - Keur af\n🗑️ - Blokkeer deze gebruiker van de muziek functies")
		embed.addField("Alternatief", "`!beoordeel " + id + " ja/nee/blokkeer`")
		embed.setFooter("⏱️ " + moment.duration(song.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
		embed.setThumbnail(song.album.images.filter(i => {
			return i.width == 640
		})[0].url)
		embed.setTimestamp()
		embed.setColor(0xe67e22)

		const crewMessage = await client.channels.get(config.spotifyChannel).send(embed)
		crewMessage.react("✅")
		crewMessage.react("❌")
		crewMessage.react("🗑️")
		await client.r.table("songs").insert({
			spotify: song.id,
			id,
			user: message.author.id,
			date: client.r.now(),
			message: crewMessage.id
		})
		try {
			crewMessage.createReactionCollector(async function (reaction, user) {
				if (!crew(client, "375636201648160768", user)) {
					return false
				}
				const embed = new spark.methods.RichEmbed()
				var song = await client.r.table("songs").get(id)
				var bearer = await getBearer()
				var songDetails = await getSong(bearer, song.spotify)
				switch (reaction.emoji.name) {
					case "🗑️":
						await client.fetchUser(song.user)
						await client.r.table("songs").insert({
							id: message.author.user,
							blocked: true
						})
						embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
						embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
						embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
						embed.addField("GEBLOKKEERD", "door " + user.tag)

						embed.setFooter("⏱️ " + moment.duration(songDetails.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
						embed.setThumbnail(songDetails.album.images.filter(i => {
							return i.width == 640
						})[0].url)
						embed.setTimestamp()
						embed.setColor(0x111111)
						crewMessage.edit(embed)
						crewMessage.clearReactions()
						break
					case "✅":
						if (crewMessage.embeds[0].color != 15105570) {
							return
						}

						await client.fetchUser(song.user)
						await addToPlaylist(bearer, song.spotify)
						client.users.get(song.user).send(":white_check_mark: Je nummer aanvraag **" + songDetails.name + "** is goedgekeurd en staat nu in de afspeellijst.")

						embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
						embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
						embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
						embed.addField("Goedgekeurd", "door " + user.tag)
						embed.setFooter("⏱️ " + moment.duration(songDetails.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
						embed.setThumbnail(songDetails.album.images.filter(i => {
							return i.width == 640
						})[0].url)
						embed.setTimestamp()
						embed.setColor(0x1db954)
						crewMessage.edit(embed)
						crewMessage.clearReactions()
						break
					case "❌":
						if (crewMessage.embeds[0].color != 15105570) {
							return
						}
						await client.fetchUser(song.user)
						client.users.get(song.user).send(":x: Je nummer aanvraag **" + songDetails.name + "** is afgewezen.")
						embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
						embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
						embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
						embed.addField("Afgewezen", "door " + user.tag)

						embed.setFooter("⏱️ " + moment.duration(songDetails.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
						embed.setThumbnail(songDetails.album.images.filter(i => {
							return i.width == 640
						})[0].url)
						embed.setTimestamp()
						embed.setColor(0xff0000)
						crewMessage.edit(embed)
						crewMessage.clearReactions()
						break
				}
				return false;
			})
		} catch (e) {
			console.error(e)
		}

	} catch (e) {
		console.error(e)
		return message.channel.send(":x: Er ging iets fout bij het opzoeken van jouw liedje, probeer het later opnieuw.", {
			embed: {}
		})
	}

}

module.exports = command

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

function crew(client, guild, user) {
	var member = client.guilds.get(guild).members.get(user.id)
	// eslint-disable-next-line no-underscore-dangle
	return (roles.filter(value => member._roles.indexOf(value) !== -1)).length > 0
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
