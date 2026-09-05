// backend/test-astra-connection.js

const cassandra = require('cassandra-driver');
const path = require('path');
require('dotenv').config();

console.log('╔════════════════════════════════════════════╗');
console.log('║  DataStax Astra DB Connection Test        ║');
console.log('╚════════════════════════════════════════════╝\n');

const KEYSPACE = process.env.ASTRA_KEYSPACE || 'vyaapti';

const client = new cassandra.Client({
    cloud: {
        secureConnectBundle: process.env.ASTRA_SECURE_BUNDLE_PATH
            ? path.resolve(__dirname, process.env.ASTRA_SECURE_BUNDLE_PATH)
            : path.join(__dirname, 'secure-connect-vyaapti.zip')
    },
    credentials: {
        username: process.env.ASTRA_CLIENT_ID,
        password: process.env.ASTRA_CLIENT_SECRET
    },
    keyspace: KEYSPACE
});

async function testConnection() {
    try {
        console.log('🔌 Attempting to connect to Astra DB...');
        console.log(`   Database: vyaapti`);
        console.log(`   Region: Mumbai (asia-south1)`);
        console.log(`   Keyspace: ${KEYSPACE}\n`);

        await client.connect();
        console.log('✓ Successfully connected to Astra DB!\n');

        console.log('📊 Testing queries...\n');

        console.log('1. Checking chains table...');
        const chainsQuery = 'SELECT COUNT(*) as count FROM chains';
        const chainsResult = await client.execute(chainsQuery);
        const totalChains = chainsResult.rows[0].count.toNumber();
        console.log(`   ✓ Found ${totalChains} chains\n`);

        console.log('2. Checking accounts table...');
        const accountsQuery = 'SELECT COUNT(*) as count FROM accounts';
        const accountsResult = await client.execute(accountsQuery);
        const totalAccounts = accountsResult.rows[0].count.toNumber();
        console.log(`   ✓ Found ${totalAccounts} accounts\n`);

        console.log('3. Fetching sample chain...');
        const sampleChainQuery = 'SELECT chain_id, risk_score, num_hops, total_value FROM chains LIMIT 1';
        const sampleChain = await client.execute(sampleChainQuery);
        if (sampleChain.rows.length > 0) {
            const chain = sampleChain.rows[0];
            console.log(`   ✓ Sample Chain:`);
            console.log(`     Chain ID: ${chain.chain_id.toString().substring(0, 8)}...`);
            console.log(`     Risk Score: ${chain.risk_score.toFixed(2)}%`);
            console.log(`     Hops: ${chain.num_hops}`);
            console.log(`     Value: ₹${(chain.total_value / 10000000).toFixed(2)} Cr\n`);
        } else {
            console.log(`   ⚠ No chains found. Run schema-astra.cql to insert sample data.\n`);
        }

        console.log('4. Fetching sample account...');
        const sampleAccountQuery = 'SELECT account_id, suspicion_index, cluster_label FROM accounts LIMIT 1';
        const sampleAccount = await client.execute(sampleAccountQuery);
        if (sampleAccount.rows.length > 0) {
            const account = sampleAccount.rows[0];
            console.log(`   ✓ Sample Account:`);
            console.log(`     Account ID: ${account.account_id}`);
            console.log(`     Suspicion Index: ${account.suspicion_index.toFixed(2)}%`);
            console.log(`     Cluster: ${account.cluster_label}\n`);
        } else {
            console.log(`   ⚠ No accounts found. Run schema-astra.cql to insert sample data.\n`);
        }

        console.log('╔════════════════════════════════════════════╗');
        console.log('║  ✓ All Tests Passed!                      ║');
        console.log('║  Your Astra DB is ready to use!           ║');
        console.log('╚════════════════════════════════════════════╝\n');

        console.log('Next steps:');
        console.log('1. Start the backend server: node server.js');
        console.log('2. Open frontend: cd frontend && python3 -m http.server 8080');
        console.log('3. Visit: http://localhost:8080\n');

    } catch (error) {
        console.error('✗ Connection Error:\n');
        
        if (error.message.includes('ENOENT')) {
            console.error('❌ Secure Connect Bundle not found!');
            console.error('   Solution:');
            console.error('   1. Download secure-connect-vyaapti.zip from Astra Dashboard');
            console.error('   2. Place it in backend/ folder\n');
        } else if (error.message.includes('Unauthorized')) {
            console.error('❌ Authentication Failed!');
            console.error('   Solution:');
            console.error('   1. Check your Client ID and Client Secret in .env');
            console.error('   2. Generate new token from Astra Dashboard if needed\n');
        } else if (error.message.includes('Keyspace')) {
            console.error('❌ Keyspace not found!');
            console.error('   Solution:');
            console.error('   1. Go to Astra CQL Console');
            console.error(`   2. Run: CREATE KEYSPACE ${KEYSPACE} WITH replication = {'class': 'NetworkTopologyStrategy', 'asia-south1': 3};\n`);
        } else if (error.message.includes('Unavailable')) {
            console.error('❌ Table not found!');
            console.error('   Solution:');
            console.error('   1. Go to Astra CQL Console');
            console.error('   2. Run the commands in cassandra/schema-astra.cql\n');
        } else {
            console.error(`❌ ${error.message}\n`);
        }
        
        console.error('Full error details:');
        console.error(error);
        
        process.exit(1);
    } finally {
        await client.shutdown();
        console.log('Connection closed.');
    }
}

testConnection();