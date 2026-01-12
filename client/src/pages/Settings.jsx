import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';

const settingsSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().optional(),
}).refine(data => !data.password || data.password.length >= 6, {
    message: "Password must be at least 6 characters if provided",
    path: ["password"]
});

export default function Settings() {
    const { user } = useAuth();
    const [message, setMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            username: user?.username || '',
            password: '',
        },
    });

    const onSubmit = async (data) => {
        setMessage(null);
        try {
            const payload = { username: data.username };
            if (data.password) {
                payload.password = data.password;
            }

            const res = await axios.put(
                '/api/auth/profile',
                payload,
                { withCredentials: true }
            );
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                reset({ ...data, password: '' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">User Settings</h1>

            <div className="glass-card p-6 md:p-8">
                {message && (
                    <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">Username</label>
                        <input
                            type="text"
                            className={`input-field ${errors.username ? 'border-red-500' : ''}`}
                            {...register('username')}
                        />
                        {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">New Password (leave blank to keep current)</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                placeholder="********"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
                    </div>
                    <button type="submit" className="btn w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}
