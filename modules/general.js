/**
 * 
 * @param {import('discord.js').Client} instance
 * @param {typeof import('../discord-util.js')} util 
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = function(instance, util) {
    const GraphemeSplitter = require('grapheme-splitter');

    const splitter = new GraphemeSplitter();

    for (const ev of ['Create', 'Delete', 'Update']) {
        instance.on('emoji' + ev, () => util.getAllEmotes(instance));
    }

    /**
     * 
     * @param {string} phrase 
     * @param {string[]} characterArray 
     */
    function boxGenerate(phrase, characterArray) {
        const maxMessageLength = 1960;
        const messagePayloads = [];
        let maxPhraseLength = phrase.length;
        let currentMessage = '';
        let currCharLength = 0;
        for (const character of characterArray) {
            const substr = phrase.substring(currCharLength) + '\n';
            // currentLength + nextSubstring + newline char
            if (currentMessage.length + maxPhraseLength + 1 <= maxMessageLength) {
                currentMessage += substr;
            } else {
                messagePayloads.push(currentMessage);
                currentMessage = substr;
            }
            currCharLength += character.length;
            maxPhraseLength -= character.length;
        }
        messagePayloads.push(currentMessage);
        return messagePayloads;
    }

    return {
        hug: () => console.log('todo .cc -g hug'),
        lewd: (msg) => msg.react(util.getEmote(msg, 'ohno').id),
        thinking: (msg) => msg.react(util.getEmote(msg, 'leaTHINK').id),

        satoshi: util.createSend('is karoshi'),
        cloudlea: util.createSendRichEmbed('', {
            image: 'https://images-ext-1.discordapp.net/external/C8ZfRnUDaIaHkZNgR6TP81kCEbc1YJrtsnG5J-TTSzM/https/cdn.discordapp.com/attachments/373163281755537420/380813466354843649/steam-cloud-600x368.png?width=500&height=307'
        }),
        language: util.createSendRichEmbed('', {
            image: 'https://cdn.discordapp.com/attachments/376138665954377728/381560390384877578/Javascript_DeathStareLea.gif'
        }),
        hi: util.createSendDynamic((msg) => 'hi!!! ' + util.getEmote(msg, 'leaCheese')),
        bye: util.createSendDynamic((msg) => 'bye!!! ' + util.getEmote(msg, 'leaCheese')),
        bugs: util.createSendRichEmbed('', {
            image: 'https://cdn.discordapp.com/attachments/380588134712475665/383705658731659266/tumblr_mtud5kX2T71r7fahjo1_250.gif'
        }),
        BUG: util.createSendRichEmbed('', {
            image: 'https://cdn.discordapp.com/attachments/286824914604916747/446126154303406080/emilieWhyyyyyyyy.gif'
        }),
        popsicle: util.createSendRichEmbed('', {
            image: 'https://media.discordapp.net/attachments/397800800736378880/400833387725586434/unknown.png'
        }),
        triggered: util.createSendRichEmbed('', {
            title: '...WHY?!?!',
            image: 'https://cdn.discordapp.com/attachments/374851126627008514/382063690557685760/Lea_triggered.gif'
        }),
        verytriggered: util.createSendRichEmbed('', {
            title: '何？',
            image: 'https://cdn.discordapp.com/attachments/381866628108910593/382331699213893632/triggeredlea.gif'
        }),
        'HI!': util.createSendRichEmbed('', {
            image: 'https://cdn.discordapp.com/attachments/373163281755537420/381790329550143488/Deal_with_it_Lea.gif'
        }),
        ohno: util.createSendRichEmbed(':(', {
            image: 'https://cdn.discordapp.com/emojis/400836365295812619.png'
        }),
        work: util.createSendRichEmbed('...why?', {
            image: 'https://cdn.discordapp.com/emojis/337987528625881090.png'
        }),
        balls: util.createSendRichEmbed('BALLS', {
            image: 'https://cdn.discordapp.com/attachments/143364538958348288/368033879162093581/balls.png'
        }),
        vrps: util.createSendRichEmbed('VRPS', {
            image: 'https://cdn.discordapp.com/attachments/143364538958348288/409861255046889472/CC_SergayVRPs_062.gif'
        }),

        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        leaCheeseArmy: (msg, args) => {
            const charcap = 2000;

            // First, get the size of the rectangle
            const width = +args[0];
            const height = +args[1] || width;

            // Validate the arguments
            if (!width || !height)
                return;

            // get the emoji (so we can calculate the size)
            const emoji = util.getEmote(msg, 'leaCheeseAngry').toString();
            if (!emoji)
                return;

            // Now create the rectangle
            const army = ('\n' + emoji.repeat(width)).repeat(height);

            // Then, validate the char limit.
            if (army.length > charcap) {
                msg.reply('This message may be too long!');
                return;
            }

            msg.channel.send(`**You are being raided!${army}**`);
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        purge: (msg, args) => {
            const options = {
                limit: 100
            };
            if (!isNaN(args[0])) {
                options['after'] = args[0];
            }
            msg.channel.fetchMessages(options)
                .then((messages) => messages.filter((message) => {
                    return message.author.id === instance.user.id;
                }))
                .then((messages) => {
                    const lastKey = messages.lastKey();
                    for (const message of messages) {
                        if (message[0] === lastKey) {
                            message[1].delete()
                                .then(() => console.log('Deleted the last few messages'))
                                .catch(err => console.log(err));
                        } else {
                            message[1].delete()
                                .then()
                                .catch(err => console.log(err));
                        }
                    }
                });
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        ping: (msg) => {
            //this measures the time it took to get here
            const duration = Date.now() - msg.createdTimestamp;
            return msg.reply(`>:) pew pew. Got here in ${duration} ms, and...`)
                .then((msg) => {
                    //this measures the return trip time
                    const newDuration = Date.now() - msg.createdTimestamp;
                    return msg.channel.send(`sent back in ${newDuration} ms`);
                })
                .catch(err => console.log(err));
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        box: (msg, args) => {
            if (msg.channel.name !== 'spam')
                return;
            const phrase = args.join(' ').replace(/\n+/g, '\n');
            if(!phrase.length) return;
            const charLimit = 80;
            if (phrase.length > charLimit) {
                msg.reply(`Due to complaints by users, it has now been nerfed to max of ${charLimit} characters (emojis lengths vary). Sorry about that.`);
                return;
            }
            const arr = splitter.splitGraphemes(phrase);
            for (const message of boxGenerate(phrase, arr)) {
                msg.channel.send('```js\n' + message + '```');
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        rbox: (msg, args) => {
            if (msg.channel.name !== 'spam')
                return;
            const phrase = args.join(' ');
            const charLimit = 80;
            if (phrase.length > charLimit) {
                msg.reply(`Due to complaints by users, it has now been nerfed to max of ${charLimit} characters (emojis lengths vary). Sorry about that.`);
                return;
            }
            const arr = splitter.splitGraphemes(phrase).reverse();
            for (const message of boxGenerate(arr.join(''), arr)) {
                msg.channel.send('```js\n' + message + '```');
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        setname: (msg, args) => {
            if (!util.isFromAdmin(msg))
                return;
            if (args.length < 2) {
                msg.reply('not enough arguments supplied.');
                return;
            }
            const oldName = args.shift();
            const member = util.findMember(msg, oldName);
            if (!member) {
                msg.reply(`could not find ${oldName}`);
                return;
            }
            member.setNickname(args.join(' '))
                .then() 
                .catch((error) => {
                    msg.reply(`${error}`);
                });
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        sleep: (msg) => {
            if (util.isFromAdmin(msg)) {
                instance.destroy();
                process.exit(0);
            } else {
                msg.reply('You don\'t have the power to kill me!');
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        say: (msg, args) => {
            const delim = '/';
            const pieces = args.join(' ').split(delim);
            for (let i = 1; i < pieces.length - 1; i++) {
                const thonk = util.getEmote(msg, pieces[i]);
                if (thonk.id !== '') {
                    pieces.splice(i - 1, 3, [pieces[i - 1], thonk, pieces[i + 1]].join(''));
                    i--;
                }
            }
            msg.channel.send(`*${msg.author} says:*\n${pieces.join(delim)}`);
            if (msg.deletable)
                msg.delete();
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        emote: (msg, args) => {
            if(args.join(' ') === 'emote_reset') {
                if(util.isFromAdmin(msg)) {
                    util.getAllEmotes(instance);
                    msg.channel.send('Emotes should be updated now');
                } else {
                    msg.channel.send('You are not an admin.');
                }

                return;
            }
            let reply = '';
            for (const arg of args) {
                const thonk = util.getEmote(msg, arg);
                if (thonk.id !== '')
                    reply += thonk + ' ';
            }
            if (reply !== '')
                msg.channel.send(reply);
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        lsemotes: async (msg) => {
            const em = util.getCacheEmotesIds(msg.guild.id)
                //lets add animated emotes
                .concat(msg.guild.emojis.findAll('animated', true)
                    .map(emoji => emoji.name)
                );
            let message = '\n';
            for (const emote of em) {
                const thonk = util.getEmote(msg, emote);
                const emojiLine = em + ' ' + thonk + '\n';
                if (message.length + emojiLine.length > 2000) {
                    await msg.channel.send(message);
                    message = '\n';
                }
                message += emojiLine;
            }
            await msg.channel.send(message);
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        react: async (msg, args) => {
            let channel = msg.channel;

            for (const arg of args) {
                if(arg.startsWith('chan=')) {
                    channel = msg.guild.channels.find('name', arg.replace('chan=', '')) || channel;
                } else if(arg.startsWith('id=')) {
                    try {
                        msg = await channel.fetchMessage(arg.replace('id=', ''));
                    } catch(e) {
                        return await msg.reply(e);
                    }
                }
            }

            for (const arg of args) {
                const thonk = util.getEmote(msg, arg);
                if (thonk.id !== '') {
                    msg.react(thonk.id);
                }
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        CHEATER: (msg, args) => {
            const cheater = util.findMember(msg, args[0]);
            if (cheater) {
                const apolloPoint = util.getEmote(msg, 'apolloPoint');
                const apolloShout = util.getEmote(msg, 'apolloShout');
                const message = `${cheater} ${apolloPoint}${apolloShout} I GOT YOU NOW!`;
                return msg.channel.send(message);
            } else {
                return msg.reply('could not find the cheater.');
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        vote: async (msg) => {
            const yes = util.getEmote(msg, 'leaHappy');
            const neutral = util.getEmote(msg, 'leaTHINK');
            const no = util.getEmote(msg, 'leaBAT');
            await msg.react(yes.id);
            await msg.react(neutral.id);
            await msg.react(no.id);
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        get: (msg, args) => {
            if (args[0] === 'it') {
                return util.sendRichEmbed(msg.channel, '', {
                    title: 'Steam link',
                    url: 'http://store.steampowered.com/app/368340/'
                });
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        thanks: (msg) => {
            //make this a class :p
            const thankYouMessage = [
                'Keep up the good work!',
                'You guys are awesome.'
            ];

            const nickname = msg.member.displayName;
            const chosenMessage = thankYouMessage.random();

            return util.sendRichEmbed(msg.channel, '', {
                description: `From ${nickname},\n\t${chosenMessage}\nTo,\n\t\tRadical Fish Games`
            });
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        cube: (msg, args) => {
            const MAXLEN = 2000;
            let str = args.join('').replace(/\s+/g, '').toUpperCase();
            if(str[0] !== str[str.length - 1])
                str = `*${str}*`;

            const string = splitter.splitGraphemes(str);
            if(string.length < 6) {
                return msg.channel.send('Sorry, that string\'s too short!');
            }

            const lines = Math.floor(string.length / 8) + 1;
            const offset = Math.floor(string.length / (2 * lines));
            const height = string.length - 1;
            const depth = offset * lines;
            const size = depth + string.length;
            if(size ** 2 * 2 > MAXLEN) {
                msg.channel.send('Phrase too long!');
                return;
            }

            const strings = [];
            for(let i=0; i<size; i++)
                strings.push(Array(size).fill(' '));
            for(let i=0; i<2; i++)
                for(let j=0; j<2; j++)
                    for(let k=0; k<=depth; k++)
                        strings[i * height + k][j * height + depth - k] = '/';
            for(let i=0; i<=lines; i++)
                for(let j=0; j<string.length; j++)
                    strings[i * offset + j][(lines - i) * offset] =
                    strings[i * offset][(lines - i) * offset + j] =
                    strings[i * offset + j][(lines - i) * offset + height] =
                    strings[i * offset + height][(lines - i) * offset + j] =
                        string[j];

            return msg.channel.send('```\n' +
                strings.map(str => str.join(' ').replace(/\s+$/, ''))
                    .join('\n')
                + '\n```');
        }
    };
};
