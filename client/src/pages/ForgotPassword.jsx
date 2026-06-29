import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const forgotSchema = z.object({
    email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
});

export default function ForgotPassword() {
    const [statusMessage, setStatusMessage] = useState('');
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data) => {
        setServerError('');
        setStatusMessage('');
        try {
            const res = await axios.post('/api/auth/forgot-password', { email: data.email });
            if (res.data.success) {
                setStatusMessage(res.data.message);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error;
            setServerError(typeof errorMsg === 'string' ? errorMsg : 'Failed to recover password');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] p-4">
            <div className="glass-card w-full max-w-md">
                <Link to="/login" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6">
                    <ArrowLeft size={16} className="mr-1" /> Back to Login
                </Link>

                <h2 className="text-3xl font-bold text-center mb-2">Recover Password</h2>
                <p className="text-center text-gray-400 mb-8 text-sm">
                    Enter your registered email address below. If found, your new password will be sent directly to your email.
                </p>

                {serverError && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-center">{serverError}</div>}
                
                {statusMessage && (
                    <div className="bg-green-500/20 text-green-200 p-4 rounded mb-6 text-center flex flex-col items-center">
                        <CheckCircle size={32} className="mb-2 text-green-400" />
                        <p className="font-semibold">{statusMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                className={`input-field pr-10 ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="your_email@example.com"
                                {...register('email')}
                            />
                            <Mail size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                        {isSubmitting ? 'Sending Password...' : 'Send Password to Email'}
                    </button>
                </form>
            </div>
        </div>
    );
}
