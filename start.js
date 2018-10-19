const Spark = require("sparkbots")
const config = require("./data/config.json")
Spark.start({
    prefix: config.prefix,
    token: config.token
})
