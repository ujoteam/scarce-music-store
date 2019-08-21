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

async function getMetadata(contractAddress, productID) {
    const metadataJSON = await client.hgetAsync('metadata', contractAddress + ':' + productID)
    if (metadataJSON) {
        return JSON.parse(metadataJSON)
    }
    return null
}

async function setMetadata(contractAddress, productID, metadata) {
    await client.hsetAsync('metadata', contractAddress + ':' + productID, JSON.stringify(metadata))
}

async function addStoreContract(userAddress, { LicenseOwnership, LicenseSale, LicenseInventory }) {
    await client.saddAsync('stores:' + userAddress, JSON.stringify({ LicenseOwnership, LicenseSale, LicenseInventory }))
}

async function getStoreContracts(userAddress) {
    if (userAddress) {
        return ((await client.smembersAsync('stores:' + userAddress)) || []).map(JSON.parse)
    } else {
        let stores = []
        await scanForEach('stores:*', async (keys) => {
            for (let key of keys) {
                let userStores = (await client.smembersAsync(key)).map(JSON.parse)
                stores.push(...userStores)
            }
        })
        return stores
    }
}

async function clearAll() {
    await Promise.all([
        client.delAsync('metadata'),
        scanForEach('stores:*', async (keys) => client.delAsync(...keys)),
    ])
}

async function scanForEach(pattern, fn) {
    let cursor
    while (true) {
        let keys
        [ cursor, keys ] = await client.scanAsync(cursor, 'MATCH', pattern)
        await fn(keys)
        if (cursor === '0') {
            break
        }
    }
}

module.exports = {
    init,
    getMetadata,
    setMetadata,
    clearAll,
    addStoreContract,
    getStoreContracts,
}