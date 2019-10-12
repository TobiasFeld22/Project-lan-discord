// const spark = require("sparkbots")
// const engine = spark.engine("time")
// var moment = require("moment")
// require("moment-duration-format")(moment)
// // var ctime = 1552060800000
// // var next = 1570521200000
// engine.setTime(60000)
// engine.code = async (client) => {
//     // var time = null
//     // if (moment.utc().valueOf() > ctime && moment.utc().valueOf() < (ctime + 86400000)) {
//     //     time = moment.duration((ctime + 86400000) - moment.utc().valueOf(), "milliseconds").format("HH: mm [👉 Einde]")
//     // } else if (moment.utc().valueOf() > ctime && moment.utc().valueOf() > (ctime + 86400000)) {
//     //     time = moment.duration((next) - moment.utc().valueOf(), "milliseconds").format("d[d], HH: mm [👉 lan 33!]")
//     // } else {
//     //     time = moment.duration(ctime - moment.utc().valueOf(), "milliseconds").format("d[d], HH: mm [👉 lan 32!]")
//     // }
//     // client.channels.get("495899425017954315").setName(`🕒 ${time}`)
//     var twitch = await client.r.table("twitch")
//     var online = 0
//     twitch.forEach(i => {
//         if (i.nr != 0) {
//             online = online + 1
//         }
//     })
//     if (online == 0) {
//         client.channels.get("500095680791183361").setName("📹 Geen streamers online")
//     } else if (online == 1) {
//         client.channels.get("500095680791183361").setName(`📹 ${online} streamer 👉 #twitch`)
//     } else {
//         client.channels.get("500095680791183361").setName(`📹 ${online} streamers 👉 #twitch`)
//
//     }
// }
//
//
// module.exports = engine
