/**
 * @type {{[id: string]: import('discord.js').VoiceChannel}}
 */
const voiceChans = {};
const greetTracks = [
    'hi', 'hi-2', 'hi-3', 'haaaaii', 'haaaaii-2'
];
const leaveTracks = [
    'bye', 'bye-question'
];
const leaTracks = [
    'lea', 'lea-2', 'lea-3'
];

/**
 * 
 * @param {string[]} tracks 
 * @param {import('discord.js').VoiceChannel} vc 
 */
const playVoice = (tracks, vc) => vc.connection.playFile('./music/voice/' + tracks[Math.floor(Math.random()*tracks.length)] + '.ogg', {volume: 4});
/**
 * 
 * @param {import('discord.js').Client} instance
 */
module.exports = (instance) => {
    instance.on('voiceStateUpdate', (oldM, newM) => {
        const vc = voiceChans[newM.guild.id];
        if (!vc) return;
        if (!oldM.voiceChannel && newM.voiceChannel) {
            // Join
            if (newM.voiceChannelID === vc.id) {
                setTimeout(() => playVoice(greetTracks, vc), 500);
            }
        } else if (oldM.voiceChannel && !newM.voiceChannel){
            // Leave
            if (oldM.voiceChannelID === vc.id) {
                playVoice(leaveTracks, vc);
            }
        }
    });

    instance.on('message', (msg) => {
        if (
            msg.guild &&
            msg.isMentioned(instance.user) &&
            /wh?at(\s+i|')[sz]\s+y(ou|[ae])r?\s+nae?me?/i.test(msg.content) &&
            msg.member.voiceChannelID === voiceChans[msg.guild.id].id
        ) {
            playVoice(leaTracks, msg.member.voiceChannelID);
        }
    });

    return {
        /**
         * @param {import('discord.js').Message} msg
         */
        join: async (msg) => {
            if (!msg.guild) return;
            if (!msg.member.voiceChannel) {
                return await msg.reply('you aren\'t in a voice channel!');
            }
            if (voiceChans[msg.guild.id]) {
                return await msg.reply('I\'m already in a voice channel!');
            }

            try {
                await msg.member.voiceChannel.join();
                const vc = voiceChans[msg.guild.id] = msg.member.voiceChannel;
                console.log(vc);
                msg.reply('I joined.');

                setTimeout(() => playVoice(greetTracks, vc), 300);
            } catch (err) {
                msg.reply(`${err}`);
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        play: (msg, args) => {
            if (!msg.guild) return;
            const vc = voiceChans[msg.guild.id];
            if (!vc) {
                return msg.reply('I\'m not in a voice channel!');
            }
            if (msg.member.voiceChannelID !== vc.id) {
                return msg.reply('you\'re not in the voice channel I\'m in!');
            }
            const name = args.join(' ');
            if (name.startsWith('http')) {
                vc.connection.playFile(name);
                return msg.reply('am I playing music?');
            } else {
                try {
                    vc.connection.playFile('./music/' + name + '.mp3');
                    return msg.reply('am I playing music?');
                } catch (e) {
                    console.log(e);
                }
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        leave: (msg) => {
            if (!msg.guild) return;
            const vc = voiceChans[msg.guild.id];
            if (!vc) {
                return msg.reply('I\'m not in a voice channel!');
            }
            
            playVoice(leaveTracks, vc);
            setTimeout(() => {
                vc.leave();
                delete voiceChans[msg.guild.id];
                msg.reply('left the voice channel!');
            }, 1200);
        },
    };
};
