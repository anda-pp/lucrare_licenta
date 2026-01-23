import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession, authClient } from '../lib/auth';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    Building2,
    Users,
    ShoppingBag,
    Star,
    CreditCard,
    LogOut,
    Palette
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const location = useLocation();

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
                        Dashboard
                    </Link>
                    <Link to="/admin/locations" className={`nav-item ${isActive('/admin/locations') ? 'active' : ''}`}>
                        <Building2 size={20} />
                        Muzee & Galerii
                    </Link>
                    <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
                        <Users size={20} />
                        Utilizatori
                    </Link>
                    <Link to="/admin/orders" className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}>
                        <ShoppingBag size={20} />
                        Comenzi
                    </Link>
                    <Link to="/admin/reviews" className={`nav-item ${isActive('/admin/reviews') ? 'active' : ''}`}>
                        <Star size={20} />
                        Recenzii
                    </Link>
                    <Link to="/admin/loyalty-cards" className={`nav-item ${isActive('/admin/loyalty-cards') ? 'active' : ''}`}>
                        <CreditCard size={20} />
                        Carduri Fidelitate
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        Deconectare
                    </button>
                </div>
            </aside>

            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}

