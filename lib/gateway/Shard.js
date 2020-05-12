const EventEmitter = require('eventemitter3')
const ws = require('ws')
const erlpack = require('erlpack')
const { GATEWAY_URL, GatewayOpcodes, unrecoverableCloseCodes } = require('../Constants')

/**
 * @typedef {Object} MinimalGuild
 * @property {string} id - Id of the guild
 * @property {string} name - Name of the guild
 * @property {number} memberCount - Number of guild members
 */
/**
 * The Shard class. Represents a Shard and WebSocket connection to Discord
 * @extends {Eventemitter}
 * @property {Client} client - The Client object this shard belongs to
 * @property {Map<string, MinimalGuild>} guilds - [MinimalGuild]{@link MinimalGuild} objects mapped by id
 * @property {number} guildCount - Number of guilds the Shard has access to (does NOT include unavailable guilds)
 */
class Shard extends EventEmitter {
    /**
     * @constructor
     * @param {Client} client - The Client object this Shard belongs to
     */
    constructor(client) {
        super()

        this._seq = null
        this._heartbeatAck = true
        this._sessionId = null
        this._ws = null
        this._heartbeatInterval = null
        this._unavailableGuilds = null
        this._reconnecting = false
        this.client = client
        this.guilds = new Map()
        this.guildCount = 0
    }

    send(o) {
        this._ws.send(erlpack.pack(o))
    }

    debug(m) {
        /**
         * internal debugging, you generally shouldn't listen to this
         * @event Client#debug
         * @prop {*} message
         */
        if (this.client.debug) this.emit('debug', m)
    }

    emit(s, m) {
        this.client.emit(s, m)
    }

    /**
     * Connects the shard to the Discord Gateway
     */
    connect() {
        this._ws = new ws(`${GATEWAY_URL}?v6&encoding=etf`)

        this._ws.on('open', _ => { this.debug('Connection opened') })
        this._ws.on('message', msg => {
            msg = erlpack.unpack(msg)
            if (msg.s) {
                this._seq = msg.s
                this.debug(`New sequence number: ${this._seq}`)
            }
            switch (msg.op) {
                case GatewayOpcodes.DISPATCH:
                    this.debug(`Dispatch: ${msg.t}`)
                    switch (msg.t) {
                        // ok so this needs a LOT of development that i cba to do now
                        case 'READY':
                            this.client.user = msg.d.user
                            this._sessionId = msg.d.session_id
                            this._unavailableGuilds = new Set(msg.d.guilds.map(g => g.id))
                            /**
                             * Emitted when the READY event is receieved
                             * @event Client#ready
                             * @prop {object} data - see [Ready event documentation]{@link https://discord.com/developers/docs/topics/gateway#ready}
                             */
                            this.emit('ready', msg.d)
                            break

                        case 'GUILD_CREATE':
                            if (this._unavailableGuilds.has(msg.d.id)) {
                                this._unavailableGuilds.delete(msg.d.id)
                                this.guildCount++
                                if (this.client.cache.guilds) {
                                    this.guilds.set(msg.d.id, {
                                        id: msg.d.id,
                                        name: msg.d.name,
                                        memberCount: msg.d.member_count
                                    })
                                }
                                if (this._unavailableGuilds.size == 0) {
                                    /**
                                     * Emitted when all guilds are loaded
                                     * @event Client#loaded
                                     */
                                    this.emit('loaded')
                                }
                            }
                            else {
                                this.guilds.set(msg.d.id, {
                                    id: msg.d.id,
                                    name: msg.d.name,
                                    memberCount: msg.d.member_count
                                })
                                /**
                                 * Emitted when the bot joins a guild
                                 * @event Client#guildJoin
                                 * @prop {object} guild - see [Guild Structure]{@link https://discord.com/developers/docs/resources/guild#guild-object-guild-structure}
                                 */
                                this.emit('guildJoin', msg.d)
                            }
                            break

                        case 'MESSAGE_CREATE':
                            /**
                             * Emitted when a message is received
                             * @event Client#messageCreate
                             * @prop {object} message - see [Message Structure]{@link https://discord.com/developers/docs/resources/channel#message-object-message-structure}
                             */
                            this.emit('messageCreate', msg.d)
                            break

                        default:
                            break
                    }
                    break

                case GatewayOpcodes.HELLO:
                    this.debug(`Hello receieved, starting to heartbeat at ${msg.d.heartbeat_interval}ms`)
                    this._heartbeatInterval = setInterval(_ => { this.heartbeat() }, msg.d.heartbeat_interval)
                    this._reconnecting ? this.resume() : this.identify()
                    break

                case GatewayOpcodes.HEARTBEAT_ACK:
                    this.debug('Heartbeat acked')
                    this._heartbeatAck = true
                    break

                default: break
            }
        })
        this._ws.on('close', (code, msg) => {
            this.debug(`\nWebsocket closed\ncode: ${code}\nmessage:${msg}\n`)
            if (unrecoverableCloseCodes.includes(code)) {
                console.log(`Unrecoverable error, closing! code: ${code} message: ${msg}`)
                return setTimeout(process.exit, 300)
            }
            clearInterval(this._heartbeatInterval)
            this._reconnecting = true
            this.connect()
        })
        this._ws.on('error', (err) => this.debug(`oops, websocket error: ${err}`))

        return this //to add Shard object to Client._shards
    }

    heartbeat() {
        if (!this._heartbeatAck) {
            this._ws.close()
        }
        this.debug('Sent heartbeat')
        this.send({
            op: GatewayOpcodes.HEARTBEAT,
            d: this._seq
        })
        this._heartbeatAck = false
    }

    resume() {
        this.send({
            op: GatewayOpcodes.RESUME,
            d: {
                token: `Bot ${this.client.token}`,
                session_id: this._sessionId,
                seq: this._seq
            }
        })
    }

    identify() {
        this.debug('Attempting to identify')
        this.send({
            op: GatewayOpcodes.IDENTIFY,
            d: {
                token: `Bot ${this.client.token}`,
                properties: {
                    $os: "linux",
                    $browser: "Nakamura (Testing version)",
                    $device: "Nakamura (Testing version)"
                },
                shard: [0, 1],
                intents: 513
            }
        })
    }

    /**
     * Set the status of the current shard
     * @param {Object} data See [Status Update Structure]{@link https://discord.com/developers/docs/topics/gateway#update-status-gateway-status-update-structure}
     */
    // TODO: add more documentation for the data object
    setStatus(o) {
        this.debug('Changing status')
        // dear future reader, if you are wondering
        // why this was written in the way it was,
        // let me introduce you to the magic of Object.assign
        o.game = Object.assign({
            name: '',
            type: 0,
            url: null
        }, o.game)
        this.send({
            op: GatewayOpcodes.PRESENCE_UPDATE,
            d: Object.assign({
                since: null,
                status: 'online',
                afk: 'false' // what even is this for?
            }, o)
        })
    }
}

module.exports.Shard = Shard