import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, QrCode, List, Menu, X, Settings } from 'lucide-react';
import Logo from '../assets/QR.png';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={Logo} alt="QR Gen Logo" className="h-8 w-8 object-contain" />
                        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            QR Gen
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {user ? (
                            <>
                                <span className="text-gray-300 text-sm">Welcome, {user.username}</span>
                                <Link to="/dashboard" className={`flex items-center gap-2 transition-colors ${location.pathname === '/dashboard' ? 'text-primary' : 'hover:text-primary'}`}>
                                    <QrCode size={18} /> Dashboard
                                </Link>
                                <Link to="/my-qrs" className={`flex items-center gap-2 transition-colors ${location.pathname === '/my-qrs' ? 'text-primary' : 'hover:text-primary'}`}>
                                    <List size={18} /> My QRs
                                </Link>
                                <Link to="/settings" className={`flex items-center gap-2 transition-colors ${location.pathname === '/settings' ? 'text-primary' : 'hover:text-primary'}`}>
                                    <Settings size={18} /> Settings
                                </Link>
                                <button onClick={handleLogout} className="flex items-center gap-2 hover:text-secondary transition-colors">
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
                                <Link to="/register" className="btn-primary px-4 py-2 rounded-lg text-sm">Register</Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-gray-900 border-b border-white/10 p-4">
                        <nav className="flex flex-col gap-4">
                            {user ? (
                                <>
                                    <div className="text-gray-400 text-sm pb-2 border-b border-white/10">Signed in as {user.username}</div>
                                    <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-2 hover:text-primary">
                                        <QrCode size={20} /> Dashboard
                                    </Link>
                                    <Link to="/my-qrs" onClick={closeMenu} className="flex items-center gap-2 hover:text-primary">
                                        <List size={20} /> My QRs
                                    </Link>
                                    <Link to="/settings" onClick={closeMenu} className="flex items-center gap-2 hover:text-primary">
                                        <Settings size={20} /> Settings
                                    </Link>
                                    <button onClick={() => { handleLogout(); closeMenu(); }} className="flex items-center gap-2 text-red-400 hover:text-red-300">
                                        <LogOut size={20} /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={closeMenu} className="block w-full py-2 hover:text-primary">Login</Link>
                                    <Link to="/register" onClick={closeMenu} className="block w-full py-2 text-primary">Register</Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1 container mx-auto p-4 pt-24 md:p-8 md:pt-28">
                <Outlet />
            </main>
        </div>
    );
}
