import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axios.get('/api/auth/check', { withCredentials: true });
            if (res.data.isAuthenticated) {
                setUser(res.data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error(err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const res = await axios.post('/api/auth/login', { username, password }, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
                return true;
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
        return false;
    };

    const register = async (username, password) => {
        try {
            const res = await axios.post('/api/auth/register', { username, password }, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
                return true;
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
        return false;
    };

    const logout = async () => {
        await axios.post('/api/auth/logout', {}, { withCredentials: true });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
