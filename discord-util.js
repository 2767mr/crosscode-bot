const discord = require('discord.js');
const { FastRateLimit } = require('fast-ratelimit');

/** @type {{[name: string]: {id: string, guildId: string, name: string}}} */
let knownEmotes = {};
/** @type {{id: string, chans: {[name: string]: discord.GuildChannel}, pending: discord.Role[], 'auto-role': discord.Role[], exclusiveSets: {[name: string]: Set<string>}}[]} */
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
const selfRateLimiters = {};
const syslogSilencedUserIDs = [];
let rateLimiterDefaultConfig = {};
let timerCounter = 0;

/**
 * 
 * @param {discord.Guild} guild 
 */
function findServer(guild) {
    for(const server of managedServers) {
        if(guild.id === server.id) {
            return server;
        }
    }
}

class UtilFactory {
    constructor() {
        this._extendPrototypes();
    }

    /** 
     * @returns {EmojiUtil | MessageUtil | RoleUtil | ConfigUtil | RatelimiterUtil}
     */
    createUtil() {
        const Util = this._combineClasses(
            EmojiUtil,
            MessageUtil,
            RoleUtil,
            ConfigUtil,
            RatelimiterUtil
        );

        return new Util();
    }

    _extendPrototypes() {
        /**
         * 
         * @param {string} word
         * @this Array
         */
        Array.prototype.listjoin = function(word) {
            if(this.length < 3)
                return this.join(` ${word} `);
            return `${this.slice(0, this.length - 1).join(', ')}, ${word} ${this[this.length - 1]}`;
        };
    }

    _combineClasses(...classes) {
        const result = function(...args){
            for (const clazz of classes) {
                Object.assign(this, new clazz(...args));
            }
        };
        for (const clazz of classes) {
            for (const method of Object.getOwnPropertyNames(clazz.prototype)) {
                if (method !== 'constructor') {
                    result.prototype[method] = clazz.prototype[method];
                }
            }
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
        for (const [realName, emote] of client.emojis) {
            if (emote.animated) {
                continue;
            }
    
            let name = realName;
            for (let i = 1; knownEmotes[name]; i++) {
                name = realName + i;
            }
    
            knownEmotes[name] = {
                id: emote.id,
                guildId: emote.guild.id,
                name: realName
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
            id: '',
            toString: () => {
                return '*could not find emoji*';
            }
        };
    }
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
     */
    log(msg, message) {
        const server = findServer(msg.guild);
        if (server.chans['syslog']) {
            return server.chans['syslog'].send(message);
        } else {
            return null; 
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
    setRateLimiterDefaultConfig(rlConfig) {
        rateLimiterDefaultConfig = rlConfig;
    }
    
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

        if (guild) {
            for (const servenBanType in banLists[guild.id]) {
                if (banLists[guild.id].hasOwnProperty(servenBanType)) {
                    if (!(banLists[guild.id][servenBanType].hasTokenSync(user.id))) {
                        throw new Error('banlist');
                    }
                }
            }
        }


        // Consume the tokens for each ratelimiter type, and test against abuse bucket
        try {
            await ratelimiterServer.abuse.hasToken(channelNamespace);
        } catch(e) {
            throw new Error(`[ratelimit] block abuse uid=${user.id} mid=${message.id}`);
        }

        try {
            await ratelimiterServer.server.consume(serverNamespace);
        } catch (e) {
            await this._printRateLimitError(message, 'server', ratelimiterServer);
            throw new Error(`[ratelimit] block server uid=${user.id} mid=${message.id}`);
        }
        
        try {
            await ratelimiterServer.channel.consume(serverNamespace);
        } catch (e) {
            await this._printRateLimitError(message, 'channel', ratelimiterServer);
            throw new Error(`[ratelimit] block channel uid=${user.id} mid=${message.id} chid=${message.channel.id}`);
        }
    }

    /**
     * 
     * @param {() => void} fn 
     * @param {number} time 
     */
    setSafeInterval(fn, time) {
        // Check for overflows
        if (time > 2147483647) {
            throw new Error('Potential misbehaving timer detected!');
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
