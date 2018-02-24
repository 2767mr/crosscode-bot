const Discord = require("discord.js");
const client = new Discord.Client();
//require("./botrac4r/botrac4r.js");
let {
    readFileSync
} = require('fs');
let util = require('./js/discord-util.js');
let prefix = process.env.BOT_PREFIX;
let cmdTypes = ["general", "nsfw", "streams", "art", "voice", "mods", "anime", "game"];
let commands = {};
let helpText = {};
for (let type of cmdTypes) {
    commands[type] = require(`./js/command/${type}/commands.js`)(client, util);
    //TODO: Add help text for each function
    helpText[type] = readFileSync(`./js/command/${type}/help.txt`).toString();
}
Array.prototype.random = function() {
    return this[parseInt(Math.random() * this.length)];
}
var ccModServ;
var pendingRole;
var watchTower;

function findModServer() {
    ccModServ = client.guilds.find('name', 'CrossCode Modding');
    if (ccModServ) {
        console.log("Found your server.");
        pendingRole = ccModServ.roles.find('name', 'pending');
        watchTower = ccModServ.channels.find('name', 'admin-watchtower');
    } else {
        console.log("Modding Server does not exist");
    }
}
let activityTypes = {
    GAMING: 0,
    STREAMING: 1,
    LISTENING: 2,
    WATCHING: 3
};
let gameStats = [{
    name: "santiballs",
    type: activityTypes.GAMING
}, {
    name: "...hi?",
    type: activityTypes.GAMING
}, {
    name: "...bye!",
    type: activityTypes.GAMING
}, {
    name: "Hi-5!!!",
    type: activityTypes.GAMING
}, {
    name: "the devs code :)",
    type: activityTypes.WATCHING
}, {
    name: "with mods",
    type: activityTypes.GAMING
}, {
    name: "cc.ig",
    type: activityTypes.GAMING
}, {
    name: "with CCLoader",
    type: activityTypes.GAMING
}, {
    name: "in multiplayer :o",
    type: activityTypes.GAMING
}, {
    name: "...Lea. -.-",
    type: activityTypes.WATCHING
}, {
    name: "CrossCode v1",
    type: activityTypes.GAMING
}, {
    name: "Intero's Music :o",
    type: activityTypes.LISTENING
}]

function newGame() {
    var ran = gameStats.random();
    console.log('Here is the random', ran);
    client.user.setPresence({
        activity: ran
    });
};
client.on('ready', () => {
    findModServer();
    util.getAllEmojis(client);
    console.log(`Logged in as ${client.user.tag}!`);
    newGame();
    setInterval(newGame, 120000);
});
client.on('guildMemberAdd', function(newMember) {
    if (newMember.guild.id === ccModServ.id && pendingRole) {
        newMember.addRoles([pendingRole]);
        watchTower.send(`Added pending role to ${newMember.toString()}`);
    }
});

function onMessage(msg) {
    //lel
    if (msg.content.toLowerCase().startsWith("failed to load")) {
        msg.channel.send("oof");
        return;
    }
    //Allow for new line parsing
    let args = msg.content.replace(/^\s+|\s+$/g, '').split(/\s+/);
    let _prefix = args.shift();
    if (!_prefix.startsWith(prefix))
        return;
    let invoc = _prefix;
    let type = "general";
    if (args[0] && args[0].startsWith("-")) {
        type = args[0].substring(1)
        if (!commands[type]) {
            onError(msg);
            return;
        }
        invoc += ` ${args[0]}`;
        args.shift();
    }

    let command = args.shift()
    if(command === "help")
    {
        msg.channel.send(util.formatHelpText(invoc, helpText[type]));
        return;
    }
    let func = commands[type][command]
    if (func) {
        func(msg, args, command, console)
    } else {
        onError(msg)
    }

}
client.on('message', onMessage);
client.login(process.env.BOT_TOKEN);
