require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Database Connection
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error('CRITICAL ERROR: MONGO_URI is invalid or missing.');
        return;
    }
    // Prevent multiple connections
    if (mongoose.connection.readyState >= 1) return;

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

// Ensure DB is connected for every request (Serverless-friendly)
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Essential for Vercel/Heroku logic
app.set('trust proxy', 1);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Dynamic CORS for Production & Localhost
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost (any port) and your vercel domains
        const allowedOrigins = ['http://localhost:3000'];
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route (Placed before session to work even if DB fails)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongo_connected: mongoose.connection.readyState === 1,
        mongo_uri_set: !!process.env.MONGO_URI,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

const distPath = path.join(__dirname, 'dist');
// app.use(express.static(distPath)); // HANDLED BY VERCEL

app.use(session({
    store: MongoStore.create({
        mongoUrl: MONGO_URI, // Simpler, more robust for Vercel
        mongoOptions: { tlsAllowInvalidCertificates: true }
    }),
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));

// Catch-all route is handled by Vercel Rewrites -> index.html
app.get(/(.*)/, (req, res) => {
    res.status(404).send('API endpoint not found');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

    // Log local IP for testing
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`Dynamic QRs will point to: http://${iface.address}:${PORT}`);
            }
        }
    }
}

module.exports = app;
