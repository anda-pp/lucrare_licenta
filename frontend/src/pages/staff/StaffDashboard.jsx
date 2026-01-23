import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users,
    Building2,
    ShoppingBag,
    Star,
    TrendingUp,
    Calendar,
    Trophy,
    Award,
    Banknote
} from 'lucide-react';
import './StaffDashboard.css';

export default function StaffDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');

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
                    <p className="subtitle">Statistici {getRangeLabel()}</p>
                </div>
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

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <Building2 size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Locații</h3>
                        <p className="stat-number">{data?.stats?.locations || 0}</p>
                        <p className="stat-label">Muzee & Galerii</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Utilizatori Noi</h3>
                        <p className="stat-number">{data?.stats?.newUsers || 0}</p>
                        <p className="stat-label">{getRangeLabel()}</p>
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

                <div className="stat-card highlight">
                    <div className="stat-icon-wrapper white">
                        <Banknote size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Venituri</h3>
                        <p className="stat-number">{data?.stats?.totalRevenue?.toFixed(2) || 0} lei</p>
                        <p className="stat-label">din comenzi plătite</p>
                    </div>
                </div>
            </div>

            <div className="rankings-section">
                <div className="ranking-card">
                    <div className="ranking-header">
                        <div className="ranking-icon-wrapper gold">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h2>Top 5 Locații după Venituri</h2>
                            <p className="ranking-subtitle">{getRangeLabel()}</p>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {data?.topLocationsByRevenue?.length > 0 ? (
                            data.topLocationsByRevenue.map((loc, index) => (
                                <div key={loc.id} className="ranking-item">
                                    <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                                    <span className="location-name">{loc.name}</span>
                                    <span className="location-value">{parseFloat(loc.revenue).toFixed(2)} lei</span>
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

                <div className="ranking-card">
                    <div className="ranking-header">
                        <div className="ranking-icon-wrapper purple">
                            <Award size={20} />
                        </div>
                        <div>
                            <h2>Top 5 Locații după Rating</h2>
                            <p className="ranking-subtitle">Rating mediu din recenzii</p>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {data?.topLocationsByRating?.length > 0 ? (
                            data.topLocationsByRating.map((loc, index) => (
                                <div key={loc.id} className="ranking-item">
                                    <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                                    <span className="location-name">{loc.name}</span>
                                    <div className="location-rating">
                                        <div className="stars">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    fill={i < Math.round(parseFloat(loc.avgRating)) ? "#0ea5e9" : "none"}
                                                    stroke={i < Math.round(parseFloat(loc.avgRating)) ? "#0ea5e9" : "#cbd5e1"}
                                                />
                                            ))}
                                        </div>
                                        <span className="rating-number">{parseFloat(loc.avgRating).toFixed(1)}</span>
                                    </div>
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

