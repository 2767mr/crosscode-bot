const { DOMParser } = require('xmldom');
const rp = require('request-promise');
const fs = require('fs');

const util = require('./../../discord-util.js');

const url = 'http://backend.deviantart.com/rss.xml?q=boost%3Apopular+in%3Afanart+crosscode&type=deviation';

const parser = new DOMParser();

//name, link, image url
class CrossCodeFanArt {
    constructor() {
        this.images = [];
        this.defaultImage = util.createRichEmbed({
            title: 'No art found'
        });

        const otherFanArt = JSON.parse(fs.readFileSync('./modules/art.d/other-fanart.json', 'utf8'));
        for (const src in otherFanArt) {
            for (const element of otherFanArt[src]) {
                this.addFanArt(element);
            }
        }

        this._loadDeviantart();
    }
    addFanArt(opts) {
        if (opts.type === 'twitter') {
            this.images.push(util.createRichEmbed({
                title: 'Fan art',
                description: `[Artist twitter link](${opts.user_link})\n\n[View on Twitter](${opts.link})`,
                image: opts.image_url,
                url: opts.twitter_link
            }));
        } else if (opts.type === 'discord') {
            this.images.push(util.createRichEmbed({
                title: 'Fan art',
                description: opts.description,
                image: opts.image_url
            }));
        } else if (opts.type === 'deviant') {
            this.images.push(util.createRichEmbed({
                title: 'Fan art',
                description: opts.description,
                url: opts.user_link,
                image: opts.image_url
            }));
        }
        /*let title = opts.title || 'Fan Art';
        let description = opts.description || `Made by [${opts.author}](${opts.link})`;
        let image = opts.image_url;
        this.images.push(createRichEmbed({
            title: title,
            description: description,
            image: image
        }));*/
    }
    getRandomArt() {
        const index = parseInt(Math.random() * this.images.length);
        return this.images[index] || this.defaultImage;
    }

    async _loadDeviantart() {
        const response = await rp({
            uri: url,
            headers: {
                'User-Agent': 'crosscodebot'
            }
        });

        const fanart_xml = parser.parseFromString(response, 'text/xml');
        const fanart_items = fanart_xml.getElementsByTagName('item');
        for (const fan_item of fanart_items) {
            const title = fan_item.getElementsByTagName('title')[0].textContent;
            const author = fan_item.getElementsByTagName('media:credit')[0].textContent;
            const postLink = fan_item.getElementsByTagName('link')[0].textContent;
            const link = fan_item.getElementsByTagName('media:content')[0].getAttribute('url');

            this.images.push(util.createRichEmbed({
                title: `${title} - by ${author}`,
                description: postLink,
                image: link
            }));
        }
    }
}
module.exports = CrossCodeFanArt;