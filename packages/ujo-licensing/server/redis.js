const Promise = require('bluebird')
const redis = require('redis')

let client

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error('Must specify REDIS_HOST and REDIS_PORT in your environment variables')
}

async function init() {
    client = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    })
    client = Promise.promisifyAll(client, { suffix: 'Async' })

    await client.onAsync('ready')
    return client
}

async function getMetadata(productID) {
    const metadataJSON = await client.hgetAsync('metadata', productID)
    if (metadataJSON) {
        return JSON.parse(metadataJSON)
    }
    return null
}

async function setMetadata(productID, metadata) {
    await client.hsetAsync('metadata', productID, JSON.stringify(metadata))
}

async function clearAll() {
    await Promise.all([
        client.delAsync('metadata'),
    ])
}

module.exports = {
    init,
    getMetadata,
    setMetadata,
    clearAll,
}