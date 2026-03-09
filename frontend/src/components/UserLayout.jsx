import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { User, LayoutDashboard, Ticket, Star, LogOut, Calendar, Moon, Sun, Palette, Building2, Heart, Trophy, Gift, Map } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './UserLayout.css';

export default function UserLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const sessionData = await authClient.getSession();
            if (!sessionData?.data?.user) {
                navigate('/login');
                return;
            }
            // Allow only regular users to this specific layout, 
            // though you might want to let admins see it too to test
            if (sessionData.data.user.role !== 'Utilizator') {
                if (sessionData.data.user.role === 'Admin') navigate('/admin');
                else if (sessionData.data.user.role === 'Personal') navigate('/staff');
                else navigate('/');
                return;
            }
            setSession(sessionData.data);
        } catch (error) {
            console.error('Auth check error:', error);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await authClient.signOut();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading">Se încarcă profilul...</div>;
    }

    if (!session) {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div className="user-layout">
            <aside className="user-sidebar">
                <div className="sidebar-header">
                    <Link to="/user" className="logo-area" title="Profilul meu">
                        <User className="logo-icon-small" size={28} />
                        <h2>Acasă</h2>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {/* Public Pages Links */}
                    <div className="nav-divider"></div>

                    <Link to="/user/locations" className={`nav-item ${location.pathname === '/user/locations' ? 'active' : ''}`}>
                        <Building2 size={20} />
                        <span className="nav-label">Muzee &amp; Galerii</span>
                    </Link>
                    <Link to="/user/events" className={`nav-item ${location.pathname === '/user/events' ? 'active' : ''}`}>
                        <Calendar size={20} />
                        <span className="nav-label">Evenimente</span>
                    </Link>
                    <Link to="/user/noaptea-muzeelor" className={`nav-item ${location.pathname === '/user/noaptea-muzeelor' ? 'active' : ''}`}>
                        <Moon size={20} />
                        <span className="nav-label">Noaptea Muzeelor</span>
                    </Link>
                    <Link to="/user/artists" className={`nav-item ${location.pathname.startsWith('/user/artists') ? 'active' : ''}`}>
                        <Palette size={20} />
                        <span className="nav-label">Artiști Români</span>
                    </Link>

                    <div className="nav-divider" />

                    <Link to="/user/badges" className={`nav-item ${location.pathname === '/user/badges' ? 'active' : ''}`}>
                        <Trophy size={20} />
                        <span className="nav-label">Insignele Mele</span>
                    </Link>
                    <Link to="/user/rewards" className={`nav-item ${location.pathname === '/user/rewards' ? 'active' : ''}`}>
                        <Gift size={20} />
                        <span className="nav-label">Schimb Puncte</span>
                    </Link>
                    <Link to="/user/trails" className={`nav-item ${location.pathname === '/user/trails' ? 'active' : ''}`}>
                        <Map size={20} />
                        <span className="nav-label">Trasee Culturale</span>
                    </Link>
                </nav>


                <div className="sidebar-footer">
                    <button onClick={toggleTheme} className="theme-toggle-btn">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        <span className="nav-label">{theme === 'light' ? 'Mod Întunecat' : 'Mod Luminos'}</span>
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        <span className="nav-label">Deconectare</span>
                    </button>
                </div>
            </aside>

            <main className="user-content">
                <Outlet />
            </main>
        </div>
    );
}
