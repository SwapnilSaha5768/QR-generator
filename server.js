require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
            tlsAllowInvalidCertificates: true,
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
    }
};
connectDB();

const cors = require('cors');

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Robustly resolve dist path (now in root)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.use(session({
    store: MongoStore.create({ mongoUrl: MONGO_URI, mongoOptions: { tlsAllowInvalidCertificates: true } }),
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));

// Catch-all route for React SPA with Error Handling
// Catch-all route for React SPA with Error Handling
app.get(/(.*)/, (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            // If file missing, show debug info directly
            res.status(500).send(`
                <h1>Deployment Error</h1>
                <p>Could not serve index.html.</p>
                <p>Attempted Path: ${indexPath}</p>
                <p>Error: ${err.message}</p>
                <p>Current Directory: ${__dirname}</p>
                <p>Process CWD: ${process.cwd()}</p>
                <p>Dist Directory Exists: ${require('fs').existsSync(distPath)}</p>
            `);
        }
    });
});

// This block ONLY runs when running locally (e.g. 'npm run dev')
// Vercel skips this because it imports 'app' as a module
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);

        // Log the IP that will be used for QRs
        const os = require('os');
        let localIp = 'localhost';
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    localIp = iface.address;
                    break;
                }
            }
        }
        console.log(`Dynamic QRs will point to: http://${localIp}:${PORT}`);
    });
}

module.exports = app;
