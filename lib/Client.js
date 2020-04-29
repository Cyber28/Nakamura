const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http')

module.exports = class Client extends EventEmitter {
    constructor(token, { debug }) {
        super()
        this.token = token
        this.debug = debug

        this._shards = []
        this.user = null
        this._routes = new Map()
    }

    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    connect() {
        this._shards.push(new Shard(this).connect())
    }

    async createMessage(channel, content) {
        const path = `/channels/${channel}/messages`
        const route = this._findRoute(path)
        const c = await route.queueRequest({
            url: path,
            method: 'post',
            data: {
                content: content
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return c
    }

    async leaveGuild(guild) {
        const path = `/users/@me/guilds/${guild}`
        const route = this._findRoute(path)
        const c = await route.queueRequest({
            url: path,
            method: 'delete'
        })
        return c
    }
}