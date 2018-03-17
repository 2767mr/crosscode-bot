const { RichEmbed, MessageEmbed, GuildMember } = require('discord.js');
const { Config } = require('./config');

/** @type {Config} */
let config = undefined;

class Utils {
    /**
     * 
     * @param {Config} config 
     */
    static setConfig(conf) {
        config = conf;
    }

    /**
     * 
     * @param {*} opts
     * @returns {RichEmbed | MessageEmbed} 
     */
    static createRichEmbed(opts) {
        let richEmbed = new(RichEmbed || MessageEmbed);
        if (opts.fields) {
            let fields = opts.fields.concat([]);
            //to get the first 25 fields
            fields = fields.splice(0, 25);
            fields.forEach(function(field) {
                richEmbed.addField(field.name, field.value);
            });
        }

        if(opts.author) {
            if(opts.author.name) {
                richEmbed.setAuthor(opts.author.name, opts.author.icon, opts.author.url);
            } else {
                richEmbed.setAuthor(opts.author);
            }
        }

        opts.timestamp && richEmbed.setTimestamp(opts.timestamp);
        opts.description && richEmbed.setDescription(opts.description);
        opts.image && richEmbed.setImage(opts.image);
        opts.title && richEmbed.setTitle(opts.title);
        opts.url && richEmbed.setURL(opts.url);
        opts.footer && opts.footer.text && richEmbed.setFooter(opts.footer.text);
        return richEmbed;
    };

    /**
     * @param {GuildMember} user
     * @returns {boolean}
     */
    static isAdmin(user) {
        for(let server of config.servers) {
            if(user.guild.id === server.id) {
                return user.roles.has(server.admin);
            }
        }

        return true;
    }

    static getEmote(name) {
        //TODO
    }
}

exports.Utils = Utils;