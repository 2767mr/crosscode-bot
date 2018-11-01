/**
 * 
 * @param {import('discord.js').Client} _
 * @param {typeof import('../discord-util.js')} util 
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = function(_, util) {
    const Mods = require('./mods.d/mods.js');
    const modsInfo = new Mods();

    return {
        get: util.createSendDynamic(() => '', () => (modsInfo.getMods() || util.createRichEmbed({
            title: 'Mods not Available'
        }))),
        installation: util.createSendRichEmbed('', {
            title: 'Installation guide',
            url: 'https://github.com/CCDirectLink/CCLoader/wiki/Install-mods'
        })
    };
};