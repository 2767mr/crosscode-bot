const rp = require('request-promise');

const util = require('./../../discord-util.js');

//update every hour
const timer = (1 * 3600 * 1000);
const url = 'https://raw.githubusercontent.com/CCDirectLink/CCModDB/master/mods.json';
const CCLoaderLink = 'https://github.com/CCDirectLink/CCLoader';
const CCModDB = 'https://github.com/CCDirectLink/CCModDB';

/**
 * A mod's information, as described by the DirectLink mods database (`mods.json`).
 * @typedef {{name: string, description: string, dir: ?{"any": string}, license: ?string, page: {name: string, url: string}[], archive_link: string, hash: {type: string}, version: string}} Mod
 */

module.exports = class Mods {
    constructor() {
        this.embed = null;

        this._getMods();
        setInterval(() => this._getMods(), timer);
    }

    /**
     * 
     * @param {Mod} mod 
     */
    createModFromString(mod) {
        const config = {
            name: `${mod.name} (${mod.version})`,
            value: mod.description
        };
        if (mod.license) {
            config.value += `\nLicense: ${mod.license}`;
        }
        for (const page of mod.page) {
            config.value += `\n[View on ${page.name}](${page.url})`;
        }
        return config;
    }
    getMods() {
        return this.embed;
    }

    async _getMods() {
        //get the static data
        const response = JSON.parse(await rp({
            uri: url,
            headers: {
                'User-Agent': 'crosscodebot'
            }
        }));

        const embed = {
            title: 'Verified Mods',
            fields: []
        };

        for (const githubName in response.mods) {
            const mod = response.mods[githubName];
            if (embed.fields.length <= 25) {
                embed.fields.push(this.createModFromString(mod));
            } else {
                embed.fields.push({});
            }
        }
        if (embed.fields.length > 25)
            embed.description = `Showing 25 out of ${embed.fields.length} mods.`;
        else
            embed.description = 'Showing all mods.';
        embed.description += `\nNote: All mods require [CCLoader](${CCLoaderLink}) to work.`;
        embed.timestamp = new Date();
        embed.footer = {
            text: `From [CCModDB](${CCModDB})`
        };
        this.embed = util.createRichEmbed(embed);
    }
};
