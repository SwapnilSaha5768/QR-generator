const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Check Auth Status
router.get('/api/auth/check', (req, res) => {
    // Debug logging
    if (!req.session) {
        console.error('CRITICAL: req.session is undefined in /check.');
        // This implies express-session failed to initialize
        return res.json({ isAuthenticated: false, debug_error: 'Session undefined' });
    }

    if (req.session.user) {
        res.json({ isAuthenticated: true, user: req.session.user });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Register Logic
router.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    console.log('Register attempt:', username);

    // Safety check for req.session
    if (!req.session) {
        console.error('[CRITICAL] req.session is undefined in /register');
        return res.status(500).json({ error: 'Server misconfiguration: Session undefined' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password_hash: hashedPassword });
        await user.save();

        req.session.user = { id: user._id.toString(), username: user.username };
        console.log('Register success:', username);
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Register error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Server Error', details: error.message, stack: error.stack });
    }
});

// Login Logic
router.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        req.session.user = { id: user._id.toString(), username: user.username };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update Profile Logic
router.put('/api/auth/profile', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const { username, password } = req.body;
    try {
        const user = await User.findById(req.session.user.id);
        if (username) user.username = username;
        if (password) user.password_hash = await bcrypt.hash(password, 10);

        await user.save();
        req.session.user.username = user.username;
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Logout Logic
router.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

module.exports = router;
