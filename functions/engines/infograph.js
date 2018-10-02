const spark = require("sparkbots")
const engine = spark.engine("infograph")
var moment = require("moment")
require("moment-duration-format")(moment)
var baseurl = "https://admin.projectlan.nl/"
var config = require("./../../data/config.json")
engine.setTime(60000)
engine.code = (client) => {
    login(config.lan_user, config.lan_pw)
        .then(async x => {
            var data = await getStats(x)
            client.channels.get("495899284416233487").setName(`👱 ${data} deelnemers binnen`)
            var time = null
            console.log(moment())
            if (moment.utc().valueOf() > 1542380400000) {
                time = moment.duration(1542380400000 - moment.utc().valueOf(), "milliseconds").format(" HH: mm [tot eind]")
            } else {
                time = moment.duration(1542380400000 - moment.utc().valueOf(), "milliseconds").format("d[d], HH: mm [👉 Start]")
            }
            client.channels.get("495899425017954315").setName(`🕒 ${time}`)
        })
        .catch(e => {
            console.error(e)
        })
}


module.exports = engine

var cheerio = require("cheerio")
var request = require("request")

var eventnr = 33

function getStats(cookie) {
    return new Promise(function(resolve) {
        var c = request.cookie("PHPSESSID=" + cookie)
        var jar = request.jar()
        jar.setCookie(c, baseurl)

        return request({
            url: `${baseurl}`,
            method: "GET",
            headers: {"Content-Type": "multipart/form-data"},
            jar
        }, function(error, response, body) {
            if (error || response.statusCode != 200) {
                return console.error(error)
            }
            var $ = cheerio.load(body)
            var user = $(".huge")
            if (user.eq(0).text().includes("/")) {
                return resolve(user.eq(0).text().split("/")[0])
            }
            return resolve(user.eq(0).text())



        });
    })
}

function login(usr, pwd, attempt) {
    return new Promise(function(resolve, reject) {
        var data = {
            "event": eventnr,
            login: "login",
            pwd,
            usr
        }
        return request({
            url: `${baseurl}/login/login.php`,
            method: "POST",
            headers: {"Content-Type": "multipart/form-data"},
            formData: data
        }, function(error, response, body) {
            if (error || response.statusCode !== 200) {
                console.log(error)
                reject(3)
            } else if (body.includes("error") || body.includes("fout")) {
                reject(1)
            } else {
                var cookie = response.headers["set-cookie"]

                if (!cookie && !body.includes("Welkom")) {
                    try {
                        if (!attempt) {
                            attempt = 0
                        } else if (attempt == 2) {
                            return reject(3)
                        } else {
                            attempt = attempt + 1
                        }
                        setTimeout(async function() {
                            cookie = await login(usr, pwd, attempt)
                            resolve(cookie)

                        }, 10000)
                    } catch (e) {
                        reject(e)
                    }
                } else {

                    cookie = cookie.filter(i => {
                        return i.includes("PHPSESSID=")
                    })[0].replace("PHPSESSID=", "").replace("; path=/", "")
                    resolve(cookie)

                }

            }
        })
    });
}
