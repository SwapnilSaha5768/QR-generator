const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const QRCodeModel = require('../models/QRCode');
const mongoose = require('mongoose');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// My QR Codes
router.get('/api/qrs', requireAuth, async (req, res) => {
    try {
        const qrcodes = await QRCodeModel.find({ user: new mongoose.Types.ObjectId(req.session.user.id) }).sort({ created_at: -1 });
        res.json(qrcodes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database Error' });
    }
});

// Get Single QR
router.get('/api/qrs/:id', requireAuth, async (req, res) => {
    try {
        const qr = await QRCodeModel.findOne({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        if (!qr) return res.status(404).json({ error: 'QR Code not found' });
        res.json(qr);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database Error' });
    }
});

// Update QR Logic
router.put('/api/qrs/:id', requireAuth, async (req, res) => {
    const { url, name, expiresAt } = req.body;
    try {
        const qr = await QRCodeModel.findOne({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        if (!qr) return res.status(404).json({ error: 'QR Not Found' });

        const updateData = {};
        if (name) updateData.name = name;
        // Allow clearing expiration if explicitly passed as null/empty
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

        if (url && url !== qr.url) {
            updateData.url = url;
            // If it's a static QR (legacy), we must regenerate the image
            if (qr.qrType === 'static' || !qr.qrType) {
                const qrImage = await QRCode.toDataURL(url);
                updateData.image_data = qrImage;
            }
            // If dynamic, the image points to /s/:id, so we DON'T change the image, just the destination URL in DB
        }

        const updatedQR = await QRCodeModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updatedQR);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update Error' });
    }
});

// Delete QR Logic
router.delete('/api/qrs/:id', requireAuth, async (req, res) => {
    try {
        await QRCodeModel.findOneAndDelete({ _id: req.params.id, user: new mongoose.Types.ObjectId(req.session.user.id) });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete Error' });
    }
});

// Generate QR Code
const os = require('os');

function getLocalNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Generate QR Code (Dynamic or Static)
router.post('/api/generate', requireAuth, async (req, res) => {
    const { url, name, qrType = 'dynamic', expiresAt } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        let qrImage;
        let finalQrType = qrType;

        if (qrType === 'static') {
            // Static: Direct URL, No Tracking
            qrImage = await QRCode.toDataURL(url);
        } else {
            // Dynamic: Redirect URL, Tracking Enabled
            finalQrType = 'dynamic';
            qrImage = 'placeholder';
        }

        const newQR = new QRCodeModel({
            user: req.session.user.id,
            url: url,
            name: name || 'Untitled QR',
            qrType: finalQrType,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            image_data: qrImage
        });
        await newQR.save();

        if (finalQrType === 'dynamic') {
            const localIp = getLocalNetworkIp();
            const port = process.env.PORT || 3000;
            const redirectUrl = `http://${localIp}:${port}/s/${newQR._id}`;

            console.log(`Generated Dynamic QR for ${url} -> ${redirectUrl}`);

            qrImage = await QRCode.toDataURL(redirectUrl);
            newQR.image_data = qrImage;
            await newQR.save();
        }

        res.json(newQR);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'QR Generation Error' });
    }
});

// Redirect Service (Public)
router.get('/s/:id', async (req, res) => {
    try {
        const qr = await QRCodeModel.findById(req.params.id);
        if (!qr) return res.status(404).send('QR Code Not Found');

        // Check Expiration
        if (qr.expiresAt && new Date() > new Date(qr.expiresAt)) {
            return res.status(410).send('This QR Code has expired.');
        }

        // Increment scan count (fire and forget update)
        QRCodeModel.findByIdAndUpdate(req.params.id, { $inc: { scanCount: 1 } }).exec();

        res.redirect(qr.url);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// High-Res Download
router.get('/api/qrs/:id/download', async (req, res) => {
    try {
        const qr = await QRCodeModel.findById(req.params.id);
        if (!qr) return res.status(404).send('Not Found');

        let redirectUrl = qr.url;
        if (qr.qrType === 'dynamic') {
            redirectUrl = `${req.protocol}://${req.get('host')}/s/${qr._id}`;
        }

        // Generate high-res QR (1080px)
        const qrBuffer = await QRCode.toBuffer(redirectUrl, { width: 1080, margin: 1 });

        res.setHeader('Content-Disposition', `attachment; filename="qrcode-${qr.name.replace(/[^a-z0-9]/gi, '_')}.png"`);
        res.setHeader('Content-Type', 'image/png');
        res.send(qrBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Download Error');
    }
});

module.exports = router;
