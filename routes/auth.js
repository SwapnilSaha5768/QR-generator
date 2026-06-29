const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendEmail = async ({ to, subject, text, html }) => {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;

    if (smtpUser && smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            await transporter.sendMail({
                from: process.env.SMTP_FROM || `"QR Code Generator" <${smtpUser}>`,
                to,
                subject,
                text,
                html,
            });
            console.log(`[EMAIL SENT SUCCESSFULLY TO ${to}]`);
        } catch (err) {
            console.error('[EMAIL SENDING ERROR]:', err.message);
            throw new Error(`Email delivery failed: ${err.message}`);
        }
    } else {
        console.log('--- EMAIL SIMULATION (SMTP_USER or SMTP_PASS not set in .env) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('------------------------------------------------------------------');
    }
};

// Check Auth Status
router.get('/api/auth/check', (req, res) => {
    if (!req.session) {
        return res.json({ isAuthenticated: false, error: 'Session uninitialized' });
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
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!req.session) {
        return res.status(500).json({ error: 'Server misconfiguration: Session undefined' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username: username.trim(), password_hash: hashedPassword });
        await user.save();

        req.session.user = { id: user._id.toString(), username: user.username };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Register Error:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Login Logic
router.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username: username.trim() });
        if (!user || !user.password_hash) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName || user.username,
            avatar: user.avatar
        };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update Profile Logic
router.put('/api/auth/profile', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const { username, password } = req.body;
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (username) user.username = username.trim();
        if (password) user.password_hash = await bcrypt.hash(password, 10);

        await user.save();
        req.session.user.username = user.username;
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Profile Update Error:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Google Auth Verification & Login/Register Logic
router.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ error: 'ID Token is required' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            let baseUsername = email ? email.split('@')[0] : `user_${googleId.substring(0, 8)}`;
            let username = baseUsername;
            let count = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}_${count++}`;
            }

            user = new User({
                username,
                email,
                googleId,
                displayName: name,
                avatar: picture
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = googleId;
            if (picture && !user.avatar) user.avatar = picture;
            if (name && !user.displayName) user.displayName = name;
            await user.save();
        }

        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName || user.username,
            avatar: user.avatar
        };

        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Google authentication error:', error.message);
        res.status(401).json({ error: 'Google authentication failed' });
    }
});

// Forgot Password - Send Password Directly to Email
router.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    try {
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(400).json({ error: 'Email address not found' });
        }

        const randomString = crypto.randomBytes(3).toString('hex');
        const tempPassword = `Pass#${randomString}`;

        user.password_hash = await bcrypt.hash(tempPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        const messageText = `Hello ${user.displayName || user.username},\n\nYour password for QR Generator has been reset. Your new temporary password is:\n\n${tempPassword}\n\nPlease log in using this new password and change it in your settings.\n\nThank you!`;
        const messageHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Your New Password</h2>
                <p>Hello <strong>${user.displayName || user.username}</strong>,</p>
                <p>We received a request to recover your password. Your new password has been generated below:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
                    <span style="font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #111827;">${tempPassword}</span>
                </div>
                <p>Please log in using this new password and update your password in your settings.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">If you did not request this change, please contact support immediately.</p>
            </div>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Your New Password - QR Generator',
            text: messageText,
            html: messageHtml
        });

        res.json({
            success: true,
            message: 'Your new password has been sent to your email directly.'
        });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.status(500).json({ error: error.message || 'Server error while recovering password' });
    }
});

// Logout Logic
router.post('/api/auth/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) return res.status(500).json({ error: 'Logout failed' });
            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    } else {
        res.json({ success: true });
    }
});

module.exports = router;
