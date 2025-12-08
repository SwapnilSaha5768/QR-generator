import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyQRs from './pages/MyQRs';
import EditQR from './pages/EditQR';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route
                    path="dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="my-qrs"
                    element={
                        <PrivateRoute>
                            <MyQRs />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="qr/edit/:id"
                    element={
                        <PrivateRoute>
                            <EditQR />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="settings"
                    element={
                        <PrivateRoute>
                            <Settings />
                        </PrivateRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;
