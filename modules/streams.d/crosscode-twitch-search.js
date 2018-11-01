const rp = require('request-promise');

module.exports = class CrossCodeStream {
    constructor() {
        /** @type {Map<string, {title: string, user: { id: string, display_name: string, login: string }, start: string, language: string}>} */
        this.ccStreamers = new Map();
        /** @type {string} */
        this.gameId = undefined;
    }
    async init() {
        await this._getGameId();
        this._updateList();
        // updates every 2 minutes
        setInterval(() => this._updateList(), (1 * 2 * 60 * 1000));
    }

    getStreamers() {
        return this.ccStreamers;
    }

    /**
     * 
     * @param {string[]} idsArr 
     * @returns {string}
     */
    _createIdStream(idsArr) {
        return JSON.parse(JSON.stringify(idsArr))
            .map((id) => `id=${id}`)
            .join('&');
    }

    async _updateList() {
        if (!this.gameId) {
            console.error('Could not find Game Id.');
            return;
        }
        const streamData = await this._getStreams();
        if(!streamData.length)
            return;

        const streamerIds = streamData.map((streamer) => streamer.user_id);
        const users = await this._getTwitchUsersByIds(streamerIds);

        this.ccStreamers = new Map();
        for (const [index, user] of users.entries()) {
            const stream = streamData[index];
            const streamObject = {
                title : stream.title,
                user : {
                    id : user.id,
                    display_name : user.display_name,
                    login : user.login,
                },
                start : stream.started_at,
                language : stream.language
            };
            this.ccStreamers.set(user.id, streamObject);
        }
    }
    async _getGameId() {
        const {data} = await this._makeRequest({
            uri: 'https://api.twitch.tv/helix/games?name=CrossCode'
        });
        this.gameId = data[0].id;
        return;
    }

    /**
     * @returns {Promise<{user_id: string, title: string, started_at: string, language: string}[]>}
     */
    async _getStreams() {
        const response = await this._makeRequest({
            uri: `https://api.twitch.tv/helix/streams?type=live&game_id=${this.gameId}`
        });
        return response.data;
    }

    /**
     * 
     * @param {string[]} ids 
     * @returns {Promise<{id: string, login: string, display_name: string}[]>}
     */
    async _getTwitchUsersByIds(ids) {
        const idsList = this._createIdStream(ids);
        const response = await this._makeRequest({
            uri: `https://api.twitch.tv/helix/users?${idsList}`
        });
        return response.data;
    }
    

    _makeRequest(opts) {
        return rp({
            ...opts,
            headers: {
                ...opts.headers,
                'Client-ID': process.env.TWITCH_CLIENT_ID
            },
            json: true
        });
    }
};