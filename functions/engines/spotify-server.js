/* eslint-disable no-await-in-loop */
const spark = require("sparkbots")
const engine = spark.engine("spotify-server")
const express = require("express")
const app = express()
const uuid = require("uuid/v4")
const crypto = require("crypto")
const config = require("../../data/config.json")
const fs = require("fs")
const path = require("path")
const process = require("process")
const request = require("request")

/* eslint-disable-next-line */
const inithtml = fs.readFileSync(path.join(process.cwd(), "/data/spotify.html"), "utf8")
/* eslint-disable-next-line */
const playlisthtml = fs.readFileSync(path.join(process.cwd(), "/data/spotify-select.html"), "utf8")
engine.code = (client) => {
	client.sessies = new Map()
	const confirmedSessies = new Map()
	app.get("/spotify-auth/", function (req, res) {
		const id = uuid()
		client.sessies.set(id, crypto.randomBytes(20).toString("hex"))
		res.send(inithtml.replace(/\[ID\]/g, id))

	})
	app.get("/spotify-auth/c/:id/:code", function (req, res) {
		console.log(req.params.id, req.params.code)
		if (client.sessies.get(req.params.id) == req.params.code) {
			confirmedSessies.set(req.params.id, true)
			client.sessies.delete(req.params.id)
			return res.redirect("https://accounts.spotify.com/authorize?client_id=" + config.spotifyClientID + "&response_type=code&redirect_uri=" + config.spotifyCallBackURL + "&scope=playlist-modify-private%20playlist-read-private%20playlist-modify-public%20user-read-currently-playing&state=" + req.params.id)
		}
		return res.sendStatus(401)
	})

	app.get("/spotify-auth/callback/", async function (req, res) {
		console.log(confirmedSessies)
		if (!req.query.code) {
			return res.sendStatus(400)
		}
		if (!req.query.state || !confirmedSessies.has(req.query.state)) {
			return res.sendStatus(401)
		}

		try {
			const spotifyAuth = await new Promise(function (resolve, reject) {
				request.post({
					uri: "https://accounts.spotify.com/api/token",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					form: {
						code: req.query.code,
						redirect_uri: config.spotifyCallBackURL,
						grant_type: "authorization_code",
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
					resolve(body)
				})
			})

			config.spotify_userData = {
				access_token: spotifyAuth.access_token,
				refresh_token: spotifyAuth.refresh_token
			}
			await new Promise(function (resolve, reject) {
				fs.writeFile(path.join(process.cwd(), "/data/config.json"), JSON.stringify(config), function (err) {
					if (err) {
						return reject()
					}
					resolve()
				})
			})

		} catch (e) {
			res.sendStatus(500)
			console.error(e)
		}
		res.redirect("/spotify-auth/select/" + req.query.state)

	})
	app.get("/spotify-auth/select/:state", async function (req, res) {
		if (!req.params.state || !confirmedSessies.has(req.params.state)) {
			return res.sendStatus(401)
		}
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
		const userId = await new Promise(function (resolve, reject) {
			request({
				uri: "https://api.spotify.com/v1/me/",
				headers: {
					"authorization": "Bearer " + bearer
				},
				json: true
			}, function (err, response, body) {
				if (err || response.statusCode != 200) {
					return reject()
				}
				resolve(body.id)
			})
		})
		const playlists = await getPlaylists(userId, bearer)
		return res.send(playlisthtml.replace("[OPTIONS]", playlists.map(i => (`<option value="${i.id}">${i.name}</option>`)).join("\n")))
	})
	app.get("/spotify-auth/select/c/:state/:id", async function (req, res) {
		if (!req.params.state || !confirmedSessies.has(req.params.state)) {
			return res.sendStatus(401)
		}
		if (req.params.id == null) {
			return res.sendStatus(400)
		}

		try {
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
						return reject(err || response.statusCode)
					}
					if (!body.access_token) {
						return reject("No access token")
					}
					resolve(body.access_token)
				})
			})
			const playlistName = await new Promise(function (resolve, reject) {
				request({
					uri: "https://api.spotify.com/v1/playlists/" + req.params.id,
					headers: {
						"authorization": "Bearer " + bearer
					},
					json: true
				}, function (err, response) {
					if (err || response.statusCode !== 200) {
						return reject(err || response.statusCode)
					}
					resolve(response.body.name)
				})
			})
			await new Promise(function (resolve, reject) {
				config.spotifyPlaylist = req.params.id
				fs.writeFile(path.join(process.cwd(), "/data/config.json"), JSON.stringify(config), function (err) {
					if (err) {
						return reject(err)
					}
					resolve()
				})
			})
			return res.send("Selected playlist " + playlistName + " (" + req.params.id + ")")
		} catch (e) {
			console.error(e)
			return res.sendStatus(500)
		}
	})

	app.get("/spotify-auth/select/c/new/:state/:name", async function (req, res) {
		if (!req.params.state || !confirmedSessies.has(req.params.state)) {
			return res.sendStatus(401)
		}
		if (req.params.name == null) {
			return res.sendStatus(400)
		}

		try {
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
			const userId = await new Promise(function (resolve, reject) {
				request({
					uri: "https://api.spotify.com/v1/me/",
					headers: {
						"authorization": "Bearer " + bearer
					},
					json: true
				}, function (err, response, body) {
					if (err || response.statusCode != 200) {
						return reject()
					}
					resolve(body.id)
				})
			})
			const playlistId = await new Promise(function (resolve, reject) {
				request.post({
					uri: "https://api.spotify.com/v1/users/" + userId + "/playlists",
					headers: {
						"Content-Type": "application/json",
						"authorization": "Bearer " + bearer
					},
					body: {
						name: req.params.name,
						public: false
					},
					json: true
				}, function (err, response) {
					if (err || response.statusCode !== 200) {
						return reject()
					}
					resolve(response.body.id)
				})
			})
			await new Promise(function (resolve, reject) {
				config.spotifyPlaylist = playlistId
				fs.writeFile(path.join(process.cwd(), "/data/config.json"), JSON.stringify(config), function (err) {
					if (err) {
						return reject()
					}
					resolve()
				})
			})
			return res.send("Selected playlist " + req.params.name + " (" + playlistId + ")")
		} catch (e) {
			console.error(e)
			return res.sendStatus(500)
		}
	})

	app.listen(3000)

}
module.exports = engine

function getPlaylists(userId, bearer) {
	return new Promise(async function (resolve, reject) {
		var done = false
		var offset = 0
		var playlists = []
		try {
			while (done == false) {
				var playlist = await getPlaylist(bearer, offset)
				console.log(playlist)
				playlist.items.forEach(i => {
					playlists.push(i)
				})
				if (!playlist.next) {
					done = true
				} else {
					offset = offset + 50
				}
			}
			resolve(playlists.filter(i => {
				return i.owner.id == userId
			}))
		} catch (e) {
			return reject(e)
		}

	})
}

function getPlaylist(bearer, offset) {
	try {
		return new Promise(function (resolve, reject) {
			request({
				uri: "https://api.spotify.com/v1/me/playlists",
				headers: {
					"authorization": "Bearer " + bearer
				},
				qs: {
					offset: offset || 0,
					limit: 50
				},
				json: true
			}, function (err, response, body) {
				if (err || response.statusCode != 200) {
					return reject()
				}
				resolve(body)
			})
		})
	} catch (e) {
		console.error(e)
	}
}
