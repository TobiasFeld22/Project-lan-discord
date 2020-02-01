const spark = require("sparkbots")
const command = spark.command("beoordeel")
const config = require("../data/config.json")
const request = require("request")
const moment = require("moment")
require("moment-duration-format")
command.level = 10
command.code = async (client, message) => {
	const args = message.content.split(" ")
	args.shift()
	if (args[0] == null) {
		return message.channel.send(":x: Gebruik een geldig id.")
	}
	var id = args[0].trim()
	let crewMessage = null
	var song = await client.r.table("songs").get(id)
	if (!song) {
		return message.channel.send(":x: Gebruik een geldig id.")
	}
	try {
		crewMessage = await client.channels.get(config.spotifyChannel).fetchMessage(song.message)
	} catch (e) {
		console.error(e)
		return message.channel.send(":x: Kan het beoordelingsbericht niet vinden.")
	}
	if (crewMessage.embeds[0].color != 15105570) {
		return message.channel.send("Dit nummer is al beoordeeld.")
	}
	const bearer = await getBearer()
	const songDetails = await getSong(bearer, song.spotify)
	if (args[1] == null){
		message.channel.send(" Gebruik `Ja`, `Nee` of `Blokkeer`")
	}
	switch (args[1].trim().toLowerCase()) {
		case "ja":
			approve(crewMessage, song, songDetails)

			break
		case "nee":
			deny(crewMessage, song, songDetails)
			break
		case "blokkeer":
			block(crewMessage, song, songDetails)

			break
		default:
			message.channel.send("Verkeerde optie gebruikt. Gebruik `Ja`, `Nee` of `Blokkeer`")
	}
	const embed = new spark.methods.RichEmbed()

	async function block() {
		await client.fetchUser(song.user)
		await client.r.table("songs").insert({
			id: song.user,
			blocked: true
		})
		embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
		embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
		embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
		embed.addField("GEBLOKKEERD", "door " + message.author.tag)

		embed.setFooter("⏱️ " + moment.duration(songDetails.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
		embed.setThumbnail(songDetails.album.images.filter(i => {
			return i.width == 640
		})[0].url)
		embed.setTimestamp()
		embed.setColor(0x111111)
		crewMessage.edit(embed)
		crewMessage.clearReactions()
		message.channel.send("<@" + song.user + "> is geblokkeerd van de muziek functionaliteit.")
	}
	async function approve() {
		if (crewMessage.embeds[0].color != 15105570) {
			return
		}

		await client.fetchUser(song.user)
		await addToPlaylist(bearer, song.spotify)
		client.users.get(song.user).send(":white_check_mark: Je nummer aanvraag **" + songDetails.name + "** is goedgekeurd en staat nu in de afspeellijst.")

		embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
		embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
		embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
		embed.addField("Goedgekeurd", "door " + message.author.tag)
		embed.setFooter("⏱️ " + moment.duration(songDetails.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
		embed.setThumbnail(songDetails.album.images.filter(i => {
			return i.width == 640
		})[0].url)
		embed.setTimestamp()
		embed.setColor(0x1db954)
		crewMessage.edit(embed)
		crewMessage.clearReactions()
		message.channel.send(songDetails.name + " is toegevoegd aan de afspeellijst.")

	}
	async function deny(crewMessage, song, songDetails) {
		await client.fetchUser(song.user)
		client.users.get(song.user).send(":x: Je nummer aanvraag **" + songDetails.name + "** is afgewezen.")
		embed.setAuthor(songDetails.name, null, songDetails.external_urls.spotify)
		embed.setDescription("Artiest(en):\n\n- " + songDetails.artists.map(i => i.name).join("\n- "))
		embed.addField("Aangevraagd door", client.users.get(song.user).tag + " - " + song.user)
		embed.addField("Afgewezen", "door " + message.author.tag)

		embed.setFooter("⏱️ " + moment.duration(songDetails.duration_ms, "milliseconds").format(), "https://cdn.discordapp.com/attachments/347923404357107712/670770181085331466/Spotify_Icon_RGB_Green.png?size=128")
		embed.setThumbnail(songDetails.album.images.filter(i => {
			return i.width == 640
		})[0].url)
		embed.setTimestamp()
		embed.setColor(0xff0000)
		crewMessage.edit(embed)
		crewMessage.clearReactions()
		message.channel.send(songDetails.name + " is afgewezen.")

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
