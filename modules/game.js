/**
 * 
 * @param {import('discord.js').Client} _
 * @param {typeof import('../discord-util.js')} util 
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = (_, util) => {
    const Character = require('./game.d/character.js');
    const Match = require('./game.d/match.js');

    const characters = new Map();
    const matches = new Map();
    
    return {
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        add: async (msg, args) => {
            if (args[0] === 'character') {
                if (characters.has(msg.author.id)) {
                    await msg.reply('but you already have a character!');
                    return;
                }
                const name = args[1];
                if (Character.isValidName(name)) {
                    await msg.reply('not a valid name.');
                    return;
                }
                const className = Character.getClass(args[2]);
                if (!className) {
                    await msg.reply('not a valid class.');
                    return;
                }
                const newChar = new Character(name, className, msg.author);
                characters.set(msg.author.id, newChar);
                await msg.reply(`...!\nHere are your stats:\n${newChar.getStats()}`);
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        pvp: async (msg, args) => {
            const challenger = characters.get(msg.author.id);
            if (!challenger) {
                await msg.reply('you do not have a character.');
                return;
            }
            const member = util.findMember(msg, args[0]);
            if (!member) {
                msg.reply('could not find guild member.');
                return;
            }
            const target = characters.get(member.user.id);
            if (!target) {
                msg.reply('they do not have a character.');
                return;
            }
            if (target.isInPvp()) {
                return;
            }
            //this is just in case one or the other deals a finishing blow
            const newMatch = new Match(challenger, target, msg.channel);
            matches.set(msg.channel.id, newMatch);
            await msg.channel.send(`${challenger.getName()} is now fighting ${target.getName()}!`);
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        attack: async (msg, args) => {
            //should probably break up error checking..
            const activeMatch = matches.get(msg.channel.id);
            if (!activeMatch) {
                return;
            }
            const member = activeMatch.findPlayer(msg.author.id);
            if (!member) {
                return;
            }
            if (!activeMatch.isTurn(member)) {
                await msg.reply('it is not your turn.');
                return;
            }
            let target = util.findMember(msg, args[0]);
            if (!target) {
                return;
            }
            target = activeMatch.findPlayer(target.id);
            if (!target) {
                await msg.reply('target is not playing a pvp.');
                return;
            }
            activeMatch.attackSequence(target);
            if (activeMatch.hasWinner()) {
                activeMatch.endMatch();
                matches.delete(msg.channel.id);
                return;
            }
            activeMatch.nextTurn();
            await msg.reply(`It is now ${activeMatch.getTurnName()}`);
        },
        /**
         * @param {import('discord.js').Message} msg
         */
        stats: async (msg) => {
            const character = characters.get(msg.author.id);
            if (!character) {
                return;
            }
            await msg.channel.send(character.getStats());
        }
    };
};