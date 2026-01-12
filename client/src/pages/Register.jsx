import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register: registerAuth, user } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const onSubmit = async (data) => {
        setServerError('');
        try {
            const success = await registerAuth(data.username, data.password);
            if (success) navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.error;
            setServerError(typeof errorMsg === 'string' ? errorMsg : (JSON.stringify(errorMsg) || 'Registration failed'));
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] p-4">
            <div className="glass-card w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-8">Register</h2>
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
                        <label className="block text-gray-400 mb-2">Password</label>
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
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-center mt-6 text-gray-400">
                    Already have an account? <Link to="/login" className="text-primary hover:text-secondary">Login</Link>
                </p>
            </div>
        </div>
    );
}
