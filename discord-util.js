const discord = require('discord.js');
const { FastRateLimit } = require('fast-ratelimit');

/** @type {{[name: string]: {id: string, guildId: string, name: string}}} */
let knownEmotes = {};
/** @type {{id: string, chans: {[name: string]: discord.TextChannel}, pending: discord.Role[], 'auto-role': discord.Role[], exclusiveSets: {[name: string]: Set<string>}}[]} */
let managedServers = []; //cache

/** @type {string[]} */
const roleBlacklist = [];
/** @type {string[]} */
const roleWhitelist = [];
/** @type {string[]} */
const roleAdmin = [];

/** @type {{[guild: string]: {[type: string]: FastRateLimit}}} */
const rateLimiters = {};
/** @type {{[guild: string]: {[type: string]: FastRateLimit}}} */
const banLists = {};
/** @type {{[type: string]: FastRateLimit}} */
const selfRateLimiters = {};
/** @type {string[]} */
const syslogSilencedUserIDs = [];
/** @type {{[guildName: string]: {[type: string]: {threshold: number, ttl: number, [bantime]: number}}}} */
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
    }

exports.getCacheEmotesIds = function(guildId) {
    var ids = [];
    for (var i in knownEmotes) {
        var emote = knownEmotes[i];
        //since o
        if (guildId !== undefined && emote.animated && emote.guidId === guidID) {
            ids.push(i);
        }
        return result;
    }
}

class EmojiUtil {
    /**
     *
     * @param {discord.Client} client
     */
    getAllEmotes(client) {
        //to minimize the possibility of spawning deleted emotes
        knownEmotes = {};
        for (const [_, emote] of client.emojis) {
            if (emote.animated) {
                continue;
            }

            let name = emote.name;
            for (let i = 1; knownEmotes[name]; i++) {
                name = emote.name + i;
            }

            knownEmotes[name] = {
                id: emote.id,
                guildId: emote.guild.id,
                name: emote.name
            };
        }
    }

    /**
     * @param {string} guildId
     */
    getCacheEmotesIds(guildId) {
        const result = [];
        for(const i in knownEmotes) {
            const emote = knownEmotes[i];
            if (!emote.animated || (guildId !== undefined && emote.animated && emote.guidId === guildId)) {
                result.push(i);
            }
        }
        return result;
    }

    /**
     *
     * @param {discord.Message} [msg]
     * @param {string} name
     * @returns {{id: string, toString: () => string}}
     */
    getEmote(msg, name) {
        //just in case for unintentional whitespace
        const ename = name.trim();
        const emote = knownEmotes[ename];
        if (emote && emote.id !== undefined) {
            return {
                id: emote.id,
                toString: () => {
                    return `<:${emote.name}:${emote.id}>`;
                }
            };
        }
        //Weird error can not find emojis of undefined
        if (msg instanceof discord.Message && msg.guild !== undefined) {
            const emojis = msg.guild.emojis.find('name', ename);
            if (emojis) {
                return emojis;
            }
        }
        //console.debug(`Warning: unknown emoji "${ename}"`);
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

class MessageUtil {
    /**
     * @param {discord.Message} [msg]
     * @param {string} string
     * @returns {discord.GuildMember}
     */
    findMember(msg, string) {
        if (!string || !(msg instanceof discord.Message) || !msg.channel.guild) {
            return null;
        }

        if (this._isId(string)) {
            string = this._filterUserId(string);
        }

        return msg.channel.guild.members
            .find((item) => item.user.username.indexOf(string) > -1 || item.user.id.indexOf(string) > -1);
    }

    /**
     * @param {Object} opts Embed options. See https://discord.js.org/#/docs/main/stable/class/RichEmbed for more details.
     * @param {Object[]} opts.fields
     * @param {Date} opts.timestamp
     * @param {string} opts.description
     * @param {Object} opts.image
     * @param {string} opts.title
     * @param {Object} opts.author
     * @param {string} opts.url
     * @param {Object} opts.footer
     * @returns {discord.RichEmbed}
     */
    createRichEmbed(opts) {
        const richEmbed = new(discord.RichEmbed || discord.MessageEmbed)();
        if (opts.fields) {
            opts.fields.concat([])
                .splice(0, 25) //to get the first 25 fields
                .forEach((field) => {
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
    }

    /**
     * @param {string} invoc
     * @param {string} helpText
     */
    formatHelpText(invoc, helpText) {
        const prefix = invoc.replace(/\s[^\s]+$/, '');
        return `\`\`\`md\n${helpText.replace(/^#.*\n/mg, '').replace(/INVOC/g, prefix)}\n\`\`\``;
    }

    /**
     *
     * @param {dicord.Channel} channel
     * @param {string} text
     * @param {*} embed
     */
    sendRichEmbed(channel, text, embed) {
        channel.send(text, this.createRichEmbed(embed));
    }

    /**
     * @param {discord.Message} msg
     * @param {string} message
     * @returns {Promise<discord.Message>}
     */
    log(msg, message) {
        const server = findServer(msg.guild);
        if (server.chans['syslog']) {
            return server.chans['syslog'].send(message);
        } else {
            return Promise.resolve();
        }
    }

    /**
     *
     * @param {string} text
     * @param {discord.RichEmbed} embed
     * @returns {(msg: discord.Message) => Promise<discord.Message>}
     */
    createSendRichEmbed(text, embed) {
        return (msg) => msg.channel.send(text, embed);
    }

    /**
     *
     * @param {string} text
     * @param {*} content
     * @returns {(msg: discord.Message) => Promise<discord.Message>}
     */
    createSend(text, options) {
        return (msg) => msg.channel.send(text, options);
    }

    /**
     *
     * @param {() => string} text
     * @param {() => any} content
     * @returns {(msg: discord.Message) => Promise<discord.Message>}
     */
    createSendDynamic(text, options) {
        if (options) {
            return (msg) => msg.channel.send(text(msg), options(msg));
        } else {
            return (msg) => msg.channel.send(text(msg));
        }
    }

    /**
     *
     * @param {string} str
     */
    argParse(str) {
        const spl = [''];
        let esc = false, quot = true;
        for (const c of str) {
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
                }
                break;
            default:
                spl[spl.length - 1] += c;
            }
        }
        return spl;
    }

    /**
     *
     * @param {string} id
     */
    _filterUserId(id) {
        return id.replace(/[^0-9]/g, '');
    }

    /**
     *
     * @param {string} id
     * @returns {boolean}
     */
    _isId(id) {
        return (id.startsWith('<@') || id.startsWith('<@!')) && id.endsWith('>');
    }
}

class RoleUtil {
    /**
     * @param {discord.Message} msg
     */
    isFromAdmin(msg) {
        for (const admin of roleAdmin) {
            if (msg.member.roles.has(admin)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {string} roleType
     * @param {discord.Guild} guild
     * @param {discord.GuildMember} member
     */
    hasRoles(roleType, guild, member) {
        const server = findServer(guild);
        const roles = server[roleType];
        for(const role of (roles || [])) {
            if(!member.roles.has(role.id)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param {string} roleType
     * @param {discord.Guild} guild
     * @returns {discord.Role[]}
     */
    getRoles(roleType, guild) {
        return findServer(guild)[roleType] || [];
    }

    getRoleBlacklist() {
        return roleBlacklist;
    }
    getRoleWhitelist() {
        return roleWhitelist;
    }
}

class ConfigUtil {
    /**
     * @param {discord.Collection<string, T>} arr
     * @param {string} name
     * @returns {T}
     * @template T
     */
    getFromName(arr, name) {
        const re = new RegExp(name.toString().trim(), 'i');
        const result = arr.find(val => re.test(val.name));
        if (arr && name && result) {
            return result;
        } else {
            console.log(new Error(`Could not find ${name} in ${arr}`));
            return null;
        }
    }

    /**
     * @param {discord.client} client
     * @param {*} servers
     */
    getAllServers(client, servers) {
        if(managedServers.length === 0) {
            for (const json of servers)
            {
                const modServ = this._parseModServer(client, json);
                if (modServ)
                    managedServers.push(modServ);
            }
            Object.freeze(managedServers);
        }
        return managedServers;
    }

    /**
     * @param {discord.Client} client
     */
    updateServers(client) {
        try {
            const cachedServers = JSON.parse(JSON.stringify(managedServers)); //If updateServers doesn't work, this is probably why
            managedServers = [];
            return this.getAllServers(client, cachedServers);
        }catch(e) {
            console.log(e);
        }
    }

    /**
     * @param {discord.Guild} guild
     * @param {string} msg
     */
    greetingsParse(guild, msg) {
        const chan = this._getChanID(msg);
        if (chan) {
            const channel = this.getFromName(guild.channels, chan[1]) || '#invalid-channel';
            msg = msg.replace(new RegExp(chan[0], 'g'), channel.toString());
        }
        return msg;
    }

    /**
     *
     * @param {discord.Client} client
     * @param {*} serverJson
     * @returns {{id: string, chans: {[name: string]: discord.GuildChannel}, pending: discord.Role[], 'auto-role': discord.Role[], exclusiveSets: {[name: string]: Set<string>}}}
     */
    _parseModServer(client, serverJson) {
        const result = {id: '', chans: {}, pending: [], 'auto-role': [], exclusiveSets: {}};

        if (serverJson.name == 'dm') {
            console.log('ERROR: "dm" is a reserved keyword for server names. Please use another regex instead.');
            return;
        }

        const server = this.getFromName(client.guilds, serverJson.name);
        if (!server) {
            console.log(`Could not find server ${serverJson.name}`);
            return;
        }

        result.id = server.id;

        if (serverJson.greet) {
            result.greet = serverJson.greeting.replace(/\$PREFIX/g, process.env.BOT_PREFIX);
        }

        try {
            for (const chan in serverJson.channels) {
                if(!serverJson.channels[chan]) continue;
                result.chans[chan] = this.getFromName(server.channels, serverJson.channels[chan]);
            }

            Object.assign(result, this._parseRoles(serverJson, server));
            this._parseRatelimiters(serverJson, server);

            return result;
        } catch(e) {
            console.log(e);
        }
        return null;
    }

    /**
     *
     * @param {*} json
     * @param {discord.Guild} server
     * @returns {{pending: discord.Role[], 'auto-role': discord.Role[], exclusiveSets: {[name: string]: Set<string>}}
     */
    _parseRoles(json, server) {
        const result = {pending: [], 'auto-role': [], exclusiveSets: {}};

        if (json.roles.pending) {
            for (const role of json.roles.pending) {
                result.pending.push(this.getFromName(server.roles, role));
            }
        }

        if(json.roles['auto-role']) {
            for (const role of json.roles['auto-role']) {
                result['auto-role'].push(this.getFromName(server.roles, role));
            }
        }
        if (json.roles.blacklist) {
            for (const role of json.roles.blacklist) {
                roleBlacklist.push(this.getFromName(server.roles, role).id);
            }
        }

        if (json.roles.whitelist) {
            for (const role of json.roles.whitelist) {
                roleWhitelist.push(this.getFromName(server.roles, role).id);
            }
        }

        if (json.roles.admin) {
            for(const role of json.roles.admin) {
                roleAdmin.push(this.getFromName(server.roles, role).id);
            }
        }

        if (json.roles.exclusivities) {
            for (const roleSet of json.roles.exclusivities) {
                for (const exRole of roleSet) {
                    const exRoleID = this.getFromName(server.roles, exRole).id;
                    if (!result.exclusiveSets.hasOwnProperty(exRoleID)) {
                        result.exclusiveSets[exRoleID] = new Set();
                    }
                    for (const role of roleSet) {
                        const roleId = this.getFromName(server.roles, role).id;
                        if (roleId !== exRoleID) {
                            result.exclusiveSets[exRoleID].add(roleId);
                        }
                    }
                }
            }
        }

        return result;
    }

    /**
     *
     * @param {*} json
     * @param {discord.Guild} server
     */
    _parseRatelimiters(json, server) {
        const ratelimitConfig = Object.assign({}, rateLimiterDefaultConfig);

        rateLimiters[server.id] = {};

        if (json.ratelimit) {
            if (json.ratelimit.server) {
                ratelimitConfig.server = json.ratelimit.server;
            }
            if (json.ratelimit.channel) {
                ratelimitConfig.channel = json.ratelimit.channel;
            }
            if (json.ratelimit.abuse) {
                ratelimitConfig.abuse = json.ratelimit.abuse;
            }
        } else {
            console.log('[ratelimit] WARN: using default configuration for server ' + json.name);
        }

        for (const ratelimitType in ratelimitConfig) {
            if (ratelimitConfig.hasOwnProperty(ratelimitType)) {
                if (ratelimitConfig[ratelimitType].hasOwnProperty('bantime')) {
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


    /**
     *
     * @param {string} msg
     */
    _getChanID(msg) {
        const pattern = /chan:([^ ]*?)( |$)/i;
        const matches = pattern.exec(msg);
        if (!matches)
            return null;

        return [matches[0], matches[1]];
    }
}

class RatelimiterUtil {
    /**
     *
     * @param {{[type: string]: {threshold: number, ttl: number, [bantime]: number}}} rlConfig
     */
    setRateLimiterDefaultConfig(rlConfig) {
        rateLimiterDefaultConfig = rlConfig;
    }

    /**
     *
     * @param {{[ratelimiterType: string]: {threshold: number, ttl: number}}} config
     */
    setupSelfRateLimiters(config) {
        if (config['syslog-ratelimit-user']) {
            selfRateLimiters.syslogRatelimit = new FastRateLimit(config['syslog-ratelimit-user']);
        } else {
            console.log('[ratelimit] WARN: using default configuration for self: syslog RL alerts ratelimiter');
            selfRateLimiters.syslogRatelimit = new FastRateLimit(rateLimiterDefaultConfig);
        }

        if (config['timers-ratelimit']) {
            selfRateLimiters.timersRatelimit = new FastRateLimit(config['timers-ratelimit']);
        } else {
            console.log('[ratelimit] WARN: using default configuration for self: timers ratelimiter');
            selfRateLimiters.timersRatelimit = new FastRateLimit(rateLimiterDefaultConfig);
        }
    }

    /**
     *
     * @param {{[ratelimiterType: string]: {threshold: number, ttl: number}}} config
     */
    setupDMRatelimiter(config) {
        // Setup additional ratelimiter for DM messages based on defaults
        rateLimiters['dm'] = {};
        for (const ratelimitType in config) {
            // Check for rateLimiterDefaultConfig is intended; we don't want ghost
            // ratelimiter types polluting the namespace.
            if (rateLimiterDefaultConfig.hasOwnProperty(ratelimitType)) {
                rateLimiters['dm'][ratelimitType] = new FastRateLimit(config[ratelimitType]);
            }
        }
    }

    /**
     *
     * @param {discord.Message} message
     */
    async consumeRateLimitToken(message) {
        const guild = message.guild;
        const user = message.member;
        const serverNamespace = user.id;
        const channelNamespace = message.channel.id + ':' + user.id;

        // Ratelimiter server selector
        /** @type {{[type: string]: FastRateLimit}} */
        const ratelimiterServer = this._getRateLimiterServer(message);
        // Ratelimit blocks by default if the server is not registered into the system!
        if (!ratelimiterServer) {
            console.log('[ratelimit] WARN: guild not registered in system: ' + guild.id);
            throw new Error('[ratelimit] WARN: guild not registered in system: ' + guild.id);
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

        // Get the stack-trace up to here, for debugging purposes.
        let error;

        try {
            throw new Error();
        } catch(e) {
            error = e.stack.replace(/^Error\n/g, '');
        }

        // Obtain a suitable name-space
        const namespace = ++timerCounter;

        const interval = setInterval(async () => {
            try {
                await selfRateLimiters.timersRatelimit.consume(namespace);
            } catch(e) {
                console.log('[ratelimit] ratelimited timer !!! declaration stack:');
                console.log(error);
                clearInterval(interval);
                console.log('[ratelimit] timer disabled');
            }
            fn();
        }, time);
    }



    /**
     * @param {discord.Messsage} msg
     * @returns {{[type: string]: FastRateLimit}}
     */
    _getRateLimiterServer(msg) {
        const guild = msg.guild;

        // Is it a DM?
        if (!guild) {
            // Yes, the DMs ratelimiter is used.
            return rateLimiters['dm'];
        } else {
            // No, the ratelimiter for that server is used, if it's there.
            if (!rateLimiters[guild.id]) {
                return;
            }

            return rateLimiters[guild.id];
        }
    }

    /**
     *
     * @param {discord.Message} msg
     * @param {string} scope
     * @param {{[type: string]: FastRateLimit}}
     * @returns {Promise<void>}
     */
    async _printRateLimitError(msg, scope, ratelimiterServer) {
        const guild = msg.guild;
        const user = msg.member;
        const serverNamespace = user.id;

        if (!guild)
            return;

        const server = findServer(guild);
        if (server && server.chans['syslog']) {
            try {
                await selfRateLimiters.syslogRatelimit.consume(serverNamespace + ':' + scope);

                if (syslogSilencedUserIDs.includes(user.id)) {
                    syslogSilencedUserIDs.splice(syslogSilencedUserIDs.indexOf(user.id), 1);
                }
                switch (scope) {
                case 'server':
                    await server.chans['syslog'].send(
                        '[RateLimit] User ' + user +
                            ' has exceeded the server ratelimit threshold for this server. Message link: ' +
                            this._messageToURL(msg)
                    );
                    break;
                case 'channel':
                    await server.chans['syslog'].send(
                        '[RateLimit] User ' + user +
                            ' has exceeded the channel ratelimit threshold for channel ' + msg.channel + '. Message ID: ' +
                            this._messageToURL(msg)
                    );
                    break;
                default:
                    break;
                }
            } catch (e) {
                if (!syslogSilencedUserIDs.includes(user.id)) {
                    await server.chans['syslog'].send(
                        '[RateLimit] User ' + user +
                        ' has been blocked on scope "' + scope + '" too much; silencing minor alerts for a couple of minutes.'
                    );
                    syslogSilencedUserIDs.push(user.id);
                }
            }

            // Consume tokens on abuse bucket
            try {
                await ratelimiterServer.abuse.consume(serverNamespace);
            } catch (e) {
                await server.chans['syslog'].send(
                    '[RateLimit] User ' + user +
                    ' keeps spamming the bot; blocked for ' +
                    banLists[guild.id].abuse.__options.ttl_millisec / 1000 +
                    ' seconds.'
                );
                await banLists[guild.id].abuse.consume(serverNamespace).catch(() => {});
            }
        }
    }

    /**
     *
     * @param {discord.Message} message
     */
    _messageToURL(message) {
        return 'https://discordapp.com/channels/' +
        (message.guild ? message.guild.id : '@me') + '/' +
        message.channel.id + '/' + message.id;
    }
}


const factory = new UtilFactory();
module.exports = factory.createUtil();
