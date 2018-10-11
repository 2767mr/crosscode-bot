/**
 * 
 * @param {import('discord.js').Client} _
 * @param {typeof import('../discord-util.js')} util 
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = function(instance, util) {
    async function error(msg) {
        if (!msg.channel.nsfw) {
            await msg.reply('this channel is sfw. Please try again in a nsfw channel');
            return true;
        }
        return false;
    }

    return {
        lewd: async (msg, args, command) => {
            if (await error(msg, command))
                return;
            
            return await util.sendRichEmbed('', {
                description: '( ͡° ͜ʖ ͡°)',
                image: 'https://images-ext-1.discordapp.net/external/RNdA2IorjgoHeslQ9Rh8oos1nkK56Y6_w4sjUaFVBC4/https/image.ibb.co/jJLNiG/leadaki.png?width=185&height=250'
            });
        },
    };
};