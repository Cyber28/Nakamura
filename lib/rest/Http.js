const axios = require('axios')
const { API_URL } = require('../Constants')

module.exports = class Http {
    constructor(client) {
        this.client = client
        this.http = axios.create({
            baseURL: API_URL,
            headers: {
                'User-Agent': `DiscordBot (https://github.com/Cyber28/Nakamura, ${require('../../package.json').version})`,
                'Authorization': `Bot ${this.client.token}`
            }
        })
        this._timeout = null
        this._queue = []
    }

    // refer to https://www.npmjs.com/package/axios#request-config
    send(o) {
        //return this.http.request(o)
        return new Promise(async (resolve, reject) => {
            this._queue.push({ data: o, resolve: resolve, reject: reject })
            await this.check()
        })
    }

    async check() {
        console.log('checking yes')
        if (this._timeout) return
        this._timeout = null

        const curr = this._queue.shift()
        const r = await this.http.request(curr.data)
        if (r.headers['x-ratelimit-remaining'] === '1') {
            console.log('creating timeout yes')
            this._timeout = setTimeout(_ => {
                this.check()
            }, parseInt(r.headers['x-ratelimit-reset-after']))
        }
        curr.resolve(r.data)
    }
}