const spark = require("sparkbots")
const engine = spark.engine("connect")
const config = require("../../data/config.json")
engine.code = (client) => {
    client.r = require("rethinkdbdash")({
        db: "global",
        servers: config.servers,
        user: config.username,
        password: config.password
    })

}
module.exports = engine
