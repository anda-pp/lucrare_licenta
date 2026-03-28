import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { LayoutDashboard, BarChart2, LogOut, UserCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './StaffLayout.css';

export default function StaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme, toggleTheme } = useTheme();

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
            // Only allow Personal role
            if (sessionData.data.user.role !== 'Personal') {
                navigate('/');
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
        return <div className="loading">Se încarcă...</div>;
    }

    if (!session) {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div className="staff-layout">
            <aside className="staff-sidebar">
                <div className="sidebar-header">
                    <div className="logo-area">
                        <UserCheck className="logo-icon-small" size={24} />
                        <h2>Staff Panel</h2>
                    </div>
                    <p className="user-info">{session.user.name}</p>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/staff" className={`nav-item ${isActive('/staff') ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span className="nav-label">Dashboard</span>
                    </Link>
                    <Link to="/staff/museum-reports" className={`nav-item ${isActive('/staff/museum-reports') ? 'active' : ''}`}>
                        <BarChart2 size={20} />
                        <span className="nav-label">Rapoarte Muzeu</span>
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

            <main className="staff-content">
                <Outlet />
            </main>
        </div>
    );
}

