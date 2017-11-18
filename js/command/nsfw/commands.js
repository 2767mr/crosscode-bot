let nsfwCommands = function() {
    const Discord = require("discord.js");
    let {
        findMember
    } = require('./../../discord-util.js')
    return {
        lewd: function showLewdArt(msg, command) {
            if (nsfwCommands.error(msg, command))
                return;
            let image = new(Discord.RichEmbed || Discord.MessageEmbed);
            image.setDescription("( ͡° ͜ʖ ͡°)")
            image.setImage('https://images-ext-1.discordapp.net/external/RNdA2IorjgoHeslQ9Rh8oos1nkK56Y6_w4sjUaFVBC4/https/image.ibb.co/jJLNiG/leadaki.png?width=185&height=250')
            msg.channel.send('', image)
        },
        error: function error(msg, command) {
            if (!msg.channel.nsfw) {
                msg.reply("this channel is sfw. Please try again in a nsfw channel")
                return true;
            } else if (!nsfwCommands[command]) {
                msg.reply(`...? -> ${command}`)
                return true;
            }
        },
        addme: function addMember(msg, command) {
            let nsfwRole = msg.guild.roles.find("name", "NSFW")
            msg.member.addRole(nsfwRole).then(function() {
                msg.channel.send("You are now a NSFW member! Congrats!")
            }).catch(function(e) {
                msg.reply(`${e}`)
            })

        },
        adduser: function addMember(msg, command, args, console) {
            let nsfwRole = msg.guild.roles.find("name", "NSFW")
            let target = findMember(msg, args[0])
            target.addRole(nsfwRole).then(function(result) {
                msg.channel.send(`${target.user.username} is now a NSFW member!`)
            }).catch(function(error) {
                msg.channel.send(`${error}`)
            })

        },
        "language": function nani(msg) {
            let image = new(Discord.RichEmbed || Discord.MessageEmbed)
            image.setImage('https://crosscode.gamepedia.com/media/crosscode.gamepedia.com/thumb/a/a8/Javascript.png/1200px-Javascript.png?version=b86bd949c87fff5ccf1480ec0038508a')
            msg.channel.send('', image)
        },
        removeuser: function removeMember(msg, command, args) {
            let nsfwRole = msg.guild.roles.find("name", "NSFW")
            let target = findMember(msg, args[0])
            target.removeRole(nsfwRole).then(function(result) {
                msg.channel.send(`${target.user.username} has been removed from NSFW role!`)
            }).catch(function(error) {
                msg.channel.send(`${error}`)
            })
        }
    };
}()
module.exports = nsfwCommands
