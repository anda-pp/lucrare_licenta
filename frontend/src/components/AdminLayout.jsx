import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession, authClient } from '../lib/auth';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Building2,
    Users,
    ShoppingBag,
    Star,
    CreditCard,
    LogOut,
    Palette,
    Calendar,
    CalendarCheck,
    Brush,
    Sun,
    Moon
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        if (!isPending && !session) {
            navigate('/login');
        } else if (!isPending && session && session.user.role !== 'Admin') {
            navigate('/');
        }
    }, [session, isPending, navigate]);

    const handleLogout = async () => {
        await authClient.signOut();
        navigate('/login');
    };

    if (isPending) {
        return <div className="loading">Se încarcă...</div>;
    }

    if (!session) {
        return null;
    }

    if (session.user.role !== 'Admin') {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-area">
                        <Palette className="logo-icon-small" size={24} />
                        <h2>Admin Panel</h2>
                    </div>
                    <p className="user-info">{session.user.name}</p>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span className="nav-label">Dashboard</span>
                    </Link>
                    <Link to="/admin/locations" className={`nav-item ${isActive('/admin/locations') ? 'active' : ''}`}>
                        <Building2 size={20} />
                        <span className="nav-label">Muzee &amp; Galerii</span>
                    </Link>
                    <Link to="/admin/events" className={`nav-item ${isActive('/admin/events') ? 'active' : ''}`}>
                        <Calendar size={20} />
                        <span className="nav-label">Evenimente</span>
                    </Link>
                    <Link to="/admin/reservations" className={`nav-item ${isActive('/admin/reservations') ? 'active' : ''}`}>
                        <CalendarCheck size={20} />
                        <span className="nav-label">Rezervări</span>
                    </Link>
                    <Link to="/admin/artists" className={`nav-item ${isActive('/admin/artists') ? 'active' : ''}`}>
                        <Brush size={20} />
                        <span className="nav-label">Artiști</span>
                    </Link>
                    <div className="nav-divider" />
                    <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
                        <Users size={20} />
                        <span className="nav-label">Utilizatori</span>
                    </Link>
                    <Link to="/admin/orders" className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}>
                        <ShoppingBag size={20} />
                        <span className="nav-label">Comenzi</span>
                    </Link>
                    <Link to="/admin/reviews" className={`nav-item ${isActive('/admin/reviews') ? 'active' : ''}`}>
                        <Star size={20} />
                        <span className="nav-label">Recenzii</span>
                    </Link>
                    <Link to="/admin/loyalty-cards" className={`nav-item ${isActive('/admin/loyalty-cards') ? 'active' : ''}`}>
                        <CreditCard size={20} />
                        <span className="nav-label">Carduri Fidelitate</span>
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

            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}
