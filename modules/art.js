const fs = require('fs');
const FanArt = require('./art.d/crosscode-fanart.js');
const fanArt = new FanArt();

function getStreamArt() {
    const data = fs.readFileSync('stream.txt', 'utf8');
    return data.split('\n');
}

const streamArtLink = getStreamArt();

/**
 * 
 * @param {typeof import('discord.js')} _ 
 * @param {typeof import('../discord-util.js')} util 
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = (_, util) => {
    return {
        fromstream: (msg) => {
            const index = parseInt(Math.random() * streamArtLink.length);
            return util.sendRichEmbed(msg.channel, '', {
                description: 'Random stream art',
                image: streamArtLink[index]
            })
                .then()
                .catch((err) => {
                    console.log(`streamart error:\n${err}`);
                });
        },
        fromfan: (msg) => msg.channel.send('', fanArt.getRandomArt())
    };
};
