/* eslint no-eval: off */
module.exports = (client, message) => {

    const code = message.content.split(" ").slice(1).join(" ")
    if (code.trim().length == 0) {
        return message.channel.send("please enter something!")
    }
    try {
        const evaled = eval(code);
        if (evaled instanceof Promise) {
            message.channel.send("Resolving promise...").then(m => {
                var done = false;
                var timeout = setTimeout(function() {
                    m.edit("Couldn't resolve promise in time. :clock2: (20s)")
                    done = true;
                }, 20000);
                evaled.then((x) => {
                    if (done == true) {
                        return
                    }
                    clearTimeout(timeout)
                    done = true;
                    next(x, m)
                }).catch(err => {
                    if (done == true) {
                        return
                    }
                    clearTimeout(timeout)
                    error(err)
                    done = true;
                })
            })
        } else {
            message.channel.send("eval running")
                .then(m => {
                    next(evaled, m)
                })
        }




    } catch (err) {
        error(err)
    }

    function error(err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
}

function next(evaled, m) {
    if (typeof evaled !== "string") {
        evaled = require("util").inspect(evaled);
    }
    console.log(evaled)
    if (evaled.length >= 1900) {
        evaled = evaled.substring(0, 1900) + " (... character limit reached. | See rest in your console.)"
    }
    m.channel.send("```xl\n" + clean(evaled) + "\n```");
}

function clean(text) {
    if (typeof (text) === "string") {
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    }
    return text;
}
