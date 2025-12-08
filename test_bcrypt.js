const bcrypt = require('bcrypt');
console.log('Testing bcrypt...');
bcrypt.hash('password123', 10)
    .then(hash => {
        console.log('Bcrypt Success. Hash:', hash);
        process.exit(0);
    })
    .catch(err => {
        console.error('Bcrypt Error:', err);
        process.exit(1);
    });
