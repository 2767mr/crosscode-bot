/**
 * 
 * @param {import('discord.js').Client} instance
 * @param {typeof import('../discord-util.js')} util 
 * @param {*} config
 * @param {console} console
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = (instance, util, config, console) => {
    const TwitchStreams = require('./streams.d/crosscode-twitch-search.js');
    const streams = new TwitchStreams();

    const UPDATE_INTERVAL = 15 * 60 * 1000; //Update every 15 minutes

    const notify_channels = {};
    const oldStreamerIds = [];

    streams.init(console);

    instance.on('ready', () => {
        for (const roleServer of config['role-servers']) {
            const server = util.getFromName(instance.guilds, roleServer.name);
            const chans = roleServer['stream-chans'];
            if(!server || !Array.isArray(chans)) {
                return;
            }
            for (const name of chans) {
                const chan = util.getFromName(server.channels, name);
                if(chan) {
                    commands.set({channel: chan, guild: server});
                }
            }
        }
    });

    instance.on('channelDelete', (deletedChannel) => {
        for (const id in notify_channels) {
            const channel = notify_channels[id];

            if (channel && deletedChannel.id == channel.id) {
                delete notify_channels[id];
                return;
            }
        }
    });

    instance.on('guildDelete', () => {
        //TODO: check if it had an associated guild
    });

    instance.on('messageDelete', (messageDeleted) => {
        for (const id in notify_channels) {
            const channel = notify_channels[id];

            if (channel && channel.update_message &&
                channel.update_message.id == messageDeleted.id) {
                channel.update_message = null;
                return;
            }
        }
    });

    instance.on('messageDeleteBulk', (messagesDeleted) => {
        for (const id in notify_channels) {
            const channel = notify_channels[id];

            if (channel && channel.update_message &&
                messagesDeleted.has(channel.update_message.id)) {
                channel.update_message = null;
            }
        }
    });
    function updateIdsList(streamData) {
        oldStreamerIds.splice(0, oldStreamerIds.length);
        for(const [userId, streamInfo] of streamData) {
            oldStreamerIds.push(userId + '|' + streamInfo.start);
        }
    }
    function streamRichEmbedField(stream) {
        return {
            name : `${stream.title} by ${stream.user.display_name}`,
            value : `Stream language: ${stream.language}\n[Join Stream](https://www.twitch.tv/${stream.user.login})`
        };
    }

    util.setSafeInterval(async () => {
        const streamData = streams.getStreamers();
        if(streamData.size === 0)
            return;

        const fields = [];

        for(const [userId, streamInfo] of streamData) {
            if(oldStreamerIds.indexOf(userId + '|' + streamInfo.start) === -1)
                fields.push(streamRichEmbedField(streamInfo));
        }
        // no new streams
        if(fields.length === 0)
            return;

        const streamEmbed = util.createRichEmbed({
            title: 'CrossCode Twitch Streams',
            fields,
            timestamp: new Date()
        });

        for (const id in notify_channels) {
            const channel = notify_channels[id];
            if (channel) {

                const message = await channel.chan_handle.send('', streamEmbed);

                // Watch out for race conditions!
                if (notify_channels[id]) {
                    notify_channels[id].update_message = message;
                }
            }
        }
        updateIdsList(streamData);
    }, UPDATE_INTERVAL);

    const commands = {
        set: (msg) => {
            const chan_id = msg.channel.id;
            const notif_chan = notify_channels[chan_id + '|' + msg.guild.id] = notify_channels[chan_id] || {};
            notif_chan.chan_handle = msg.channel;
            notif_chan.update_message = null;
        },
        remove: (msg) => {
            const chan_id = msg.channel.id;
            delete notify_channels[chan_id + '|' + msg.guild.id];
            return msg.channel.send('This channel will no longer be notified of streams');
        }
    };
    return commands;
};
