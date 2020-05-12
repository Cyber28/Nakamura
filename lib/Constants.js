/**
 * @typedef {Object} Constants
 * @property {string} GATEWAY_URL - The base URL for the Discord gateway
 * @property {string} API_URL - The base URL for the Discord rest api
 * @property {Object.<string, number>} GatewayOpcodes - Object containing the gateway opcodes
 * @property {number[]} unrecoverableCloseCodes - If the WebSocket is closed with any of these codes, exit the process
 */
// maybe GatewayOpCodes should be typed as enum instead? idk
const Constants = {
    GATEWAY_URL: 'wss://gateway.discord.gg/',
    API_URL: 'https://discord.com/api/v6/',
    GatewayOpcodes: {
        DISPATCH: 0,
        HEARTBEAT: 1,
        IDENTIFY: 2,
        PRESENCE_UPDATE: 3,
        VOICE_STATE_UPDATE: 4,
        RESUME: 6,
        RECONNECT: 7,
        REQUEST_GUILD_MEMBERS: 8,
        INVALID_SESSION: 9,
        HELLO: 10,
        HEARTBEAT_ACK: 11
    },
    unrecoverableCloseCodes: [
        1005, // this should hopefully fix #2
        4004,
        4010,
        4011,
        4012,
        4013,
        4014
    ]
}

module.exports.Constants = Constants