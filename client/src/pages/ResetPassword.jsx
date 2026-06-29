import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

const resetSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data) => {
        setServerError('');
        setSuccessMessage('');
        try {
            const res = await axios.post('/api/auth/reset-password', {
                token,
                newPassword: data.password,
            });
            if (res.data.success) {
                setSuccessMessage(res.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error;
            setServerError(typeof errorMsg === 'string' ? errorMsg : 'Failed to reset password');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] p-4">
            <div className="glass-card w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-2">Set New Password</h2>
                <p className="text-center text-gray-400 mb-8 text-sm">
                    Please enter and confirm your new password below.
                </p>

                {serverError && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-center">{serverError}</div>}
                {successMessage && (
                    <div className="bg-green-500/20 text-green-200 p-4 rounded mb-6 text-center flex flex-col items-center">
                        <CheckCircle size={32} className="mb-2 text-green-400" />
                        <p>{successMessage}</p>
                        <p className="text-xs text-green-300 mt-2">Redirecting to login in 3 seconds...</p>
                    </div>
                )}

                {!successMessage && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
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

                        <div>
                            <label className="block text-gray-400 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                    {...register('confirmPassword')}
                                />
                                <Lock size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn disabled:opacity-50 disabled:cursor-not-allowed w-full"
                        >
                            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="text-center mt-6 text-gray-400 text-sm">
                    Remember your password? <Link to="/login" className="text-primary hover:text-secondary">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
