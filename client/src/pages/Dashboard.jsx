import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const dashboardSchema = z.object({
    name: z.string().optional(),
    url: z.string().url('Please enter a valid URL'),
    qrType: z.enum(['static', 'dynamic']),
    expiresAt: z.string().optional(),
});

export default function Dashboard() {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(dashboardSchema),
        defaultValues: {
            name: '',
            url: '',
            qrType: 'dynamic',
            expiresAt: '',
        },
    });

    const qrType = watch('qrType');

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await axios.post('/api/generate', data, { withCredentials: true });
            navigate('/my-qrs');
        } catch (err) {
            console.error(err);
            setServerError('Failed to generate QR code');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Create Your QR Code</h1>
                <p className="text-gray-400">Enter a URL below to generate a high-quality QR code instantly.</p>
            </div>

            <div className="glass-card">
                {serverError && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-center">{serverError}</div>}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">QR Name (Optional)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., My Portfolio"
                            {...register('name')}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Website URL</label>
                        <input
                            type="url"
                            className={`input-field ${errors.url ? 'border-red-500' : ''}`}
                            placeholder="https://example.com"
                            {...register('url')}
                        />
                        {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="trackScans"
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                            checked={qrType === 'dynamic'}
                            onChange={(e) => setValue('qrType', e.target.checked ? 'dynamic' : 'static')}
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
                                {...register('expiresAt')}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                After this date, the QR code will stop redirecting users.
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mt-1">
                        Dynamic QRs track scans but redirect through our server. Static QRs go directly to the URL but cannot be tracked.
                    </p>
                    <button type="submit" className="btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Generating...' : 'Generate QR Code'}
                    </button>
                </form>
            </div>
        </div>
    );
}
