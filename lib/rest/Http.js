const axios = require('axios')
const { API_URL } = require('../Constants')

/**
 * Internal class used for ratelimiting routes, etc.
 */
class Http {
    /**
     * @constructor
     * @param {Client} client - The client this belongs to
     */
    constructor(client) {
        this.client = client
        this.http = axios.create({
            baseURL: API_URL,
            headers: {
                'User-Agent': `DiscordBot (https://github.com/Cyber28/Nakamura, ${require('../../package.json').version})`,
                'Authorization': `Bot ${this.client.token}`
            }
        })
        this._busy = false
        this._queue = []
    }

    queueRequest(data) {
        return new Promise((resolve, reject) => {
            this._queue.push({ data, resolve, reject })
            this.handle()
        })
    }

    executeRequest(o) {
        this._busy = true
        return new Promise(resolve => {
            this.http.request(o.data).then(res => {
                if (res.headers['x-ratelimit-remaining'] === '0') {
                    this._queue.unshift(o)
                    setTimeout(_ => resolve(), res.headers['x-ratelimit-reset-after'] * 1000)
                    return
                }
                o.resolve(res.data)
                resolve()
            })
        })
    }

    handle() {
        if (this._busy || this._queue.length === 0) return
        this.executeRequest(this._queue.shift()).then(_ => {
            this._busy = false
            this.handle()
        })
    }
}

module.exports.Http = Http