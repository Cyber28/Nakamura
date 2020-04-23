const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http')

module.exports = class Client extends EventEmitter {
    constructor(token) {
        super()
        this.token = token

        this._shards = []
        this.user = null
        this.http = new Http(this)
    }

    connect() {
        this._shards.push(new Shard(this).connect())
    }

    async createMessage(channel, content) {
        const c = await this.http.send({
            url: `/channels/${channel}/messages`,
            method: 'post',
            data: {
                content: content
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        console.log(c.headers)
        return c
    }
}