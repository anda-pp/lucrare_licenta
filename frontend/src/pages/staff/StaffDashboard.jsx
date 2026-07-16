import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users,
    ShoppingBag,
    Star,
    TrendingUp,
    Calendar,
    CalendarDays,
    Ticket,
    Banknote,
    MessageSquare
} from 'lucide-react';
import './StaffDashboard.css';

export default function StaffDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Filtrul de perioadă — implicit pe lună, poate fi week / month / year
    const [dateRange, setDateRange] = useState('month');

    // Reîncărcăm datele de fiecare dată când se schimbă filtrul de perioadă
    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/staff/dashboard?range=${dateRange}`, {
                withCredentials: true,
            });
            setData(response.data.data);
        } catch (err) {
            console.error('Fetch dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Text descriptiv pentru subtitlu — se afișează în header lângă numele muzeului
    const getRangeLabel = () => {
        switch (dateRange) {
            case 'week': return 'în ultima săptămână';
            case 'month': return 'în ultima lună';
            case 'year': return 'în ultimul an';
            default: return '';
        }
    };

    if (loading) {
        return <div className="loading">Se încarcă dashboard-ul...</div>;
    }

    return (
        <div className="staff-dashboard">
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Dashboard</h1>
                    <p className="subtitle">
                        {data?.muzeu?.name
                            ? `${data.muzeu.name} · Statistici ${getRangeLabel()}`
                            : `Statistici ${getRangeLabel()}`}
                    </p>
                </div>
                {/* Selector perioadă — valoarea se trimite ca query param la backend */}
                <div className="date-filter">
                    <Calendar size={18} className="filter-icon" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="date-range-select"
                    >
                        <option value="week">Ultima săptămână</option>
                        <option value="month">Ultima lună</option>
                        <option value="year">Ultimul an</option>
                    </select>
                </div>
            </div>

            {/* Carduri KPI principale — afișăm 4 metrici cheie ale perioadei */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Clienți Noi</h3>
                        <p className="stat-number">{data?.stats?.newUsers || 0}</p>
                        <p className="stat-label">prima comandă la noi {getRangeLabel()}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Comenzi Noi</h3>
                        <p className="stat-number">{data?.stats?.newOrders || 0}</p>
                        <p className="stat-label">{getRangeLabel()}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper orange">
                        <Star size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Recenzii Noi</h3>
                        <p className="stat-number">{data?.stats?.newReviews || 0}</p>
                        <p className="stat-label">{getRangeLabel()}</p>
                    </div>
                </div>

                {/* Veniturile sunt evidențiate separat: bilete de intrare vs bilete la evenimente */}
                <div className="stat-card highlight">
                    <div className="stat-icon-wrapper white">
                        <Banknote size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Venituri Muzeu</h3>
                        <p className="stat-number">{Number(data?.stats?.revenueMuseum || 0).toFixed(2)} lei</p>
                        <p className="stat-label">bilete intrare plătite</p>
                    </div>
                </div>

                <div className="stat-card highlight">
                    <div className="stat-icon-wrapper white">
                        <CalendarDays size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Venituri Evenimente</h3>
                        <p className="stat-number">{Number(data?.stats?.revenueEvents || 0).toFixed(2)} lei</p>
                        <p className="stat-label">bilete evenimente plătite</p>
                    </div>
                </div>
            </div>

            <div className="rankings-section">
                {/* Clasamentul tipurilor de bilete vândute în perioada selectată */}
                <div className="ranking-card">
                    <div className="ranking-header">
                        <div className="ranking-icon-wrapper gold">
                            <Ticket size={20} />
                        </div>
                        <div>
                            <h2>Top Tipuri Bilete Vândute</h2>
                            <p className="ranking-subtitle">comenzi plătite · {data?.muzeu?.name}</p>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {data?.topTicketTypes?.length > 0 ? (
                            data.topTicketTypes.map((ticket, index) => (
                                <div key={`${ticket.tipBilet}-${ticket.pret}`} className="ranking-item">
                                    <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                                    <span className="location-name">
                                        {ticket.tipBilet}
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>
                                            {Number(ticket.pret).toFixed(2)} lei/buc
                                        </span>
                                    </span>
                                    <span className="location-value">
                                        {Number(ticket.cantitate)} buc · {Number(ticket.venituri).toFixed(2)} lei
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">
                                <TrendingUp size={48} />
                                <p>Nu sunt date disponibile pentru această perioadă</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ultimele 5 recenzii — staff-ul le poate monitoriza rapid fără să deschidă alt tab */}
                <div className="ranking-card">
                    <div className="ranking-header">
                        <div className="ranking-icon-wrapper purple">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h2>Recenzii Recente</h2>
                            <p className="ranking-subtitle">ultimele 5 recenzii · {data?.muzeu?.name}</p>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {data?.recentReviews?.length > 0 ? (
                            data.recentReviews.map((review) => (
                                <div key={review.numarRecenzie} className="ranking-item" style={{ alignItems: 'flex-start', gap: '12px' }}>
                                    <div className="stars" style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                fill={i < review.rating ? '#f59e0b' : 'none'}
                                                stroke={i < review.rating ? '#f59e0b' : '#cbd5e1'}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{review.userName || 'Utilizator anonim'}</p>
                                        {review.descriere && (
                                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {review.descriere}
                                            </p>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                        {review.data ? new Date(review.data).toLocaleDateString('ro-RO') : ''}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">
                                <Star size={48} />
                                <p>Nu sunt recenzii disponibile</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
