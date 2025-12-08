import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [qrType, setQrType] = useState('dynamic');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/generate', { url, name, qrType, expiresAt }, { withCredentials: true });
            navigate('/my-qrs');
        } catch (err) {
            console.error(err);
            alert('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Create Your QR Code</h1>
                <p className="text-gray-400">Enter a URL below to generate a high-quality QR code instantly.</p>
            </div>

            <div className="glass-card">
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">QR Name (Optional)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., My Portfolio"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Website URL</label>
                        <input
                            type="url"
                            className="input-field"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="trackScans"
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                            checked={qrType === 'dynamic'}
                            onChange={(e) => setQrType(e.target.checked ? 'dynamic' : 'static')}
                        />
                        <label htmlFor="trackScans" className="text-gray-300">
                            Enable Scan Tracking (Dynamic QR)
                        </label>
                    </div>

                    {qrType === 'dynamic' && (
                        <div>
                            <label className="block text-gray-400 mb-2">Expiration Date (Optional)</label>
                            <input
                                type="datetime-local"
                                className="input-field"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                After this date, the QR code will stop redirecting users.
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mt-1">
                        Dynamic QRs track scans but redirect through our server. Static QRs go directly to the URL but cannot be tracked.
                    </p>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate QR Code'}
                    </button>
                </form>
            </div>
        </div>
    );
}
