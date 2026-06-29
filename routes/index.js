const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const QRCodeModel = require('../models/QRCode');
const mongoose = require('mongoose');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Utility to sanitize and validate URLs against malicious schemes
const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
        return '';
    }
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
        trimmed = 'https://' + trimmed;
    }
    return trimmed;
};

// My QR Codes
router.get('/api/qrs', requireAuth, async (req, res) => {
    try {
        const qrcodes = await QRCodeModel.find({ user: new mongoose.Types.ObjectId(req.session.user.id) }).sort({ created_at: -1 });
        res.json(qrcodes);
    } catch (err) {
        console.error('Error fetching QRs:', err.message);
        res.status(500).json({ error: 'Database Error' });
    }
});

// Get Single QR
router.get('/api/qrs/:id', requireAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid QR ID' });
        }
        const qr = await QRCodeModel.findOne({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        if (!qr) return res.status(404).json({ error: 'QR Code not found' });
        res.json(qr);
    } catch (err) {
        console.error('Error fetching single QR:', err.message);
        res.status(500).json({ error: 'Database Error' });
    }
});

// Update QR Logic (Enforces User Ownership)
router.put('/api/qrs/:id', requireAuth, async (req, res) => {
    const { url, name, expiresAt } = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid QR ID' });
        }

        const qr = await QRCodeModel.findOne({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        if (!qr) return res.status(404).json({ error: 'QR Not Found' });

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

        if (url && url !== qr.url) {
            const sanitized = sanitizeUrl(url);
            if (!sanitized) return res.status(400).json({ error: 'Invalid or unsafe URL' });
            updateData.url = sanitized;

            if (qr.qrType === 'static' || !qr.qrType) {
                const qrImage = await QRCode.toDataURL(sanitized);
                updateData.image_data = qrImage;
            }
        }

        const updatedQR = await QRCodeModel.findOneAndUpdate(
            { _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) },
            updateData,
            { new: true }
        );
        res.json(updatedQR);
    } catch (err) {
        console.error('Error updating QR:', err.message);
        res.status(500).json({ error: 'Update Error' });
    }
});

// Delete QR Logic (Enforces User Ownership)
router.delete('/api/qrs/:id', requireAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid QR ID' });
        }
        const deleted = await QRCodeModel.findOneAndDelete({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        if (!deleted) return res.status(404).json({ error: 'QR Code not found or unauthorized' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting QR:', err.message);
        res.status(500).json({ error: 'Delete Error' });
    }
});

// Generate QR Code (Dynamic or Static)
router.post('/api/generate', requireAuth, async (req, res) => {
    const { url, name, qrType = 'dynamic', expiresAt } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) return res.status(400).json({ error: 'Invalid or unsafe URL' });

    try {
        let qrImage;
        let finalQrType = qrType;

        if (qrType === 'static') {
            qrImage = await QRCode.toDataURL(sanitizedUrl);
        } else {
            finalQrType = 'dynamic';
            qrImage = 'placeholder';
        }

        const newQR = new QRCodeModel({
            user: req.session.user.id,
            url: sanitizedUrl,
            name: (name || 'Untitled QR').trim(),
            qrType: finalQrType,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            image_data: qrImage
        });
        await newQR.save();

        if (finalQrType === 'dynamic') {
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.get('host');
            const redirectUrl = `${protocol}://${host}/s/${newQR._id}`;

            qrImage = await QRCode.toDataURL(redirectUrl);
            newQR.image_data = qrImage;
            await newQR.save();
        }

        res.json(newQR);
    } catch (err) {
        console.error('Error generating QR:', err.message);
        res.status(500).json({ error: 'QR Generation Error' });
    }
});

// Redirect Service (Public)
router.get('/s/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).send('QR Code Not Found');
        }

        const qr = await QRCodeModel.findById(req.params.id);
        if (!qr) return res.status(404).send('QR Code Not Found');

        if (qr.expiresAt && new Date() > new Date(qr.expiresAt)) {
            return res.status(410).send('This QR Code has expired.');
        }

        // Increment scan count asynchronously
        QRCodeModel.findByIdAndUpdate(req.params.id, { $inc: { scanCount: 1 } }).exec();

        res.redirect(qr.url);
    } catch (err) {
        console.error('Redirect Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// High-Res Download (Protected for Owner Only)
router.get('/api/qrs/:id/download', requireAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid ID');
        }

        const qr = await QRCodeModel.findOne({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        if (!qr) return res.status(404).send('Not Found');

        let redirectUrl = qr.url;
        if (qr.qrType === 'dynamic') {
            redirectUrl = `${req.protocol}://${req.get('host')}/s/${qr._id}`;
        }

        const qrBuffer = await QRCode.toBuffer(redirectUrl, { width: 1080, margin: 1 });

        const safeFilename = (qr.name || 'qrcode').replace(/[^a-z0-9]/gi, '_');
        res.setHeader('Content-Disposition', `attachment; filename="qrcode-${safeFilename}.png"`);
        res.setHeader('Content-Type', 'image/png');
        res.send(qrBuffer);
    } catch (err) {
        console.error('Download Error:', err.message);
        res.status(500).send('Download Error');
    }
});

module.exports = router;
