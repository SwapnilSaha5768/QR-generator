import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const success = await register(username, password);
            if (success) navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.error;
            setError(typeof errorMsg === 'string' ? errorMsg : (JSON.stringify(errorMsg) || 'Registration failed'));
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] p-4">
            <div className="glass-card w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-8">Register</h2>
                {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2">Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn">Register</button>
                </form>
                <p className="text-center mt-6 text-gray-400">
                    Already have an account? <Link to="/login" className="text-primary hover:text-secondary">Login</Link>
                </p>
            </div>
        </div>
    );
}
