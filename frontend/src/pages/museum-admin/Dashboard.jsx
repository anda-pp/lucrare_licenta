import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    CalendarDays, 
    MessageSquare, 
    Ticket, 
    CreditCard, 
    TrendingUp, 
    Activity,
    Users,
    Banknote
} from 'lucide-react';
import { useSession } from '../../lib/auth';
import '../admin/Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({
        events: 0,
        reviews: 0,
        orders: 0,
        ticketsSold: 0,
        reservations: 0,
        revenueMuseum: 0,
        revenueEvents: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await axios.get(`${API}/api/museum-admin/dashboard`, { withCredentials: true });
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'A apărut o eroare la încărcarea statisticilor.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="loading">Se încarcă tabloul de bord...</div>;
    if (error) return <div className="loading" style={{ color: 'var(--color-danger)' }}>{error}</div>;

    const statCardsData = [
        { icon: <CreditCard size={28} />, label: 'Venituri Muzeu', value: `${Number(stats.revenueMuseum || 0).toFixed(0)} Lei`, sub: 'Bilete intrare plătite', color: '#10b981' },
        { icon: <Banknote size={28} />, label: 'Venituri Evenimente', value: `${Number(stats.revenueEvents || 0).toFixed(0)} Lei`, sub: 'Bilete evenimente plătite', color: '#6366f1' },
        { icon: <Ticket size={28} />, label: 'Bilete Vândute', value: stats.ticketsSold, sub: 'Total bucăți (cantitate)', color: '#3b82f6' },
        { icon: <CalendarDays size={28} />, label: 'Evenimentele Tale', value: stats.events, sub: 'Organizate aici', color: '#8b5cf6' },
        { icon: <Users size={28} />, label: 'Prezențe Confirmate', value: stats.reservations, sub: 'Din rezervări', color: '#f59e0b' },
        { icon: <MessageSquare size={28} />, label: 'Recenzii Primite', value: stats.reviews, sub: 'Pentru acest muzeu', color: '#ec4899' }
    ];

    return (
        <div className="dashboard-page">
            <h1 className="page-title">Panoul Muzeului</h1>
            <p className="subtitle">Bun venit înapoi, {session?.user?.name}! Aici este sumarul activității exclusive locației tale.</p>

            {/* Stat Cards Grid */}
            <div className="stats-grid">
                {statCardsData.map(({ icon, label, value, sub, color }) => (
                    <div key={label} className="stat-card" style={{ '--stat-color': color }}>
                        <div className="stat-icon-wrapper" style={{ background: `${color}18`, color }}>
                            {icon}
                        </div>
                        <div className="stat-content">
                            <h3>{label}</h3>
                            <p className="stat-number">{value}</p>
                            <p className="stat-label">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders Section */}
            <div className="activity-grid">
                <div className="activity-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="activity-header">
                        <Activity size={18} />
                        <h2>Ultimele Achiziții de Bilete</h2>
                    </div>
                    
                    {stats.recentOrders.length === 0 ? (
                        <p className="activity-empty">Nu există tranzacții recente pentru această locație.</p>
                    ) : (
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th># Comandă</th>
                                    <th>Cumpărător</th>
                                    <th>Data Plății</th>
                                    <th>Stare</th>
                                    <th>Valoare</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map((order, i) => (
                                    <tr key={i}>
                                        <td><strong>#{order.numarComanda}</strong></td>
                                        <td>{order.userName || 'Vizitator Anonim'}</td>
                                        <td className="muted">
                                            {new Date(order.dataComanda).toLocaleDateString('ro-RO', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td>
                                            <span className={`status-chip ${
                                                order.statusPlata === 'Plătit' ? 'chip-success' :
                                                order.statusPlata === 'În așteptare' ? 'chip-warn' :
                                                'chip-danger'
                                            }`}>
                                                {order.statusPlata}
                                            </span>
                                        </td>
                                        <td><strong>{order.totalPlata.toFixed(2)} Lei</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
