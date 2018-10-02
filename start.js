const Spark = require("sparkbots")
const config = require("./data/config.json")
Spark.start({
    prefix: "b!",
    token: config.token
})
