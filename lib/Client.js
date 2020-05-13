const EventEmitter = require('eventemitter3')
const { Shard } = require('./gateway/Shard')
const { Http } = require('./rest/Http')

/**
 * Options for the client
 * @typedef {Object} ClientOptions
 * @property {?CacheOptions} cache - Object describing caching behaviour
 * @property {?boolean} debug - Enable debug messages (fires the debug event)
 */

/**
 * Describing cache behavior. BY DEFAULT EVERYTHING IS FALSE OR NULL
 * @typedef {Object} CacheOptions
 * @property {boolean} guilds - Cache guild data (currently only id, name, member count)
 */

/**
 * The main class to interact with
 * @extends {EventEmitter}
 * @property {Map<number, Shard>} _shards - Map object containing Shard objects, mapped by id
 * @property {?object} user - Client User object, see [User documentation]{@link https://discord.com/developers/docs/resources/user#user-object}
 */
class Client extends EventEmitter {
    /**
     * @constructor
     * @param {string} token - Your bot token. IT SHOULD NOT HAVE THE `Bot` PREFIX
     * @param {?ClientOptions} opts - Client options
     */
    constructor(token, { cache, debug }) {
        super()
        this.token = token
        this.debug = debug
        this.cache = cache
        this._routes = new Map()
        this._shards = new Map()
        this.user = null
    }

    /**
     * Finds (or creates) a route for ratelimiting
     * @private
     * @param {string} route
     * @returns {Http} Found (or created) route
     */
    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    /**
     * Creates a [Shard]{@link Shard} and connects to the gateway
     */
    connect() {
        this._shards.set(this._shards.size, new Shard(this).connect())
    }

    /**
     * Create a message
     * @async
     * @param {string} channel - id of the channel
     * @param {string} content - Content of the message
     * @returns {Promise<Object>} see [Message documentation]{@link https://discord.com/developers/docs/resources/channel#message-object}
     */
    // TODO: add support for sending more than just plaintext content lmao
    async createMessage(channel, content) {
        let data
        if (typeof content === 'string')
            data = { content: content }
        else
            data = content
        const path = `/channels/${channel}/messages`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'post',
            data: data,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    /**
     * Leave guild
     * @async
     * @param {string} guild - id of the guild to leave
     * @returns {Promise<any>} something, idk
     */
    async leaveGuild(guild) {
        const path = `/users/@me/guilds/${guild}`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'delete'
        })
    }

    /**
     * Get gateway bot
     * @async
     * @returns {Promise<Object>} see [Get Gateway bot documentation]{@link https://discord.com/developers/docs/topics/gateway#get-gateway-bot-json-response}
     */
    async getGatewayBot() {
        const path = '/gateway/bot'
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'get'
        })
    }

    /**
     * Get messages from a channel
     * @async
     * @param {string} channel - id of the channel to get messages from
     * @param {number} limit - number of messages to return (1-100)
     * @returns {Promise<Array<Object>>} an array of [Message]{@link https://discord.com/developers/docs/resources/channel#message-object} objects
     */
    // TODO: add support for all params (around, before, after)
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

    /**
     * Adds a role to a guild member
     * @async
     * @param {string} guild - id of the guild
     * @param {string} member - id of the member
     * @param {string} role - id of the role
     * @returns {Promise<any>} something, idk
     */
    async addGuildMemberRole(guild, member, role) {
        const path = `/guilds/${guild}/members/${member}/roles/${role}`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'put'
        })
    }

    /**
    * Removes a role from a guild member
    * @async
    * @param {string} guild - id of the guild
    * @param {string} member - id of the member
    * @param {string} role - id of the role
    * @returns {Promise<any>} something, idk
    */
    async removeGuildMemberRole(guild, member, role) {
        const path = `/guilds/${guild}/members/${member}/roles/${role}`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'delete'
        })
    }

    /**
     * Sets the statuses of all Shards
     * @param {Object} status - See [Status Update Structure documentation]{@link https://discord.com/developers/docs/topics/gateway#update-status}
     */
    setAllStatus(o) {
        this._shards.forEach(s => s.setStatus(o))
    }
}

module.exports.Client = Client
