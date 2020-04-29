const EventEmitter = require('eventemitter3')
const ws = require('ws')
const erlpack = require('erlpack')
const { GATEWAY_URL, GatewayOpcodes } = require('../Constants')

module.exports = class Shard extends EventEmitter {
    constructor(client) {
        super()

        this._seq = null
        this._heartbeatAck = true
        this._sessionId = null
        this._ws = null
        this._heartbeatInterval = null
        this._unavailableGuilds = null
        this.client = client
        this.guilds = new Map()
    }

    send(o) {
        this._ws.send(erlpack.pack(o))
    }

    debug(m) {
        if (this.client.debug) this.emit('debug', m)
    }

    emit(s, m) {
        this.client.emit(s, m)
    }

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
                            this.emit('ready', msg.d)
                            break

                        case 'GUILD_CREATE':
                            if (this._unavailableGuilds.has(msg.d.id)) {
                                this._unavailableGuilds.delete(msg.d.id)
                                this.guilds.set(msg.d.id, {
                                    id: msg.d.id,
                                    name: msg.d.name,
                                    memberCount: msg.d.member_count
                                })
                                if (this._unavailableGuilds.size == 0) {
                                    this.emit('loaded')
                                }
                            }
                            else {
                                this.guilds.set(msg.d.id, {
                                    id: msg.d.id,
                                    name: msg.d.name,
                                    memberCount: msg.d.member_count
                                })
                                this.emit('guildJoin', msg.d)
                            }
                            break

                        case 'MESSAGE_CREATE':
                            this.emit('messageCreate', msg.d)
                            break

                        default:
                            break
                    }
                    break

                case GatewayOpcodes.HELLO:
                    this.debug(`Hello receieved, starting to heartbeat at ${msg.d.heartbeat_interval}ms`)
                    this._heartbeatInterval = setInterval(_ => { this.heartbeat() }, msg.d.heartbeat_interval)
                    this.identify()
                    break

                case GatewayOpcodes.HEARTBEAT_ACK:
                    this.debug('Heartbeat acked')
                    this._heartbeatAck = true
                    break

                default: break
            }
        })
        this._ws.on('close', (code, msg) => {
            this.emit('debug', `websocket closed\ncode: ${code}\nmessage: ${msg}`)
            this.debug(`\nWebsocket closed\ncode: ${code}\nmessage:${msg}\n`)
            this._ws = null
            clearInterval(this._heartbeatInterval)
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
}