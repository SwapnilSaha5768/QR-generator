import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function EditQR() {
    const { id } = useParams();
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQR();
    }, [id]);

    const fetchQR = async () => {
        try {
            const res = await axios.get(`/api/qrs/${id}`, { withCredentials: true });
            setUrl(res.data.url);
            setName(res.data.name || '');
            if (res.data.expiresAt) {
                // Convert ISO date to datetime-local format (YYYY-MM-DDThh:mm)
                const date = new Date(res.data.expiresAt);
                // Adjust for timezone offset to show correct local time
                const offset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                setExpiresAt(localISOTime);
            } else {
                setExpiresAt('');
            }
        } catch (err) {
            console.error(err);
            navigate('/my-qrs');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/qrs/${id}`, { url, name, expiresAt }, { withCredentials: true });
            navigate('/my-qrs');
        } catch (err) {
            console.error(err);
            alert('Failed to update QR code');
        }
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Edit QR Code</h1>
            <div className="glass-card">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">QR Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Website URL</label>
                        <input
                            type="url"
                            className="input-field"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Expiration Date (Optional)</label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave blank or clear to remove expiration.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button type="submit" className="btn flex-1">Update</button>
                        <Link to="/my-qrs" className="btn flex-1 bg-none bg-white/10 hover:bg-white/20 text-center">Cancel</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
