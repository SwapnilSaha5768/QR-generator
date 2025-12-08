import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Download, Edit, Trash2 } from 'lucide-react';

export default function MyQRs() {
    const [qrs, setQrs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQRs();
    }, []);

    const fetchQRs = async () => {
        try {
            const res = await axios.get('/api/qrs', { withCredentials: true });
            setQrs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this QR code?')) return;
        try {
            await axios.delete(`/api/qrs/${id}`, { withCredentials: true });
            setQrs(qrs.filter(qr => qr._id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete QR code');
        }
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My QR Codes</h1>
                <Link to="/dashboard" className="bg-primary hover:bg-secondary px-4 py-2 rounded-lg transition-colors">
                    Create New
                </Link>
            </div>

            {qrs.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    No QR codes found. <Link to="/dashboard" className="text-primary">Generate one now</Link>.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {qrs.map(qr => (
                        <div key={qr._id} className="glass-card p-6 flex flex-col items-center relative">
                            {qr.qrType === 'dynamic' && (
                                <div className="absolute top-4 right-4 bg-primary text-xs px-2 py-1 rounded-full">
                                    {qr.scanCount || 0} scans
                                </div>
                            )}
                            <img src={qr.image_data} alt="QR Code" className="w-48 h-48 mb-4 rounded-lg" />
                            <h3 className="font-bold text-lg mb-1">{qr.name || 'Untitled QR'}</h3>
                            <p className="text-sm text-gray-400 mb-4 truncate w-full text-center">{qr.url}</p>
                            <div className="flex gap-3 w-full">
                                <a
                                    href={`/api/qrs/${qr._id}/download`}
                                    download // This attribute might be ignored for cross-origin, but the server sets Content-Disposition
                                    className="flex-1 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors"
                                >
                                    <Download size={16} />
                                </a>
                                <Link
                                    to={`/qr/edit/${qr._id}`}
                                    className="flex-1 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors"
                                >
                                    <Edit size={16} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(qr._id)}
                                    className="flex-1 flex justify-center items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 py-2 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
