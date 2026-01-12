import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const editSchema = z.object({
    name: z.string().optional(),
    url: z.string().url('Please enter a valid URL'),
    expiresAt: z.string().optional(),
});

export default function EditQR() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(editSchema),
        defaultValues: {
            name: '',
            url: '',
            expiresAt: '',
        },
    });

    useEffect(() => {
        fetchQR();
    }, [id]);

    const fetchQR = async () => {
        try {
            const res = await axios.get(`/api/qrs/${id}`, { withCredentials: true });

            let formattedDate = '';
            if (res.data.expiresAt) {
                const date = new Date(res.data.expiresAt);
                const offset = date.getTimezoneOffset() * 60000;
                formattedDate = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
            }

            reset({
                name: res.data.name || '',
                url: res.data.url,
                expiresAt: formattedDate,
            });
        } catch (err) {
            console.error(err);
            navigate('/my-qrs');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            await axios.put(`/api/qrs/${id}`, data, { withCredentials: true });
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">QR Name</label>
                        <input
                            type="text"
                            className="input-field"
                            {...register('name')}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Website URL</label>
                        <input
                            type="url"
                            className={`input-field ${errors.url ? 'border-red-500' : ''}`}
                            {...register('url')}
                        />
                        {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>}
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Expiration Date (Optional)</label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            {...register('expiresAt')}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave blank or clear to remove expiration.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button type="submit" className="btn flex-1" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update'}
                        </button>
                        <Link to="/my-qrs" className="btn flex-1 bg-none bg-white/10 hover:bg-white/20 text-center">Cancel</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
