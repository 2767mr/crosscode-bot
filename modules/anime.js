/**
 * 
 * @param {typeof import('discord.js')} _ 
 * @param {typeof import('../discord-util.js')} util 
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = (_, util) => {
    return {
        'EXPLOSION!': util.createSendRichEmbed('💥', {
            image: 'https://cdn.discordapp.com/attachments/380588134712475665/383777401529696256/tenor.gif'
        })
    };
};