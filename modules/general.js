module.exports = function(instance, util) {
    const splitter = new(require('grapheme-splitter'));
    const Discord = require("discord.js");
    const {
        getEmote,
        getAllEmotes,
        findMember,
        createRichEmbed,
        isFromAdmin,
        getCacheEmotesIds
    } = util;
    const {
        readFileSync
    } = require('fs');

    const StrawPoll = require('./general.d/strawpoll.js');

    ['Create', 'Delete', 'Update'].forEach(ev => instance.on('emoji' + ev, () => getAllEmotes(instance)));
    function boxGenerate(phrase, characterArray) {
        let maxMessageLength = 1960;
        let maxPhraseLength = phrase.length;
        let currentMessage = "";
        let messagePayloads = [];
        for (var i = 0, currCharLength = 0; i < characterArray.length; i++) {
            let substr = phrase.substring(currCharLength) + '\n';
            // currentLength + nextSubstring + newline char
            if (currentMessage.length + maxPhraseLength + 1 <= maxMessageLength) {
                currentMessage += substr;
            } else {
                messagePayloads.push(currentMessage);
                currentMessage = substr;
            }
            currCharLength += characterArray[i].length;
            maxPhraseLength -= characterArray[i].length;
        }
        messagePayloads.push(currentMessage);
        return messagePayloads;
    }

    let commands = {
        satoshi : function satoshiIs(msg) {
           msg.channel.send('is karoshi');
        },
        GFluegel: function gMordred(msg) {
            msg.channel.send(createRichEmbed({
                image: 'https://cdn.discordapp.com/emojis/441876583075151882.png?v=1'
            }));
        },
        poll: function createPoll(msg, args) {
            //let title = args.shift();
            /*let poll = new StrawPoll(title, args);
            poll.makeRequest()
                .then(function(response) {
                    console.log(response);
                }).catch(function(err) {
                    console.log(err);
                });*/

        },
        leaCheeseArmy: function angeryRaid(msg, args) {
            const charcap = 2000;

            // First, get the size of the rectangle
            let width = +args[0];
            let height = +args[1] || width;

            // Validate the arguments
            if (!width || !height)
                return;

            // get the emoji (so we can calculate the size)
            let emoji = getEmote(msg, 'leaCheeseAngry').toString();
            if (!emoji)
                return;

            // Now create the rectangle
            let army = ('\n' + emoji.repeat(width)).repeat(height);

            // Then, validate the char limit.
            if (army.length > charcap) {
                msg.reply("This message may be too long!");
                return;
            }

            msg.channel.send(`**You are being raided!${army}**`);
        },
        purge: function(msg, args) {
            let options = {
                limit: 100
            }
            if (!isNaN(args[0])) {
                options['after'] = args[0]
            }
            msg.channel.fetchMessages(options)
                .then(function(messages) {
                    return messages.filter(function(message) {
                        return message.author.id === instance.user.id;
                    });
                }).then(function(messages) {
                    let lastKey = messages.lastKey();
                    for (var message of messages) {
                        if (message[0] === lastKey) {
                            message[1].delete().then(function() {
                                console.log('Deleted the last few messages')
                            })
                        } else {
                            message[1].delete()
                        }
                    }
                })
        },
        ping: function(msg) {
            //this measures the time it took to get here
            let duration = Date.now() - msg.createdTimestamp;
            msg.reply(`>:) pew pew. Got here in ${duration} ms, and...`).then(function(msg) {
                //this measures the return trip time
                let newDuration = Date.now() - msg.createdTimestamp;
                msg.channel.send(`sent back in ${newDuration} ms`)
            })
        },
        box: function(msg, args) {
            if (msg.channel.name !== "spam")
                return;
            let phrase = args.join(' ').replace(/\n+/g, '\n');
            if(!phrase.length) return;
            let charLimit = 80;
            if (phrase.length > charLimit) {
                msg.reply(`Due to complaints by users, it has now been nerfed to max of ${charLimit} characters (emojis lengths vary). Sorry about that.`);
                return;
            }
            let arr = splitter.splitGraphemes(phrase);
            boxGenerate(phrase, arr).forEach(function(message) {
                msg.channel.send('```js\n' + message + '```');
            });
        },
        rbox: function randomBox(msg, args) {
            if (msg.channel.name !== "spam")
                return;
            let phrase = args.join(' ');
            let charLimit = 80;
            if (phrase.length > charLimit) {
                msg.reply(`Due to complaints by users, it has now been nerfed to max of ${charLimit} characters (emojis lengths vary). Sorry about that.`);
                return;
            }
            let arr = splitter.splitGraphemes(phrase).reverse();
            boxGenerate(arr.join(''), arr).forEach(function(message) {
                msg.channel.send('```js\n' + message + '```');
            });
        },
        setname: function setName(msg, args, command) {
            if (!isFromAdmin(msg))
                return;
            if (args.length < 2) {
                msg.reply("not enough arguments supplied.");
                return;
            }
            let oldName = args.shift()
            let member = findMember(msg, oldName)
            if (!member) {
                msg.reply(`could not find ${oldName}`)
                return;
            }
            member.setNickname(args.join(" ")).catch(function(error) {
                msg.reply(`${error}`)
            })
        },
        cloudlea: function showCloudLea(msg) {
            msg.channel.send('', createRichEmbed({
                image: 'https://images-ext-1.discordapp.net/external/C8ZfRnUDaIaHkZNgR6TP81kCEbc1YJrtsnG5J-TTSzM/https/cdn.discordapp.com/attachments/373163281755537420/380813466354843649/steam-cloud-600x368.png?width=500&height=307'
            }));
        },
        sleep: function sleep(msg) {
            if (isFromAdmin(msg)) {
                instance.destroy();
                process.exit(0);
            } else {
                msg.reply("You don't have the power to kill me!");
            }

        },
        hug: function hugUser(msg) {
            console.log('todo .cc -g hug')
        },
        language: function language(msg) {
            let image = createRichEmbed({
                image: 'https://cdn.discordapp.com/attachments/376138665954377728/381560390384877578/Javascript_DeathStareLea.gif'
            });
            msg.channel.send('', image)
        },
        hi: function greetUser(msg) {
            let emoji = getEmote(msg, 'leaCheese');
            let message = 'hi!!! ' + emoji;
            msg.channel.send(message);
        },
        bye: function farewellUser(msg) {
            let message = 'bye!!! ' + getEmote(msg, 'leaCheese');
            msg.channel.send(message);
        },
        bugs: function(msg) {
            msg.channel.send('', createRichEmbed({
                image: 'https://cdn.discordapp.com/attachments/380588134712475665/383705658731659266/tumblr_mtud5kX2T71r7fahjo1_250.gif'
            }))
        },
        BUG: function scareEmilie(msg) {
            msg.channel.send('', createRichEmbed({
                image: 'https://cdn.discordapp.com/attachments/286824914604916747/446126154303406080/emilieWhyyyyyyyy.gif'
            }));
        },
        say: function poorMansNitro(msg, args) {
            let delim = '/';
            let pieces = args.join(' ').split(delim);
            for (let i = 0; i < pieces.length - 1; i++) {

                let thonk = getEmote(msg, pieces[i]);
                if (thonk.id !== '') {
                    if (i > 0) {
                        pieces.splice(i - 1, 3, [pieces[i - 1], thonk, pieces[i + 1]].join(''));
                        i--;
                    }
                }

            }
            msg.channel.send(`*${msg.author} says:*\n${pieces.join(delim)}`);
            if (msg.deletable)
                msg.delete();
        },
        lewd: function noLewdLea(msg, args) {
            msg.react(getEmote(msg, "ohno").id);
        },
        popsicle: function popsicleLea(msg, args) {
            msg.channel.send(createRichEmbed({
                image: 'https://media.discordapp.net/attachments/397800800736378880/400833387725586434/unknown.png'
            }));
        },
        emote: function leaEmote(msg, args) {
            if(args.join(" ") === "emote_reset") {
              if(isFromAdmin(msg)) {
                getAllEmotes(instance);
                msg.channel.send('Emotes should be updated now');
              } else {
                msg.channel.send('You are not an admin.');
              }

              return;
            }
            let reply = '';
            for (let i = 0; i < args.length; i++) {
                let thonk = getEmote(msg, args[i]);
                if (thonk.id !== '')
                    reply += thonk + ' ';
            }
            if (reply !== '')
                msg.channel.send(reply);
        },
        lsemotes: function listEmotes(msg, args) {
            let em = getCacheEmotesIds(msg.guild.id);
            //lets add animated emotes
            em = em.concat(msg.guild.emojis.findAll('animated', true).map(function(emoji) {
                return emoji.name;
            }));
            var message = "\n";
            var count = 0;
            for (var i = 0; i < em.length; i++) {
                var thonk = getEmote(msg, em[i]);
                var emojiLine = em[i] + ' ' + thonk + '\n';
                if (message.length + emojiLine.length > 2000) {
                    msg.channel.send(message);
                    message = "\n";
                }
                message += emojiLine;
            }
            msg.channel.send(message);
        },
        react: async function leaReact(msg, args) {
            let i = 0;
            let channel = msg.channel;
            let originalMsg = msg;
            if(args[0].startsWith("chan=")) {
              channel = msg.guild.channels.find('name', args[0].replace("chan=", ""));
              if(!channel)
                return;
              args.shift();
            }
            if(args[0].startsWith("id=")) {
                try {
                  msg = await channel.fetchMessage(args[0].replace("id=", ""));
		            } catch(e) {
                   msg.reply(e);
                   return;
                }
                args.shift();
            }
            let emoteCount = 0;
            for (; i < args.length; i++) {
                let thonk = getEmote(msg, args[i]);
                if (thonk.id !== '') {
                  emoteCount++;
                  msg.react(thonk.id);
                }

            }
        },
        thinking: function think(msg) {
            let thonk = getEmote(msg, 'leaTHINK');
            //            console.log(thonk);
            msg.react(thonk.id);
        },
        CHEATER: function exposeCheater(msg, args, command) {
            let cheater = findMember(msg, args[0])
            if (cheater) {
                let apolloPoint = getEmote(msg, "apolloPoint");
                let apolloShout = getEmote(msg, "apolloShout");
                let message = `${cheater} ${apolloPoint}${apolloShout} I GOT YOU NOW!`
                msg.channel.send(message)
            } else {
                msg.reply('could not find the cheater.')
            }
        },
        triggered: function getTriggered(msg) {
            msg.channel.send(createRichEmbed({
                title: "...WHY?!?!",
                image: 'https://cdn.discordapp.com/attachments/374851126627008514/382063690557685760/Lea_triggered.gif'
            }))
        },
        verytriggered: function getMoreTriggered(msg) {
            msg.channel.send(createRichEmbed({
                title: "何？",
                image: "https://cdn.discordapp.com/attachments/381866628108910593/382331699213893632/triggeredlea.gif"
            }))
        },
        "HI!": function dealWithIt(msg, args, command) {
            msg.channel.send(createRichEmbed({
                image: 'https://cdn.discordapp.com/attachments/373163281755537420/381790329550143488/Deal_with_it_Lea.gif'
            }))
        },
        vote: async function vote(msg) {
            	var yes = getEmote(msg, 'leaHappy');
		var neutral = getEmote(msg, 'leaTHINK');
		var no = getEmote(msg, 'leaBAT');
		await msg.react(yes.id);
		await msg.react(neutral.id);
		await msg.react(no.id);
        },
        ohno: function ohNo(msg) {
            msg.channel.send(":(", createRichEmbed({
                image: "https://cdn.discordapp.com/emojis/400836365295812619.png"
            }))
        },
        work: function plsWork(msg) {
            msg.channel.send("...why?", createRichEmbed({
                image: "https://cdn.discordapp.com/emojis/337987528625881090.png"
            }))
        },
        balls: function blueBalls(msg) {
            msg.channel.send("BALLS", createRichEmbed({
                image: "https://cdn.discordapp.com/attachments/143364538958348288/368033879162093581/balls.png"
            }))
        },
        vrps: function blueVrps(msg) {
            msg.channel.send("VRPS", createRichEmbed({
                image: "https://cdn.discordapp.com/attachments/143364538958348288/409861255046889472/CC_SergayVRPs_062.gif"
            }))
        },
        get: function getGame(msg, args) {
            if (args[0] === "it") {
                msg.channel.send("", createRichEmbed({
                    title: "Steam link",
                    url: "http://store.steampowered.com/app/368340/"
                }));
            } else if (args[0] === "out") {

            }
        },
        thanks: function doThank(msg) {
            //make this a class :p
            let thankYouMessage = [
                "Keep up the good work!",
                "You guys are awesome."
            ];

            let nickname = msg.member.displayName;
            let chosenMessage = thankYouMessage.random();

            msg.channel.send('', createRichEmbed({
                description: `From ${nickname},\n\t${chosenMessage}\nTo,\n\t\tRadical Fish Games`
            }));
        },
        cube: function textCube(msg, args) {
            const MAXLEN = 2000;
            let str = args.join('').replace(/\s+/g, '').toUpperCase();
            if(str[0] !== str[str.length - 1])
                str = `*${str}*`;
            let string = splitter.splitGraphemes(str);
            if(string.length < 6) {
                msg.channel.send("Sorry, that string's too short!");
                return;
            }

            let lines = Math.floor(string.length / 8) + 1;
            let offset = Math.floor(string.length / (2 * lines));
            let height = string.length - 1;
            let depth = offset * lines;
            let size = depth + string.length;
            if(size * size * 2 > MAXLEN) {
                msg.channel.send("Phrase too long!");
                return;
            }

            let strings = [];
            for(let i=0; i<size; i++)
                strings.push(Array(size).fill(' '));
            for(let i=0; i<2; i++)
                for(let j=0; j<2; j++)
                    for(let k=0; k<=depth; k++)
                        strings[i * height + k]
                            [j * height + depth - k] = '/';
            for(let i=0; i<=lines; i++)
                for(let j=0; j<string.length; j++)
                    strings[i * offset + j][(lines - i) * offset] =
                    strings[i * offset][(lines - i) * offset + j] =
                    strings[i * offset + j][(lines - i) * offset + height] =
                    strings[i * offset + height][(lines - i) * offset + j] =
                        string[j];

            msg.channel.send('```\n' +
		strings.map(str => str.join(' ').replace(/\s+$/, '')).join('\n')
		+ '\n```');
        }
    }
    return commands;
};
