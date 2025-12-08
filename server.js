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
    if (!MONGO_URI) {
        console.error('CRITICAL ERROR: MONGO_URI is invalid or missing.');
        console.error('Please add MONGO_URI to your Vercel Environment Variables.');
        return;
    }
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
// app.use(express.static(distPath)); // HANDLED BY VERCEL

app.use(session({
    store: MongoStore.create({ mongoUrl: MONGO_URI, mongoOptions: { tlsAllowInvalidCertificates: true } }),
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));

// Catch-all route is handled by Vercel Rewrites -> index.html
// If a request hits here, it means it didn't match any API route
app.get('*', (req, res) => {
    res.status(404).send('API endpoint not found');
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
