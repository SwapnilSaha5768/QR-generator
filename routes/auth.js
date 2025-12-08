const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Check Auth Status
router.get('/api/auth/check', (req, res) => {
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
    console.log('Login attempt:', username);
    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            req.session.user = { id: user._id.toString(), username: user.username };
            console.log('Login success:', username);
            res.json({ success: true, user: req.session.user });
        } else {
            console.log('Password mismatch:', username);
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update Profile
router.put('/api/auth/profile', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const { username, password } = req.body;
    try {
        const updateData = {};
        if (username) updateData.username = username;
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        // Update session
        req.session.user.username = updatedUser.username;
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Update error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Server Error' });
    }
});

// Logout
router.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.json({ success: true });
    });
});

module.exports = router;
