const Discord = require('discord.js');

let knownEmotes = {};

exports.getAllEmotes = function(client) {
    client.emojis.array().forEach(function(emote) {
        var name = emote.name;
        for (var i = 1; knownEmotes[name]; i++) {
            name = emote.name + i;
        }
        knownEmotes[name] = {
            id: emote.id,
            name: emote.name
        };
    });
};

exports.getCacheEmotesIds = function() {
    return Object.keys(knownEmotes);
};

function filterUserId(id) {
    return id.replace(/[^0-9]/g, "");
}

function isId(id) {
    return (id.startsWith("<@") || id.startsWith("<@!")) && id.endsWith(">")
}

exports.getEmote = function(name) {
    let emote = knownEmotes[name];
    if (emote.id !== undefined) {
        return {
            id: emote.id,
            toString: function() {
                return `<:${emote.name}:${emote.id}>`;
            }
        };
    }
    console.log(`Warning: unknown emoji ${name}`);
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

exports.isFromAdmin = function(msg) {
    let adminPosition = msg.member.guild.roles.size - 1;
    return msg.member.highestRole.position === adminPosition;
};