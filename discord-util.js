const Discord = require('discord.js');
const FastRateLimit = require("fast-ratelimit").FastRateLimit;

let knownEmotes = {};
let manageServs = []; // cache
let roleBlacklist = [];
let roleWhitelist = [];
let roleAdmin = [];

let rateLimiters = {};
let banLists = {};
let selfRateLimiters = {};
let syslogSilencedUserIDs = [];
let rateLimiterDefaultConfig = {};
let timerCounter = 0;
let devIds = [
  "208763015657553921"
];
exports.getAllEmotes = function(client) {
    //to minimize the possibility of spawning deleted emotes
    knownEmotes = {};
    client.emojis.array().forEach(function(emote) {
        if (emote.animated)
            return;
        var name = emote.name;
        for (var i = 1; knownEmotes[name]; i++) {
            name = emote.name + i;
        }
        knownEmotes[name] = {
            id: emote.id,
            guildId: emote.guild.id,
            name: emote.name
        };
    });
};

exports.getCacheEmotesIds = function(guildId) {
    var ids = [];
    for (var i in knownEmotes) {
        var emote = knownEmotes[i];
        //since o
        if (guildId !== undefined && emote.animated && emote.guidId === guidID) {
            ids.push(i);
        }
    }
    return ids;
};

function filterUserId(id) {
    return id.replace(/[^0-9]/g, "");
}

function isId(id) {
    return (id.startsWith("<@") || id.startsWith("<@!")) && id.endsWith(">")
}

Array.prototype.listjoin = function(word) {
    if(this.length < 3)
        return this.join(` ${word} `);
    return `${this.slice(0, this.length - 1).join(", ")}, ${word} ${this[this.length - 1]}`;
}

exports.getEmote = function(object, name) {
    //just in case for unintentional whitespace
    name = name.trim();
    let emote = knownEmotes[name];
    if (emote && emote.id !== undefined) {
        return {
            id: emote.id,
            toString: function() {
                if(emote.animated) {
                  return `<a:${emote.name}:${emote.id}>`;
                }
                return `<:${emote.name}:${emote.id}>`;
            }
        };
    }
    //Weird error can not find emojis of undefined
    let emojis = null;
    if (object instanceof Discord.Message && object.guild !== undefined) {
        emojis = object.guild.emojis.find("name", name);
        if (emojis)
            return emojis;
    }
    //console.debug(`Warning: unknown emoji "${name}"`);
    return {
        id: "",
        toString: function() {
            return "*could not find emoji*";
        }
    };
};

exports.findMember = function(object, string) {
    let member = null;
    if (string && object instanceof Discord.Message && object.channel.guild) {
        if (isId(string)) {
            string = filterUserId(string)
        }
        member = object.channel.guild.members.find(function(item) {
            return item.user.username.indexOf(string) > -1 || item.user.id.indexOf(string) > -1;
        })
    }
    return member;
};

exports.createRichEmbed = function(opts) {
    let richEmbed = new(Discord.RichEmbed || Discord.MessageEmbed);
    if (opts.fields) {
        let fields = opts.fields.concat([]);
        //to get the first 25 fields
        fields = fields.splice(0, 25);
        fields.forEach(function(field) {
            richEmbed.addField(field.name, field.value);
        });
    }
    opts.timestamp && richEmbed.setTimestamp(opts.timestamp);
    opts.description && richEmbed.setDescription(opts.description);
    opts.image && richEmbed.setImage(opts.image);
    opts.title && richEmbed.setTitle(opts.title);
    opts.author && richEmbed.setAuthor(opts.author);
    opts.url && richEmbed.setURL(opts.url);
    opts.footer && opts.footer.text && richEmbed.setFooter(opts.footer.text);
    return richEmbed;
};

exports.formatHelpText = function(invoc, helpText) {
    let prefix = invoc.replace(/\s[^\s]+$/, '');
    return `\`\`\`md\n${helpText.replace(/^#.*\n/mg, '').replace(/INVOC/g, prefix)}\n\`\`\``;
};

exports.isFromBotDeveloper = function(msg) {
    for(const id of devIds) {
        if(id === msg.author.id) {
            return true;
        }
    }
    return false;
   
};

exports.isFromAdmin = function(msg) {
    for(let admin of roleAdmin) {
      if(msg.member.roles.has(admin)) {
        return true;
      }
    }
    return false;
};

function discObjFind(obj, name) {
    let re = new RegExp(name.toString().trim(), 'i');
    let ret = obj.find(val => re.test(val.name));
    if (obj && name && ret)
        return ret;
    else
        throw `Could not find ${name} in ${obj}`;
}
exports.discObjFind = function(obj, name) {
    try {
        return discObjFind(obj, name);
    } catch(e) {
        console.log(e);
    }
    return null;
}
function findModServer(client, serverJson, console) {
    let retval = {id: "", chans: {}, pending: [], "auto-role": [], exclusiveSets: {}};
    try {
        if (serverJson.name == "dm") {
            console.log("ERROR: \"dm\" is a reserved keyword for server names. Please use another regex instead.")
            throw new Error("\"dm\" is a reserved keyword for server names");
        }

        let server = discObjFind(client.guilds, serverJson.name);
//        console.log(server);

        retval.id = server.id;
        retval.greet = serverJson.greeting.replace(/\$PREFIX/g, process.env.BOT_PREFIX);
        for (let role in serverJson.channels) {
          if(!serverJson.channels[role]) continue;
          retval.chans[role] = exports.discObjFind(server.channels, serverJson.channels[role]);
        }

        if (serverJson.roles.pending) {
            for (let role of serverJson.roles.pending) {
              retval.pending.push(exports.discObjFind(server.roles, role));
            }
        }

        if(serverJson.roles["auto-role"]) {
          for (let role of serverJson.roles["auto-role"]) {
            retval['auto-role'].push(exports.discObjFind(server.roles, role));
          }
        }
        if (serverJson.roles.blacklist) {
            for (let role of serverJson.roles.blacklist) {
              roleBlacklist.push(exports.discObjFind(server.roles, role).id);
            }
        }

        if (serverJson.roles.whitelist) {
            for (let role of serverJson.roles.whitelist) {
                roleWhitelist.push(exports.discObjFind(server.roles, role).id);
            }
        }

        if (serverJson.roles.admin) {
            for(let role of serverJson.roles.admin) {
                roleAdmin.push(exports.discObjFind(server.roles, role).id);
            }
        }

        if (serverJson.roles.exclusivities) {
            for (let roleSet of serverJson.roles.exclusivities) {
                for (let exRole of roleSet) {
                    var exRoleID = exports.discObjFind(server.roles, exRole).id;
                    if (!retval.exclusiveSets.hasOwnProperty(exRoleID)) {
                        retval.exclusiveSets[exRoleID] = new Set();
                    }
                    for (let exRole_innerCheck of roleSet) {
                        var roleToAddID = exports.discObjFind(server.roles, exRole_innerCheck).id;
                        if (roleToAddID !== exRoleID) {
                            retval.exclusiveSets[exRoleID].add(roleToAddID);
                        }
                    }
                }
            }
        }

        var ratelimitConfig = Object.assign({}, rateLimiterDefaultConfig);

        rateLimiters[server.id] = {};

        if (serverJson.ratelimit) {
            if (serverJson.ratelimit.server) {
                ratelimitConfig.server = serverJson.ratelimit.server;
            }
            if (serverJson.ratelimit.channel) {
                ratelimitConfig.channel = serverJson.ratelimit.channel;
            }
            if (serverJson.ratelimit.abuse) {
                ratelimitConfig.abuse = serverJson.ratelimit.abuse;
            }
        } else {
            console.log("[ratelimit] WARN: using default configuration for server " + serverConfig.name);
        }

        for (var ratelimitType in ratelimitConfig) {
            if (ratelimitConfig.hasOwnProperty(ratelimitType)) {
                if (ratelimitConfig[ratelimitType].hasOwnProperty("bantime")) {
                    if (!banLists[server.id]) {
                        banLists[server.id] = {};
                    }
                    banLists[server.id][ratelimitType] = new FastRateLimit({
                        ttl: ratelimitConfig[ratelimitType].bantime,
                        threshold: 1
                    });
                }
                rateLimiters[server.id][ratelimitType] = new FastRateLimit(ratelimitConfig[ratelimitType]);
            }
        }

        return retval;
    } catch(e) {
        console.log(e);
    }
    return null;
}
function findServer(guild) {
  for(let server of manageServs) {
     if(guild.id === server.id) {
        return server;
     }
  }
}
exports.hasRoles = function(roleType, guild, member, console) {
  var server = findServer(guild);
  var roles = server[roleType];
  for(let role of (roles || [])) {
    if(!member.roles.has(role.id)) {
      return false;
    }
  }
  return true;
}
exports.getRoles = function(roleType, guild) {
  var server = findServer(guild);
  return server[roleType] || [];
}
exports.log = function(msg, message) {
  var server = findServer(msg.guild);
  if (server.chans["syslog"]) {
    return server.chans["syslog"].send(message);
  } else {
    return null;
  }
}
exports.getAllServers = function getAllServers(client, servers, console) {
    if(manageServs.length === 0)
        for (let json of servers)
        {
            let modServ = findModServer(client, json, console);
            if (modServ)
                manageServs.push(modServ);
        }
    return manageServs;
}
exports.updateServers = function(client, console) {
  try {
    var cachedServers = JSON.parse(JSON.stringify(manageServs));
    manageServs = [];
    this.getAllServers(client, cachedServers, console);
  }catch(e) {
    console.log(e);
  }
}
exports.getRoleBlacklist = function() {
    return roleBlacklist;
}
exports.getRoleWhitelist = function() {
    return roleWhitelist;
}
function getChanID(msg) {
  let first = msg.indexOf("chan:");
  if(first == -1) {
    return -1;
  }
  const cLen = "chan:".length;
  first += cLen;
  let last = first;
  var res = msg.indexOf(" ", first);
  if(res > -1) {
    last = res;
  } else {
    last = msg.length;
  }
  return [msg.substring(first - cLen, last), msg.substring(first, last)];
}
exports.greetingsParse = function(guild, msg) {
   var chan;
   while(Array.isArray((chan = getChanID(msg)))) {
       let channel = exports.discObjFind(guild.channels, chan[1]) || "#invalid-channel";
       msg = msg.replace(new RegExp(chan[0], 'g'), channel.toString());
   }
   return msg;
}
exports.argParse = function(str) {
    let spl = [''], esc = false, quot = true;
    for (let c of str) {
        if (esc) { // last character was a backslash, skip handling
            esc = false;
            spl[spl.length - 1] += '\\' + c;
            continue;
        }
        switch(c) {
        case '\\':
            esc = true; // escape next character
            break;
        case '"':
            quot = !quot;
            break;
        case ' ':
        case '\t':
            if (quot && spl[spl.length - 1]) {
                spl.push(''); // split on unquoted spaces
                break;
            }
        default:
            spl[spl.length - 1] += c;
        }
    }
    return spl;
}

function messageToURL(message) {
    return "https://discordapp.com/channels/" +
    (message.guild ? message.guild.id : "@me") + "/" +
    message.channel.id + "/" + message.id
}

exports.messageToURL = messageToURL;

exports.setSafeInterval = function(fn, time) {
    // Check for overflows
    if (time > 2147483647) {
        throw new Exception("Potential misbehaving timer detected!");
    }

    // Get the stack-trace up to here, for debugging purposes.
    let error;

    try {
        throw new Error();
    } catch(e) {
        error = e.stack.replace(/^Error\n/g, "");
    }

    // Obtain a suitable name-space
    let namespace = ++timerCounter;

    let interval = setInterval(async () => {
        try {
            await selfRateLimiters.timersRatelimit.consume(namespace);
        } catch(e) {
            console.log("[ratelimit] ratelimited timer !!! declaration stack:");
            console.log(error);
            clearInterval(interval);
            console.log("[ratelimit] timer disabled");
        }
        fn();
    }, time);
}

exports.setRateLimiterDefaultConfig = function(rlConfig) {
    rateLimiterDefaultConfig = rlConfig;
}

exports.setupSelfRateLimiters = function(config) {
    if (config["syslog-ratelimit-user"]) {
        selfRateLimiters.syslogRatelimit = new FastRateLimit(config["syslog-ratelimit-user"]);
    } else {
        console.log("[ratelimit] WARN: using default configuration for self: syslog RL alerts ratelimiter");
        selfRateLimiters.syslogRatelimit = new FastRateLimit(rateLimiterDefaultConfig);
    }

    if (config["timers-ratelimit"]) {
        selfRateLimiters.timersRatelimit = new FastRateLimit(config["timers-ratelimit"]);
    } else {
        console.log("[ratelimit] WARN: using default configuration for self: timers ratelimiter");
        selfRateLimiters.timersRatelimit = new FastRateLimit(rateLimiterDefaultConfig);
    }
}

exports.setupDMRatelimiter = function(config) {
    // Setup additional ratelimiter for DM messages based on defaults
    rateLimiters["dm"] = {};
    for (var ratelimitType in config) {
        // Check for rateLimiterDefaultConfig is intended; we don't want ghost
        // ratelimiter types polluting the namespace.
        if (rateLimiterDefaultConfig.hasOwnProperty(ratelimitType)) {
            rateLimiters["dm"][ratelimitType] = new FastRateLimit(config[ratelimitType]);
        }
    }
}

/**
 *
 * @param {Discord.TextChannel} channel
 * @param {string} text
 * @param {*} embed
 */
exports.sendRichEmbed = function(channel, text, embed) {
    return channel.send(text, embed);
}

exports.createSendRichEmbed = function(text, embed) {
    return (msg) => exports.sendRichEmbed(msg.channel, text, embed);
}

/**
 *
 * @param {string} text
 * @param {*} content
 * @returns {(msg: Discord.Message) => void}
 */
exports.createSend = function(text, options) {
    return (msg) => msg.channel.send(text, options);
}

/**
 *
 * @param {() => string} text
 * @param {() => any} content
 * @returns {(msg: Discord.Message) => void}
 */
exports.createSendDynamic = function(text, options) {
    if (options) {
        return (msg) => msg.channel.send(text(msg), options(msg));
    } else {
        return (msg) => msg.channel.send(text(msg));
    }
}


/**
 *
 * @param {Discord.Message} msg
 */
exports.consumeRateLimitToken = function(message) {
    // Ratelimiter server selector
    let ratelimiterServer;
    let guild = message.guild;
    let user = message.author;

    // Is it a DM?
    if (!guild) {
        // Yes, the DMs ratelimiter is used.
        ratelimiterServer = rateLimiters["dm"];

    } else {
        // No, the ratelimiter for that server is used, if it's there.
        // Ratelimit blocks by default if the server is not registered into the system!
        if (!rateLimiters[guild.id]) {
            console.log("[ratelimit] WARN: guild not registered in system: " + guild.id);
            return Promise.reject();
        }

        ratelimiterServer = rateLimiters[guild.id];

        // Test against banlist
        var isBanned = false;
        for (var servenBanType in banLists[guild.id]) {
            if (banLists[guild.id].hasOwnProperty(servenBanType)) {
                if (!(banLists[guild.id][servenBanType].hasTokenSync(user.id))) {
                    isBanned = true;
                    break;
                }
            }
        }
        if (isBanned) {
            return Promise.reject("banlist");
        }
    }

    let serverNamespace = user.id;
    let channelNamespace = message.channel.id + ":" + user.id

    // Consume the tokens for each ratelimiter type, and test against abuse bucket
    return Promise.all([
        ratelimiterServer.abuse.hasToken(channelNamespace).catch(() => {return Promise.reject("abuse")}),
        ratelimiterServer.server.consume(serverNamespace).catch(() => {return Promise.reject("server")}),
        ratelimiterServer.channel.consume(channelNamespace).catch(() => {return Promise.reject("channel")})
    ]).catch((scope) => {
        if (guild) {
            if (scope == "abuse") return;

            let server = findServer(guild);
            if (server && server.chans["syslog"]) {
                selfRateLimiters.syslogRatelimit.consume(serverNamespace + ":" + scope).then(() => {
                    if (syslogSilencedUserIDs.includes(user.id)) {
                        syslogSilencedUserIDs.splice(syslogSilencedUserIDs.indexOf(user.id), 1);
                    }
                    switch (scope) {
                        case "server":
                            server.chans["syslog"].send(
                                "[RateLimit] User " + user +
                                " has exceeded the server ratelimit threshold for this server. Message link: " +
                                messageToURL(message)
                            );
                            break;
                        case "channel":
                            server.chans["syslog"].send(
                                "[RateLimit] User " + user +
                                " has exceeded the channel ratelimit threshold for channel " + message.channel + ". Message ID: " +
                                messageToURL(message)
                            );
                            break;
                        default:
                            break;
                    }
                }).catch(() => {
                    if (!syslogSilencedUserIDs.includes(user.id)) {
                        server.chans["syslog"].send(
                            "[RateLimit] User " + user +
                            " has been blocked on scope \"" + scope + "\" too much; silencing minor alerts for a couple of minutes."
                        );
                        syslogSilencedUserIDs.push(user.id);
                    }
                });

                // Consume tokens on abuse bucket
                ratelimiterServer.abuse.consume(serverNamespace).catch(() => {
                    server.chans["syslog"].send(
                        "[RateLimit] User " + user +
                        " keeps spamming the bot; blocked for " +
                        banLists[guild.id].abuse.__options.ttl_millisec / 1000 +
                        " seconds."
                    );
                    banLists[guild.id].abuse.consume(serverNamespace).catch(() => {});
                });
            }
        }
        return Promise.reject(
            "[ratelimit] block " + scope + " uid=" + user.id + " mid=" + message.id +
            (scope == "channel" ? (" chid=" + message.channel.id) : "")
        );
    });
}
