const spark = require("sparkbots")
const engine = spark.engine("spotify-status")
const request = require("request");
let config = require("../../data/config.json")
const moment = require("moment");
require("moment-duration-format");
let bearer = null
let lastRefresh = null
engine.time = 20000
engine.code = async (client) => {
	config = require("../../data/config.json")
	if (!config.player) {
		return
	}
	try {

		if (!bearer) {
			bearer = await getBearer()
		}
		if (lastRefresh.getTime() + 3600000 > new Date().getTime()) {
			bearer = await getBearer()
		}
		const currentPlayer = await getPlaying(bearer)
		const message = await client.channels.get(config.player.channel).fetchMessage(config.player.message)
		if (currentPlayer === null) {
			setEmptyMessage(message)
		} else if (!currentPlayer.context) {
			setEmptyMessage(message)
		} else if (currentPlayer.context.type == "playlist" && currentPlayer.context.uri.endsWith(config.spotifyPlaylist) && currentPlayer.is_playing == true) {
			const embed = new spark.methods.RichEmbed()
			embed.setColor(0x1db954)
			embed.setAuthor(currentPlayer.item.name, "https://cdn.discordapp.com/emojis/426246972853190657.gif", currentPlayer.item.external_urls.spotify)
			var hierna = "Voeg suggesties toe met `!muziek` in <#378156957070000139>\n\n"
			const playlist = await getPlaylist(bearer)
			var hasFound = false
			var playlistItems = playlist.items
			.sort((a,b) => {
				if (new Date(a.sorted_at).getTime() > new Date(b.sorted_at).getTime()){
					return 1
				}else if (new Date(a.sorted_at).getTime() < new Date(b.sorted_at).getTime()){
					return -1
				}
				return 0
			})
			.filter(i => {
				var temp = false
				if (i.track.id === currentPlayer.item.id){
					hasFound = true
					temp = true
				}
				if (temp == false){
					return hasFound
				}
				return false
			})
			if (playlistItems.length > 0){
				hierna = hierna + "Volgende nummer(s): \n\n" + playlistItems.slice(0,5).map(i => ("> " + i.track.name + "\n:stopwatch: " + moment.duration(i.track.duration_ms, "milliseconds").format())).join("\n")
			embed.setFooter(playlistItems.length + " nummer(s) • Laatste keer geupdated")

			}else {
			embed.setFooter("Laatste keer geupdated")

			}
				embed.setDescription(":stopwatch: " + moment.duration(currentPlayer.item.duration_ms, "milliseconds").format() + "\n" + currentPlayer.item.artists.map(i => i.name).join("\n") + "\n\n" +  hierna)
			embed.setThumbnail(currentPlayer.item.album.images.filter(i => {
				return i.width == 640
			})[0].url)
			embed.setTimestamp()
			message.edit("> Voeg suggesties toe met `!muziek` in <#378156957070000139>", {
				embed
			})
		} else {
			setEmptyMessage(message)

		}
	} catch (e) {
		console.error(e)
		bearer = null
	}


}

module.exports = engine;

function setEmptyMessage(message) {
	const embed = new spark.methods.RichEmbed()
	embed.setColor(0x1db954)
	embed.setTitle("Er wordt niets afgespeeld...")
	embed.setDescription("Voeg suggesties toe met `!muziek` in <#378156957070000139>")
	embed.setFooter("Laatste keer geupdated")
	embed.setTimestamp()
	message.edit("> Voeg suggesties toe met `!muziek` in <#378156957070000139>", {
		embed
	})
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
			lastRefresh = new Date()
			resolve(body.access_token)
		})
	})
}

function getPlaying(bearer) {
	return new Promise(function (resolve, reject) {
		request.get({
			uri: "https://api.spotify.com/v1/me/player/currently-playing",
			headers: {
				"authorization": "Bearer " + bearer
			},
			json: true
		}, function (err, response, body) {
			if (err) {
				reject(err)
			}
			if (response.statusCode == 204) {
				return resolve(null)
			}
			if (response.statusCode == 200) {
				return resolve(body)
			}

		})
	})
}

function getPlaylist(bearer) {
	try {
		const tracks = []
		return new Promise(function (resolve, reject) {
			request({
				uri: "https://api.spotify.com/v1/playlists/" + config.spotifyPlaylist,
				headers: {
					"authorization": "Bearer " + bearer
				},
				json: true
			}, async function (err, response, body) {
				if (err || response.statusCode != 200) {
					console.log(response.statusCode)
					return reject()

				}
				body.tracks.items.forEach(i => {
					tracks.push(i)
				})
				if (body.tracks.next != null) {

					var next = body.tracks.next
					while (next !== null) {
						try {
							// eslint-disable-next-line no-await-in-loop
							const collected = await requestPromise(next, bearer)
							collected.items.forEach(i => {
								tracks.push(i)
							})
							if (collected.next == null){
								next = null
							}
						} catch (e) {
							console.error(e)
							next = null
						}
					}
				}
				body.items = tracks

				resolve(body)
			})
		})
	} catch (e) {
		console.error(e)
	}
}

function requestPromise(next, bearer) {
	return new Promise(function (resolve, reject) {
		request({
			uri: next,
			headers: {
				authorization: "Bearer " + bearer
			},
			json: true
		}, function(err, response, body){
			if (err || response.statusCode != 200){
				return reject(err || response.statusCode)
			}
			resolve(body)
		})
	})
}
