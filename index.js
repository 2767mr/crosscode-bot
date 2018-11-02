const discord = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');

const util = require('./discord-util.js');

const client = new discord.Client();

class Bot {
    constructor() {
        this._extendPrototypes();

        this._loadEnv();
        this._loadConfig();

        this._setExitHandler();
    }

    start() {
        this._registerHandlers();
        
        return client.login(process.env.BOT_TOKEN);
    }

    _loadEnv() {
        if(!process.env.BOT_PREFIX) {
            const env = fs.readFileSync('.env', 'utf8').split('\n');
            for (const element of env) {
                if(!element) {
                    return;
                }
                const token = element.trim().split('=');
                process.env[token[0]] = token[1];
            }
        }
    }

    _loadConfig() {
        this.prefix = process.env.BOT_PREFIX;
        this.configuration = Object.freeze(JSON.parse(fs.readFileSync('./config.json')));
        this.servers = this.configuration['role-servers'];

        this._loadModules();
        this._loadActivities();
        
        util.setRateLimiterDefaultConfig(this.configuration['ratelimit-defaults']);
    }

    _loadModules() {
        const cmdTypes = ["roles"];
        const commands = {};
        const helpText = {};

        for (const type of cmdTypes) {
            commands[type] = require(`./modules/${type}.js`)(client, util, this.configuration, console);
            //TODO: Add help text for each function
            helpText[type] = fs.readFileSync(`./help/${type}.txt`).toString();
        }

        this.commands = Object.freeze(commands);
        this.helpText = Object.freeze(helpText);
    }

    _loadActivities() {
        const activities = [];

        for(const activity of this.configuration.activities)
        {
            activity.type = this.configuration['activity-types'].indexOf(activity.type);
            activities.push(activity);
        }

        this.activities = Object.freeze(activities);
    }

    _setExitHandler() {
        function EXIT_HANDLER() {
            try {
                if (client) client.destroy();
                process.exit();
            } catch(e) {
                console.error(e);
            }
        }

        process.on('exit', EXIT_HANDLER.bind(null));    // Normal exit
        process.on('SIGINT', EXIT_HANDLER.bind(null));  // Ctrl+C
        process.on('SIGUSR1', EXIT_HANDLER.bind(null, {exit:true})); // Common supervisor signals
        process.on('SIGUSR2', EXIT_HANDLER.bind(null, {exit:true}));
        process.on('uncaughtException', EXIT_HANDLER.bind(null, {exit:true})); // Exceptions
    }

    _extendPrototypes() {
        Array.prototype.random = Array.prototype.random || function() {
            return this[parseInt(Math.random() * this.length)];
        };
    }
    
    _onCountDown() {
        const ran = this.activities.random();
        client.user.setPresence({
            game: ran
        });
    }

    _registerHandlers() {
        client.on('ready', () => this._onReady());
        client.on('guildMemberAdd', (member) => this._onGuildMemberAdd(member));
        client.on('guildMemberRemove', (member) => this._onGuildMemberRemove(member));
        client.on('messageUpdate', (oldMsg, newMsg) => this._onMessageUpdate(oldMsg, newMsg));
        client.on('messageDelete', (msg) => this._onMessageDelete(msg));
        client.on('message', (msg) => this._onMessage(msg));
        client.on('error', err => console.error(err));
    }

    _onReady() {
        this.managedServers = util.getAllServers(client, this.servers, console);

        util.setupSelfRateLimiters(this.configuration['self-ratelimit']);
        util.setupDMRatelimiter(this.configuration['ratelimit-defaults']);
        util.getAllEmotes(client);

        console.log(`Logged in as ${client.user.tag}!`);

        this._onCountDown();
        //util.setSafeInterval(() => this._onCountDown(), SAFE_INTERVAL);
    }

    /**
     * 
     * @param {discord.GuildMember} member 
     */
    _onGuildMemberAdd(member) {
        for (const server of this.managedServers) {
            if (member.guild.id === server.id) {
                if (server.pending.length) {
                    //newMember.addRoles(serv.pending).catch(console.log);
                    //serv.chans.syslog.send(`Added ${serv.pending[0].name} role to ${newMember}`);
                }
                const newGreet = util.greetingsParse(member.guild, server.greet);
                if (server.chans.greet) {
                    server.chans.greet.send(`${member}, ${newGreet}`);
                }
                break;
            }
        }
    }

    /**
     * 
     * @param {discord.GuildMember} member 
     */
    _onGuildMemberRemove(member) {
        for (const server of this.managedServers) {
            if (member.guild.id === server.id) {
                if(!server.chans.editlog)
                    break;

                server.chans.editlog.send(`Member left the server: ${member}`, 
                    util.createRichEmbed({
                        fields: [{
                            name: 'Had roles',
                            value: member.roles.array().join('\r\n')
                        }]
                    }))
                    .catch(err => console.log(err));
    
                break;
            }
        }
    }
    
    /**
     * 
     * @param {discord.Message} oldMsg 
     * @param {discord.Message} newMsg 
     */
    _onMessageUpdate(oldMsg, newMsg) {
        const author = oldMsg.author;
        if(author.bot || oldMsg.content == newMsg.content)
            return;

        for (const server of this.managedServers) {
            if (oldMsg.guild.id === server.id) {
                if(!server.chans.editlog)
                    break;

                server.chans.editlog.send(`Member updated message in ${oldMsg.channel}: ${author}`, 
                    util.createRichEmbed({
                        fields: [
                            { name: 'From', value: oldMsg.content },
                            { name: 'To', value: newMsg.content }
                        ]
                    }))
                    .catch(console.log);
                break;
            }
        }
    }

    /**
     * 
     * @param {discord.Message} msg 
     */
    _onMessageDelete(msg) {
        const author = msg.author;
        if(author.bot)
            return;
        for (const server of this.managedServers) {
            if (msg.guild.id === server.id) {
                if(!server.chans.editlog)
                    break;
    
                server.chans.editlog.send(`A message was deleted in ${msg.channel}: ${author}`,
                    util.createRichEmbed({
                        fields: [{
                            name: 'Content', 
                            value: msg.content 
                        }]
                    }))
                    .catch(console.log);
                break;
            }
        }
    }

    /**
     * 
     * @param {discord.Message} msg 
     */
    _onMessage(msg) {
        this._onMessageAsync(msg)
            .then()
            .catch(err => console.log(err));
    }

    _onError() {
        //TODO
    }
    
    /**
     * 
     * @param {discord.Message} msg
     * @returns {Promise<void>} 
     */
    async _onMessageAsync(msg) {
        if (await this._checkForMemes(msg)) {
            return;
        }
        if (await this._checkForMedia(msg)) {
            return;
        }
        
        //Allow for new line parsing
        const message = this._trimMessage(msg);
        const args = util.argParse(message);
        const _prefix = args.shift();
        if (!_prefix.startsWith(this.prefix)) {
            return;
        }

        const { func, command } = this._getHandler(msg, args);
        if (func) {
            await this._executeHandler(func, msg, args, command, console);
        }
    }

    /**
     * 
     * @param {discord.Message} msg
     */
    _trimMessage(msg) {
        return msg.content.replace(/<@!?(.*?)>/g,'') // Remove mentions
            .replace(/^\s+|\s+$/g, '');
    }

    /**
     * 
     * @param {(msg: discord.Message, args: string[], command: string, console: console) => void} func 
     * @param {discord.Message} msg 
     * @param {string[]} args 
     * @param {string} command 
     * @param {console} console 
     */
    async _executeHandler(func, msg, args, command, console) {
        await util.consumeRateLimitToken(msg);
        try {
            await func(msg, args, command, console); //Await in case it is async
        } catch (err) {
            if (err && err != 'banlist') {
                console.log(err);
            }
        }
    }

    /**
     * 
     * @param {discord.Message} msg 
     * @param {string[]} args
     * @returns {{func: () => void, command: string}}
     */
    _getHandler(msg, args) {
        let type = this.configuration['default-module'];
        if (args[0] && args[0].startsWith('-')) {
            type = args[0].substring(1);
            if (!this.commands[type]) {
                this._onError(msg);
                return;
            }
            args.shift();
        }

        const command = args.shift();
        if (command === 'help') {
            return { func: () => msg.author.send(util.formatHelpText(this._prefix + ' ', this.helpText[type])), command};
        }

        return { func: this.commands[type][command], command };
    }

    /**
     * 
     * @param {discord.Message} msg
     * @returns {Promise<boolean>} 
     */
    async _checkForMemes(msg) {
        if (msg.content.toLowerCase().startsWith('failed to load')) {
            await util.consumeRateLimitToken(msg);
            await msg.channel.send('oof');
            return true;
        }
        return false;
    }
    
    /**
     * 
     * @param {discord.Message} msg
     * @returns {Promise<boolean>} 
     */
    async _checkForMedia(msg) {
        // Get stream drawings links automatically
        if (msg.channel.name === 'media') {
            const ccChan = util.getFromName(msg.guild.channels, '^crosscode$');
            if (ccChan) {
                const url = this._getJPGUrl(msg.content);
                if(!url)
                    return false;
                if(url.includes('dropbox')) {
                    // this will auto redirect to raw location
                    const res = await fetch(url);
                    ccChan.send(`<@!208763015657553921>! Add this url to stream drawings. ${res.url}`);
                } else if(url.includes('drive.google.com')) {
                    const directLink = await this._getDriveFileDirLink(url);
                    ccChan.send(`<@!208763015657553921>! Add this url to stream drawings. ${directLink}`);
                }
            }
    
            return true;
        }
        return false;
    }

    /**
     * 
     * @param {discord.Message} msg
     */
    _getJPGUrl(msg) {
        const regexfileURL = /(?:JPG:\s?)(.*)/;
        if(regexfileURL.test(msg)) {
            return msg.match(regexfileURL)[1];
        }
        return '';
    }
    
    /**
     * 
     * @param {string} url 
     * @returns {Promise<string>}
     */
    async getDriveFileDirLink(url) {
        const regexfileID = /\/d\/(.*?)\//;

        const fileID = url.match(regexfileID)[1];
        const response = await fetch(`https://drive.google.com/uc?id=${fileID}`);
        return response.url;
    }
}

process.on('unhandledRejection', (error) => {
    console.error(error);
});

const bot = new Bot();
bot.start()
    .then()
    .catch(err => console.error(err));