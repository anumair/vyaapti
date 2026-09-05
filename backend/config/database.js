const cassandra = require('cassandra-driver');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const requiredVars = ['ASTRA_CLIENT_ID', 'ASTRA_CLIENT_SECRET'];
const missing = requiredVars.filter(name => !process.env[name]);
if (missing.length > 0) {
    throw new Error(
        `Missing required env vars: ${missing.join(', ')}. ` +
        `Copy backend/.env.example to backend/.env and fill in your Astra DB credentials.`
    );
}

const bundlePath = process.env.ASTRA_SECURE_BUNDLE_PATH
    ? path.resolve(__dirname, '..', process.env.ASTRA_SECURE_BUNDLE_PATH)
    : path.join(__dirname, '../secure-connect-vyaapti.zip');

// DataStax Astra DB Connection
const client = new cassandra.Client({
    cloud: {
        secureConnectBundle: bundlePath
    },
    credentials: {
        username: process.env.ASTRA_CLIENT_ID,
        password: process.env.ASTRA_CLIENT_SECRET
    },
    keyspace: process.env.ASTRA_KEYSPACE || 'vyaapti'
});

module.exports = client;