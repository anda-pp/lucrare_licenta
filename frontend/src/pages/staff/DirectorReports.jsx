import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Trophy,
    BarChart,
    Users,
    Banknote,
    Star,
    MapPin,
    AlertCircle,
    Info,
    Target,
    TrendingUp,
    Medal,
    Crown,
    Award
} from 'lucide-react';

export default function DirectorReports() {
    const [activeReport, setActiveReport] = useState('loyalty');
    const [loyaltyData, setLoyaltyData] = useState(null);
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeReport === 'loyalty') {
            fetchLoyaltyReport();
        } else if (activeReport === 'performance') {
            fetchPerformanceReport();
        }
    }, [activeReport]);

    const fetchLoyaltyReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/reports/director/loyalty', {
                withCredentials: true,
            });
            setLoyaltyData(response.data.data);
        } catch (err) {
            console.error('Fetch loyalty report error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/reports/director/location-performance', {
                withCredentials: true,
            });
            setPerformanceData(response.data.data);
        } catch (err) {
            console.error('Fetch performance report error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCardLevelColor = (level) => {
        switch (level) {
            case 'BRONZE': return '#64748b'; // Slate
            case 'SILVER': return '#94a3b8'; // Light Slate
            case 'GOLD': return '#0284c7'; // Primary Blue
            case 'PLATINUM': return '#bae6fd'; // Light Blue
            default: return '#64748b';
        }
    };

    const getCardLevelIcon = (level) => {
        switch (level) {
            case 'BRONZE': return <Medal size={32} color="#64748b" />;
            case 'SILVER': return <Medal size={32} color="#94a3b8" />;
            case 'GOLD': return <Crown size={32} color="#0284c7" />;
            case 'PLATINUM': return <Trophy size={32} color="#38bdf8" />;
            default: return <Award size={32} color="#64748b" />;
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Trophy size={24} color="#0284c7" />;
            case 2: return <Medal size={24} color="#64748b" />;
            case 3: return <Medal size={24} color="#94a3b8" />;
            default: return <span className="rank-number">#{rank}</span>;
        }
    };

    if (loading) {
        return <div className="loading">Se încarcă raportul...</div>;
    }

    return (
        <>
            <div className="sub-tabs">
                <button
                    className={`sub-tab ${activeReport === 'loyalty' ? 'active' : ''}`}
                    onClick={() => setActiveReport('loyalty')}
                >
                    <Trophy size={16} />
                    Eficiența Programului de Fidelitate
                </button>
                <button
                    className={`sub-tab ${activeReport === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveReport('performance')}
                >
                    <BarChart size={16} />
                    Performanță Locații
                </button>
            </div>

            {/* Loyalty Report */}
            {activeReport === 'loyalty' && loyaltyData && (
                <div className="report-content">
                    <div className="report-header">
                        <h2>Eficiența Programului de Fidelitate</h2>
                        <p className="report-subtitle">Distribuția utilizatorilor pe niveluri și impactul asupra încasărilor</p>
                    </div>

                    <div className="overall-stats">
                        <div className="stat-box">
                            <div className="stat-icon-bg blue">
                                <Users size={24} />
                            </div>
                            <div className="stat-value">{loyaltyData.efficiency?.totalUsers || 0}</div>
                            <div className="stat-label">Utilizatori cu Card</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg green">
                                <Banknote size={24} />
                            </div>
                            <div className="stat-value">{loyaltyData.efficiency?.totalRevenue?.toFixed(0) || 0} lei</div>
                            <div className="stat-label">Venituri Totale</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg purple">
                                <Star size={24} />
                            </div>
                            <div className="stat-value">{loyaltyData.efficiency?.totalPoints || 0}</div>
                            <div className="stat-label">Puncte Acumulate</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg yellow">
                                <Crown size={24} />
                            </div>
                            <div className="stat-value">{loyaltyData.efficiency?.premiumUserPercentage}%</div>
                            <div className="stat-label">Utilizatori Premium</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg orange">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-value">{loyaltyData.efficiency?.premiumRevenuePercentage}%</div>
                            <div className="stat-label">Venituri Premium</div>
                        </div>
                    </div>

                    {loyaltyData.efficiency?.loyaltyROI !== 'N/A' && (
                        <div className="roi-indicator">
                            <div className="roi-value">
                                <span className="roi-number">{loyaltyData.efficiency.loyaltyROI}x</span>
                                <span className="roi-label">ROI Fidelitate</span>
                            </div>
                            <p className="roi-description">
                                Utilizatorii premium generează de {loyaltyData.efficiency.loyaltyROI}x mai multe venituri
                                per capita comparativ cu media generală.
                            </p>
                        </div>
                    )}

                    <div className="section">
                        <h3><Trophy size={20} /> Distribuție pe Niveluri</h3>
                        <div className="level-distribution">
                            {loyaltyData.levelData?.map((level) => (
                                <div
                                    key={level.tipCard}
                                    className="level-card"
                                    style={{ borderLeftColor: getCardLevelColor(level.tipCard) }}
                                >
                                    <div className="level-header">
                                        <div className="level-icon-wrapper">
                                            {getCardLevelIcon(level.tipCard)}
                                        </div>
                                        <div className="level-info">
                                            <h4>{level.nume || level.tipCard}</h4>
                                            <p className="level-benefits">{level.beneficii}</p>
                                        </div>
                                    </div>

                                    <div className="level-stats-grid">
                                        <div className="level-stat">
                                            <span className="level-stat-value">{level.userCount}</span>
                                            <span className="level-stat-label">Utilizatori ({level.userPercentage}%)</span>
                                        </div>
                                        <div className="level-stat">
                                            <span className="level-stat-value">{level.totalRevenue.toFixed(0)} lei</span>
                                            <span className="level-stat-label">Venituri ({level.revenuePercentage}%)</span>
                                        </div>
                                        <div className="level-stat">
                                            <span className="level-stat-value">{level.orderCount}</span>
                                            <span className="level-stat-label">Comenzi</span>
                                        </div>
                                        <div className="level-stat">
                                            <span className="level-stat-value">{level.avgPoints.toFixed(0)}</span>
                                            <span className="level-stat-label">Puncte Medii</span>
                                        </div>
                                    </div>

                                    <div className="level-revenue-bar">
                                        <div
                                            className="revenue-fill"
                                            style={{
                                                width: `${level.revenuePercentage}%`,
                                                backgroundColor: getCardLevelColor(level.tipCard)
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {loyaltyData.insights?.length > 0 && (
                        <div className="section insights-section">
                            <h3><Info size={20} /> Insight-uri și Recomandări</h3>
                            <div className="insights-list">
                                {loyaltyData.insights.map((insight, index) => (
                                    <div key={index} className={`insight-card insight-${insight.type}`}>
                                        <span className="insight-icon">
                                            {insight.type === 'positive' && <TrendingUp size={20} />}
                                            {insight.type === 'info' && <Info size={20} />}
                                            {insight.type === 'action' && <Target size={20} />}
                                        </span>
                                        <p>{insight.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Location Performance Report */}
            {activeReport === 'performance' && performanceData && (
                <div className="report-content">
                    <div className="report-header">
                        <h2>Performanță Locații</h2>
                        <p className="report-subtitle">Analiza vânzărilor de bilete pe locații</p>
                    </div>

                    {/* Overall Stats */}
                    <div className="overall-stats">
                        <div className="stat-box">
                            <div className="stat-icon-bg blue">
                                <MapPin size={24} />
                            </div>
                            <div className="stat-value">{performanceData.stats?.totalLocations || 0}</div>
                            <div className="stat-label">Locații</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg green">
                                <Banknote size={24} />
                            </div>
                            <div className="stat-value">{performanceData.stats?.totalTickets || 0}</div>
                            <div className="stat-label">Bilete Vândute</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg green">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-value">{parseFloat(performanceData.stats?.totalRevenue || 0).toFixed(0)} lei</div>
                            <div className="stat-label">Venituri Totale</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon-bg purple">
                                <BarChart size={24} />
                            </div>
                            <div className="stat-value">{performanceData.stats?.avgTicketsPerLocation || 0}</div>
                            <div className="stat-label">Media Bilete/Locație</div>
                        </div>
                    </div>

                    {/* Top 3 Performers */}
                    {performanceData.topPerformers?.length > 0 && (
                        <div className="section">
                            <h3><Trophy size={20} /> Top 3 Locații</h3>
                            <div className="top-performers-grid">
                                {performanceData.topPerformers.map((loc) => (
                                    <div key={loc.codUnicLocatie} className="top-performer-card">
                                        <div className="rank-badge">{getRankIcon(loc.rank)}</div>
                                        <h4>{loc.numeLoc}</h4>
                                        <p className="location-city"><MapPin size={14} /> {loc.oras}</p>
                                        <div className="performer-metrics">
                                            <div className="metric">
                                                <span className="metric-value">{loc.totalTickets}</span>
                                                <span className="metric-label">Bilete ({loc.ticketPercentage}%)</span>
                                            </div>
                                            <div className="metric">
                                                <span className="metric-value">{loc.totalRevenue.toFixed(0)} lei</span>
                                                <span className="metric-label">Venituri</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Locations Table */}
                    <div className="section">
                        <h3><BarChart size={20} /> Toate Locațiile</h3>
                        <div className="comparison-table-container">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Locație</th>
                                        <th>Oraș</th>
                                        <th>Bilete</th>
                                        <th>Venituri</th>
                                        <th>Comenzi</th>
                                        <th>Lei/Bilet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {performanceData.locationData?.map((loc) => (
                                        <tr key={loc.codUnicLocatie} className={loc.totalTickets === 0 ? 'row-warning' : ''}>
                                            <td className="rank-cell">{getRankIcon(loc.rank)}</td>
                                            <td className="loc-name">{loc.numeLoc}</td>
                                            <td>{loc.oras}</td>
                                            <td>
                                                <span className="badge">{loc.totalTickets}</span>
                                                <span className="percentage">({loc.ticketPercentage}%)</span>
                                            </td>
                                            <td className="revenue">{loc.totalRevenue.toFixed(2)} lei</td>
                                            <td>{loc.orderCount}</td>
                                            <td>{loc.avgRevenuePerTicket} lei</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Underperformers Warning */}
                    {performanceData.underperformers?.length > 0 && (
                        <div className="section warning-section">
                            <h3><AlertCircle size={20} /> Locații fără Vânzări</h3>
                            <p className="section-subtitle">Aceste locații necesită atenție și promovare</p>
                            <div className="underperformers-list">
                                {performanceData.underperformers.map((loc) => (
                                    <div key={loc.codUnicLocatie} className="underperformer-item">
                                        <span className="location-name"><MapPin size={16} /> {loc.numeLoc}</span>
                                        <span className="location-city">{loc.oras}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    {performanceData.insights?.length > 0 && (
                        <div className="section insights-section">
                            <h3><Info size={20} /> Insight-uri</h3>
                            <div className="insights-list">
                                {performanceData.insights.map((insight, index) => (
                                    <div key={index} className={`insight-card insight-${insight.type}`}>
                                        <span className="insight-icon">
                                            {insight.type === 'positive' && <TrendingUp size={20} />}
                                            {insight.type === 'info' && <Info size={20} />}
                                            {insight.type === 'action' && <Target size={20} />}
                                        </span>
                                        <p>{insight.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
