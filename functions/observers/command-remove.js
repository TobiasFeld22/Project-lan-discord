var Spark = require("sparkbots")
const Observer = Spark.observer("command-remove")
Observer.setType("all")
Observer.code = (client, message) => {
    if (message.channel.id == "378156957070000139") {
        setTimeout(function() {
            try {
                message.delete()
            } catch (e) {
                console.log(e)
            }
        }, 5000)
    }

    return false

}
module.exports = Observer;
