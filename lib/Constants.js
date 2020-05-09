module.exports = {
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
        1005, // this should hopefully fix
        4004,
        4010,
        4011,
        4012,
        4013,
        4014
    ]
}
