require('dotenv').config();
const MongoStore = require('connect-mongo');

const uri = process.env.MONGO_URI;
console.log('Testing MongoStore with:', uri.replace(/:([^:@]+)@/, ':****@'));

try {
    const store = MongoStore.create({
        mongoUrl: uri,
        mongoOptions: { tlsAllowInvalidCertificates: true }
    });

    // Attempt a basic operation or wait for connection
    console.log('MongoStore instance created.');

    // Connect-mongo doesn't expose a simple "connect" promise directly on create,
    // but we can try to get the client.
    setTimeout(() => {
        store.on('error', (err) => {
            console.error('MongoStore Error:', err);
            process.exit(1);
        });

        // If we reach here without error event
        console.log('Waiting for connection...');

        // Try to close?
        setTimeout(() => {
            console.log('Test completed (no immediate crash).');
            store.close();
            process.exit(0);
        }, 5000);

    }, 1000);

} catch (err) {
    console.error('Synchronous Error:', err);
    process.exit(1);
}
