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

async function addStore(userAddress, { name, id, LicenseOwnership, LicenseSale, LicenseInventory }) {
    await client.saddAsync('stores:all', id)
    await client.saddAsync('stores:for-user:' + userAddress, id)
    await client.hsetAsync('stores:data', id, JSON.stringify({ name, id, LicenseOwnership, LicenseSale, LicenseInventory }))
}

async function getStores({ userAddress, storeIDs } = {}) {
    if (storeIDs) {
        // no-op
    } else if (userAddress) {
        storeIDs = await client.smembersAsync('stores:for-user:' + userAddress) || []
    } else {
        storeIDs = await client.smembersAsync('stores:all') || []
    }

    if (storeIDs.length === 0) {
        return []
    }

    return (await client.hmgetAsync('stores:data', ...storeIDs)).map(storeJSON => JSON.parse(storeJSON))
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
    addStore,
    getStores,
}