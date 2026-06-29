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

app.set('trust proxy', 1);

app.use((req, res, next) => {
    // Prevent caching of sensitive content to ensure security on logout
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Dynamic CORS for Production & Localhost
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
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

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongo_connected: mongoose.connection.readyState === 1,
        mongo_uri_set: !!process.env.MONGO_URI,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

app.use(session({
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        mongoOptions: { tlsAllowInvalidCertificates: true }
    }),
    secret: process.env.SESSION_SECRET || process.env.SECRET_KEY || 'qr_secure_default_session_secret_key_2026',
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

app.get(/(.*)/, (req, res) => {
    res.status(404).send('API endpoint not found');
});

// Global Error Handler (Sanitized for security)
app.use((err, req, res, next) => {
    console.error(err.stack);
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    res.status(500).json({ error: 'Internal Server Error', message });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
