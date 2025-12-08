require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
console.log('Testing connection to:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    family: 4,
    tlsAllowInvalidCertificates: true,
})
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('FAILURE: Could not connect to MongoDB.');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
        process.exit(1);
    });
