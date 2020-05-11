const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http')

module.exports = class Client extends EventEmitter {
    constructor(token, { cache, debug }) {
        super()
        this.token = token
        this.debug = debug
        this.cache = cache

        this._shards = new Map()
        this.user = null
        this._routes = new Map()
    }

    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    connect() {
        this._shards.set(this._shards.size, new Shard(this).connect())
    }

    async createMessage(channel, content) {
        const path = `/channels/${channel}/messages`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'post',
            data: {
                content: content
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    async leaveGuild(guild) {
        const path = `/users/@me/guilds/${guild}`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'delete'
        })
    }

    async getGatewayBot() {
        const path = '/gateway/bot'
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'get'
        })
    }

    async getMessages(channel, limit) {
        const path = `/channels/${channel}/messages`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'get',
            params: {
                limit: limit
            }
        })
    }

    async addGuildMemberRole(guild, member, role) {
        const path = `/guilds/${guild}/members/${member}/roles/${role}`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'put'
        })
    }

    async removeGuildMemberRole(guild, member, role) {
        const path = `/guilds/${guild}/members/${member}/roles/${role}`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'delete'
        })
    }

    setAllStatus(o) {
        this._shards.forEach(s => s.setStatus(o))
    }
}