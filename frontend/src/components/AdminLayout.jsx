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
    Moon,
    Gift,
    Trophy,
    Map,
    Ticket
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
        } else if (!isPending && session && session.user.role !== 'Superadmin') {
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

    if (session.user.role !== 'Superadmin') {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-area">
                        <Palette className="logo-icon-small" size={24} />
                        <h2>Superadmin Dashboard</h2>
                    </div>
                    <p className="user-info">{session.user.name}</p>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/superadmin" className={`nav-item ${isActive('/superadmin') ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span className="nav-label">Dashboard</span>
                    </Link>
                    <Link to="/superadmin/locations" className={`nav-item ${isActive('/superadmin/locations') ? 'active' : ''}`}>
                        <Building2 size={20} />
                        <span className="nav-label">Muzee &amp; Galerii</span>
                    </Link>
                    <Link to="/superadmin/events" className={`nav-item ${isActive('/superadmin/events') ? 'active' : ''}`}>
                        <Calendar size={20} />
                        <span className="nav-label">Evenimente</span>
                    </Link>
                    <Link to="/superadmin/reservations" className={`nav-item ${isActive('/superadmin/reservations') ? 'active' : ''}`}>
                        <CalendarCheck size={20} />
                        <span className="nav-label">Rezervări</span>
                    </Link>
                    <Link to="/superadmin/artists" className={`nav-item ${isActive('/superadmin/artists') ? 'active' : ''}`}>
                        <Brush size={20} />
                        <span className="nav-label">Artiști</span>
                    </Link>
                    <div className="nav-divider" />
                    <Link to="/superadmin/users" className={`nav-item ${isActive('/superadmin/users') ? 'active' : ''}`}>
                        <Users size={20} />
                        <span className="nav-label">Utilizatori</span>
                    </Link>
                    <Link to="/superadmin/orders" className={`nav-item ${isActive('/superadmin/orders') ? 'active' : ''}`}>
                        <ShoppingBag size={20} />
                        <span className="nav-label">Comenzi</span>
                    </Link>
                    <Link to="/superadmin/reviews" className={`nav-item ${isActive('/superadmin/reviews') ? 'active' : ''}`}>
                        <Star size={20} />
                        <span className="nav-label">Recenzii</span>
                    </Link>
                    <Link to="/superadmin/trails" className={`nav-item ${isActive('/superadmin/trails') ? 'active' : ''}`}>
                        <Map size={20} />
                        <span className="nav-label">Trasee Culturale</span>
                    </Link>
                    <Link to="/superadmin/loyalty-cards" className={`nav-item ${isActive('/superadmin/loyalty-cards') ? 'active' : ''}`}>
                        <CreditCard size={20} />
                        <span className="nav-label">Carduri Fidelitate</span>
                    </Link>
                    <div className="nav-divider" />
                    <Link to="/superadmin/rewards" className={`nav-item ${isActive('/superadmin/rewards') ? 'active' : ''}`}>
                        <Gift size={20} />
                        <span className="nav-label">Catalog Recompense</span>
                    </Link>
                    <Link to="/superadmin/badges" className={`nav-item ${isActive('/superadmin/badges') ? 'active' : ''}`}>
                        <Trophy size={20} />
                        <span className="nav-label">Catalog Insigne</span>
                    </Link>
                    <Link to="/superadmin/vouchers" className={`nav-item ${isActive('/superadmin/vouchers') ? 'active' : ''}`}>
                        <Ticket size={20} />
                        <span className="nav-label">Vouchere</span>
                    </Link>
                    <div className="nav-divider" />
                    <Link to="/superadmin/staff-accounts" className={`nav-item ${isActive('/superadmin/staff-accounts') ? 'active' : ''}`}>
                        <Users size={20} />
                        <span className="nav-label">Staff & Admini Muzee</span>
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
