const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: 'Untitled QR' },
    url: { type: String, required: true },
    image_data: { type: String, required: true },
    scanCount: { type: Number, default: 0 },
    qrType: { type: String, enum: ['static', 'dynamic'], default: 'dynamic' },
    expiresAt: { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QRCode', qrCodeSchema);
