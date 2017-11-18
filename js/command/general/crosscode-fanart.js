let parser = new(require('xmldom').DOMParser);
let rp = require('request-promise');
//name, link, image url
let {
    createRichEmbed
} = require('./../../discord-util.js');
class CrossCodeFanArt {
    constructor() {
        let url = 'http://backend.deviantart.com/rss.xml?q=boost%3Apopular+in%3Afanart+crosscode&type=deviation'
        this.images = []
        this.defaultImage = createRichEmbed({
            title: "No art found"
        });
        let _instance = this
        rp({
            uri: url,
            headers: {
                'User-Agent': 'crosscodebot'
            }
        }).then(function(response) {
            let fanart_xml = parser.parseFromString(response, 'text/xml');
            let fanart_items = fanart_xml.getElementsByTagName('item')
            for (let index = 0; index < fanart_items.length; index++) {
                let fan_item = fanart_items.item(index)
                let title = fan_item.getElementsByTagName("title")[0].textContent
                let author = fan_item.getElementsByTagName("media:credit")[0].textContent
                let postLink = fan_item.getElementsByTagName("link")[0].textContent
                let link = fan_item.getElementsByTagName("media:content")[0].getAttribute("url")
                _instance.images.push(createRichEmbed({
                    title: `${title} - by ${author}`,
                    description: postLink,
                    image: link
                }));
            }
        });
    }
    getRandomArt() {
        let index = parseInt(Math.random() * this.images.length);
        return this.images[index] || this.defaultImage;
    }
}
module.exports = CrossCodeFanArt
