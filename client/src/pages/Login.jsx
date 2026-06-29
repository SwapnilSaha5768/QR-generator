import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export default function Login() {
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, googleLogin, user } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const onSubmit = async (data) => {
        setServerError('');
        try {
            const success = await login(data.username, data.password);
            if (success) navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.error;
            setServerError(typeof errorMsg === 'string' ? errorMsg : (JSON.stringify(errorMsg) || 'Login failed'));
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setServerError('');
        try {
            const success = await googleLogin(credentialResponse.credential);
            if (success) navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.error;
            setServerError(typeof errorMsg === 'string' ? errorMsg : 'Google login failed. Please try again.');
        }
    };

    const handleGoogleError = () => {
        setServerError('Google Sign In failed or was cancelled.');
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] p-4">
            <div className="glass-card w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-8">Login</h2>
                {serverError && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-center">{serverError}</div>}

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
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-400">Password</label>
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-secondary">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
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

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="my-6 flex items-center justify-center space-x-4">
                    <div className="h-px bg-gray-600 flex-1"></div>
                    <span className="text-gray-400 text-sm uppercase">Or continue with</span>
                    <div className="h-px bg-gray-600 flex-1"></div>
                </div>

                <div className="flex justify-center">
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') && !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID_HERE') ? (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            size="large"
                            width="100%"
                        />
                    ) : (
                        <div className="text-center p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                            <p className="font-semibold mb-1">Google Auth setup needed</p>
                            <p>Please set <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>.env</code> file with a valid Google OAuth Client ID ending in <code>.apps.googleusercontent.com</code>.</p>
                        </div>
                    )}
                </div>

                <p className="text-center mt-6 text-gray-400">
                    Don't have an account? <Link to="/register" className="text-primary hover:text-secondary">Register</Link>
                </p>
            </div>
        </div>
    );
}

