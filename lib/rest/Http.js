const axios = require('axios')
const { API_URL } = require('../Constants')

module.exports = class Http {
    constructor(client) {
        this.client = client
        this.http = axios.create({
            baseURL: API_URL,
            headers: {
                'User-Agent': `DiscordBot (https://github.com/Cyber28/Nakamura, ${require('../../package.json').version})`,
                'Authorization': `Bot ${this.client.token}`
            }
        })
    }

    // refer to https://www.npmjs.com/package/axios#request-config
    send(o) {
        return this.http.request(o)
    }
}