const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')

module.exports = class Client extends EventEmitter {
    constructor(token) {
        super()
        this.token = token

        this._shards = []
        this.user = null
    }

    connect() {
        this._shards.push(new Shard(this).connect())
    }
}