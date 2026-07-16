import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Users, Receipt, MessageSquare, Calendar, CalendarCheck, TrendingUp, Star, ShoppingBag } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        locations: 0,
        users: 0,
        orders: 0,
        reviews: 0,
        events: 0,
        reservations: 0,
        revenue: 0,
        recentOrders: [],
        recentReviews: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
                withCredentials: true,
            });
            setStats(response.data.data);
        } catch (err) {
            console.error('Fetch stats error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <h1 className="page-title">Dashboard</h1>
            <p className="subtitle">Bine ai venit în panoul de administrare!</p>

            {/* Cardurile KPI — construite dintr-un array pentru a evita repetarea JSX */}
            <div className="stats-grid">
                {[
                    { icon: <Building2 size={28} />, label: 'Locații', value: stats.locations, sub: 'Muzee & Galerii', color: '#6366f1' },
                    { icon: <Users size={28} />, label: 'Utilizatori', value: stats.users, sub: 'Înregistrați', color: '#0ea5e9' },
                    { icon: <Calendar size={28} />, label: 'Evenimente', value: stats.events ?? 0, sub: 'Total', color: '#8b5cf6' },
                    { icon: <CalendarCheck size={28} />, label: 'Rezervări', value: stats.reservations ?? 0, sub: 'Gratuite', color: '#10b981' },
                    { icon: <ShoppingBag size={28} />, label: 'Comenzi', value: stats.orders, sub: 'Total', color: '#f59e0b' },
                    { icon: <MessageSquare size={28} />, label: 'Recenzii', value: stats.reviews, sub: 'Total', color: '#ec4899' },
                    { icon: <TrendingUp size={28} />, label: 'Venituri', value: `${Number(stats.revenue ?? 0).toFixed(0)} Lei`, sub: 'Comenzi plătite', color: '#14b8a6' },
                ].map(({ icon, label, value, sub, color }) => (
                    <div key={label} className="stat-card" style={{ '--stat-color': color }}>
                        <div className="stat-icon-wrapper" style={{ background: `${color}18`, color }}>
                            {icon}
                        </div>
                        <div className="stat-content">
                            <h3>{label}</h3>
                            <p className="stat-number">{loading ? '...' : value}</p>
                            <p className="stat-label">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabelele de activitate recentă — comenzi și recenzii din ultimele zile */}
            <div className="activity-grid">
                <div className="activity-card">
                    <div className="activity-header">
                        <ShoppingBag size={18} />
                        <h2>Comenzi Recente</h2>
                    </div>
                    {loading ? (
                        <div className="activity-loading">Se încarcă...</div>
                    ) : (stats.recentOrders?.length > 0) ? (
                        <table className="activity-table">
                            <thead><tr><th>Utilizator</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
                            <tbody>
                                {stats.recentOrders.map(o => (
                                    <tr key={o.numarComanda}>
                                        <td>{o.userName || '—'}</td>
                                        <td><strong>{Number(o.totalPlata).toFixed(2)} Lei</strong></td>
                                        <td>
                                            <span className={`status-chip ${o.statusPlata === 'Plătit' ? 'chip-success' : o.statusPlata === 'Eșuat' ? 'chip-danger' : 'chip-warn'}`}>
                                                {o.statusPlata}
                                            </span>
                                        </td>
                                        <td className="muted">{o.dataComanda ? new Date(o.dataComanda).toLocaleDateString('ro-RO') : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="activity-empty">Nicio comandă înregistrată.</p>
                    )}
                </div>

                <div className="activity-card">
                    <div className="activity-header">
                        <Star size={18} />
                        <h2>Recenzii Recente</h2>
                    </div>
                    {loading ? (
                        <div className="activity-loading">Se încarcă...</div>
                    ) : (stats.recentReviews?.length > 0) ? (
                        <table className="activity-table">
                            <thead><tr><th>Utilizator</th><th>Locație</th><th>Rating</th><th>Data</th></tr></thead>
                            <tbody>
                                {stats.recentReviews.map(r => (
                                    <tr key={r.numarRecenzie}>
                                        <td>{r.userName || '—'}</td>
                                        <td>{r.numeLoc || '—'}</td>
                                        <td>
                                            {/* Stele Unicode pentru rating — mai ușor decât o componentă separată */}
                                            <span className="rating-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                        </td>
                                        <td className="muted">{r.dataRecenzie ? new Date(r.dataRecenzie).toLocaleDateString('ro-RO') : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="activity-empty">Nicio recenzie înregistrată.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
