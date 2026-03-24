import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession, authClient } from '../lib/auth';
import { useTheme } from '../context/ThemeContext';
import { 
    LayoutDashboard, 
    Landmark, 
    CalendarDays, 
    Users, 
    Ticket, 
    MessageSquare, 
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import './AdminLayout.css'; // Reusing standard admin styles

export default function MuseumAdminLayout() {
    const { data: session, isPending } = useSession();
    const location = useLocation();
    const navigate = useNavigate();

    const { theme, toggleTheme } = useTheme();

    if (isPending) return <div className="loading">Se încarcă...</div>;

    // Only 'Admin' can access this layout
    if (!session?.user || session.user.role !== 'Admin') {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = async () => {
        await authClient.signOut();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-area">
                        <Landmark className="logo-icon-small" size={24} />
                        <h2 style={{ fontSize: '1.2rem' }}>Manager Muzeu</h2>
                    </div>
                    <p className="user-info">{session.user.name}</p>
                </div>
                
                <nav className="sidebar-nav">
                    <Link to="/admin" className={`nav-item ${isActive('/admin')}`}>
                        <LayoutDashboard size={20} />
                        <span className="nav-label">Dashboard</span>
                    </Link>
                    <Link to="/admin/my-museum" className={`nav-item ${isActive('/admin/my-museum')}`}>
                        <Landmark size={20} />
                        <span className="nav-label">Muzeul Meu</span>
                    </Link>
                    <Link to="/admin/events" className={`nav-item ${isActive('/admin/events')}`}>
                        <CalendarDays size={20} />
                        <span className="nav-label">Evenimente</span>
                    </Link>
                    <Link to="/admin/reservations" className={`nav-item ${isActive('/admin/reservations')}`}>
                        <Users size={20} />
                        <span className="nav-label">Rezervări</span>
                    </Link>
                    <Link to="/admin/orders" className={`nav-item ${isActive('/admin/orders')}`}>
                        <Ticket size={20} />
                        <span className="nav-label">Comenzi Bilete</span>
                    </Link>
                    <Link to="/admin/reviews" className={`nav-item ${isActive('/admin/reviews')}`}>
                        <MessageSquare size={20} />
                        <span className="nav-label">Recenzii & Opinii</span>
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
