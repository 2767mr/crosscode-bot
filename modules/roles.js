/**
 * 
 * @param {import('discord.js').Client} client
 * @param {typeof import('../discord-util.js')} util 
 * @param {*} config
 * @param {console} console
 * @returns {{[name: string]: ((msg: discord.Message, args: string[], command: string, console: console) => Promise}}
 */
module.exports = (client, util, config, console) => {
    /**
     * 
     * @param {import('discord.js').Role[]} roles
     * @param {string[]} args 
     */
    function fetchRoles(roles, args) {
        const bl = util.getRoleBlacklist();
        const wl = util.getRoleWhitelist();
        
        return args
            .map(arg => util.getFromName(roles, arg))
            .filter(role => role && wl.indexOf(role.id) > -1 && bl.indexOf(role.id) == -1);
    }
    /**
     * @param {import('discord.js').Role[]} roles
     */
    function getRoleNames(roles) {
        return roles.map((element) => {
            if (element.name.indexOf('@') == 0)
                return element.name.substring(1);
            return element.name;
        });
    }

    /**
    * Removes roles not pertaining to set `set` from Discord user `user`
    * and role array **reference** `rolesToAdd_Ref`
    * @param {import('discord.js').GuildMember} user - User to remove roles from
    * @param {import('discord.js').Role[]} rolesToAdd_Ref - Reference to role array to
    *                                           remove roles from
    * @param {Set<import('discord.js').Role>} set - Set that defines which roles will be removed
    */
    async function removeOtherRolesFromSet(user, rolesToAdd_Ref, set) {
        for (let i = 0; i < rolesToAdd_Ref.length; i++) {
            if (set.has(rolesToAdd_Ref[i].id)) {
                rolesToAdd_Ref.splice(i, 1);
                i--;
            }
        }

        for (const role of user.roles) {
            if (set.has(role.id)) {
                await user.removeRole(role);
            }
        }
    }
    return {
        /**
         * @param {import('discord.js').Message} msg
         */
        countMembers: (msg) => msg.channel.send(`There are ${msg.guild.members.size} members.`),
        /**
         * @param {import('discord.js').Message} msg
         */
        get: (msg) => msg.channel.send('```\n' + getRoleNames(msg.guild.roles).join('\n') + '```'),
        /**
         * @param {import('discord.js').Message} msg
         */
        update: (msg) => {
            if (util.isFromAdmin(msg)) {
                util.updateServers(client, console);
                console.log('Updated servers');
                return msg.channel.send('Updated successfully');
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        add: async (msg, args) => {
            const guild = msg.guild;
            const member = msg.mentions.members.first() || msg.member;
            
            if (member == null) {
                return await msg.reply('You might be trying this from invisble status or from DMs. Try again, please!');
            }

            console.log('User ' + msg.author.id +
                ' executed add role with arguments: [' + args + ']');

            // users were mentioned
            if (msg.mentions.members.size
                && !util.isFromAdmin(msg)) {
                return await msg.reply('You are not an admin');
            }

            const roles = fetchRoles(msg.guild.roles, args.join(' ').split(','));

            if (roles.length > 0 && !util.hasRoles('auto-role', guild, member, console)) {
                const autoRoles = util.getRoles('auto-role', guild);
                for (const role of autoRoles) {
                    roles.push(role);
                }
            }

            const newRoles = roles.filter(role => !member.roles.has(role.id));
            const dupRoles = member.roles.filterArray(role => roles.indexOf(role) > -1);

            if (newRoles.length === 0) {
                return await msg.channel.send('Could not add any new roles.');
            }

            // Find inputted roles within existing exclusivity sets,
            // and remove the other roles from each set from the users' roles.
            const exclusiveSets = util.getRoles('exclusiveSets', guild);
            for (const role of roles) {
                if (exclusiveSets[role.id]) {
                    await removeOtherRolesFromSet(member, roles, exclusiveSets[role.id]);
                    break;
                }
            }

            try {
                await member.addRoles(newRoles);
            } catch (e) {
                console.log(e);
                return await msg.channel.send('There was an error adding a role.');
            }
        
            if (newRoles.length) {
                const newRolesName = getRoleNames(roles).listjoin('and');
                await util.log(msg, `Added ${newRolesName} to ${member}`);
                const dupRolesName = getRoleNames(dupRoles).listjoin('and');
                let retMessage = `${member} is now ${newRolesName}.`;
                if (dupRoles.length) {
                    retMessage += `\nAlready had ${dupRolesName}`;
                }
                msg.channel.send(retMessage);
            }
        },
        /**
         * @param {import('discord.js').Message} msg
         * @param {string[]} args
         */
        rm: async (msg, args) => {
            const member = msg.mentions.members.first() || msg.member;

            console.log('User ' + msg.author.id +
                ' executed rm role with arguments: [' + args + ']');

            // users were mentioned
            if (msg.mentions.members.size
                && !util.isFromAdmin(msg)) {
                return await msg.reply('You are not an admin');
            }
            const roles = fetchRoles(msg.guild.roles, args.join(' ').split(','));
            if (roles) {
                try{
                    await member.removeRoles(roles);
                } catch (e) {
                    console.log(e);
                    return await msg.channel.send('Encountered an error. Could not remove role.');
                }
                const oldRoles = getRoleNames(roles).listjoin('or');
                await msg.channel.send(`${member} is no longer ${oldRoles}`);
                await util.log(msg, `Removed ${oldRoles} from ${member}`);
            }
        }
    };
};
