import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart2,
    PieChart,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
    Minus,
    AlertTriangle,
    Star,
    MessageSquare,
    MapPin,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import DirectorReports from './DirectorReports';
import './Reports.css';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('marketing');
    const [activeMarketingReport, setActiveMarketingReport] = useState('sentiment');
    const [sentimentData, setSentimentData] = useState(null);
    const [correlationData, setCorrelationData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'marketing') {
            if (activeMarketingReport === 'sentiment') {
                fetchSentimentAnalysis();
            } else if (activeMarketingReport === 'correlation') {
                fetchCorrelationData();
            }
        }
    }, [activeTab, activeMarketingReport]);

    const fetchSentimentAnalysis = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/reports/marketing/sentiment', {
                withCredentials: true,
            });
            setSentimentData(response.data.data);
        } catch (err) {
            console.error('Fetch sentiment error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCorrelationData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/reports/marketing/correlation', {
                withCredentials: true,
            });
            setCorrelationData(response.data.data);
        } catch (err) {
            console.error('Fetch correlation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'rating-positive';
        if (rating >= 3) return 'rating-neutral';
        return 'rating-negative';
    };

    const renderStars = (rating) => {
        return (
            <div className="star-rating-mini">
                <Star size={14} fill={rating >= 4 ? "#0ea5e9" : rating >= 3 ? "#94a3b8" : "#cbd5e1"} stroke="none" />
            </div>
        );
    };

    const getCorrelationClass = (corr) => {
        if (corr >= 0.4) return 'correlation-positive';
        if (corr >= -0.1) return 'correlation-neutral';
        return 'correlation-negative';
    };

    if (loading) {
        return <div className="loading">Se încarcă rapoartele...</div>;
    }

    return (
        <div className="reports-page">
            <div className="page-header">
                <h1>Rapoarte</h1>
            </div>

            <div className="report-tabs">
                <button
                    className={`tab ${activeTab === 'marketing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('marketing')}
                >
                    <BarChart2 size={18} />
                    Marketing
                </button>
                <button
                    className={`tab ${activeTab === 'director' ? 'active' : ''}`}
                    onClick={() => setActiveTab('director')}
                >
                    <PieChart size={18} />
                    Director General
                </button>
            </div>

            {activeTab === 'marketing' && (
                <>
                    <div className="sub-tabs">
                        <button
                            className={`sub-tab ${activeMarketingReport === 'sentiment' ? 'active' : ''}`}
                            onClick={() => setActiveMarketingReport('sentiment')}
                        >
                            <MessageSquare size={16} />
                            Analiză Sentiment
                        </button>
                        <button
                            className={`sub-tab ${activeMarketingReport === 'correlation' ? 'active' : ''}`}
                            onClick={() => setActiveMarketingReport('correlation')}
                        >
                            <Activity size={16} />
                            Corelație Rating-Vânzări
                        </button>
                    </div>

                    {/* Sentiment Analysis */}
                    {activeMarketingReport === 'sentiment' && sentimentData && (
                        <div className="report-content">
                            <div className="report-header">
                                <h2>Analiză Sentiment</h2>
                                <p className="report-subtitle">Evaluarea satisfacției clienților pe locații</p>
                            </div>

                            <div className="overall-stats">
                                <div className="stat-box">
                                    <div className="stat-icon-bg blue">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div className="stat-value">{sentimentData.overallStats?.totalReviews || 0}</div>
                                    <div className="stat-label">Total Recenzii</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-bg green">
                                        <ThumbsUp size={24} />
                                    </div>
                                    <div className="stat-value">{sentimentData.overallStats?.positiveCount || 0}</div>
                                    <div className="stat-label">Pozitive (4-5 <Star size={12} strokeWidth={3} className="inline-icon" />)</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-bg yellow">
                                        <Minus size={24} />
                                    </div>
                                    <div className="stat-value">{sentimentData.overallStats?.neutralCount || 0}</div>
                                    <div className="stat-label">Neutre (3 <Star size={12} strokeWidth={3} className="inline-icon" />)</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-bg red">
                                        <ThumbsDown size={24} />
                                    </div>
                                    <div className="stat-value">{sentimentData.overallStats?.negativeCount || 0}</div>
                                    <div className="stat-label">Negative (1-2 <Star size={12} strokeWidth={3} className="inline-icon" />)</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-bg purple">
                                        <Star size={24} />
                                    </div>
                                    <div className="stat-value">{parseFloat(sentimentData.overallStats?.avgRating || 0).toFixed(1)}</div>
                                    <div className="stat-label">Rating Mediu</div>
                                </div>
                            </div>

                            <div className="section">
                                <h3><MapPin size={20} /> Rating Mediu pe Locație</h3>
                                <div className="location-ratings-grid">
                                    {sentimentData.locationRatings?.map((loc) => (
                                        <div key={loc.codUnicLocatie} className="location-rating-card">
                                            <div className="location-header">
                                                <h4>{loc.numeLoc}</h4>
                                                <span className={`rating-badge ${getRatingColor(parseFloat(loc.avgRating))}`}>
                                                    <Star size={12} fill="currentColor" /> {parseFloat(loc.avgRating).toFixed(1)}
                                                </span>
                                            </div>
                                            <p className="location-address">{loc.adresa}</p>
                                            <div className="sentiment-breakdown">
                                                <span className="positive"><ThumbsUp size={12} /> {loc.positiveReviews || 0}</span>
                                                <span className="neutral"><Minus size={12} /> {loc.neutralReviews || 0}</span>
                                                <span className="negative"><ThumbsDown size={12} /> {loc.negativeReviews || 0}</span>
                                                <span className="total">Total: {loc.totalReviews || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="section negative-reviews-section">
                                <h3><AlertTriangle size={20} /> Recenzii Negative (≤2 <Star size={16} strokeWidth={2.5} className="inline-icon" />)</h3>
                                <p className="section-subtitle">Recenzii care necesită atenție</p>

                                {sentimentData.negativeReviews?.length > 0 ? (
                                    <div className="negative-reviews-list">
                                        {sentimentData.negativeReviews.map((review) => (
                                            <div key={review.numarRecenzie} className="negative-review-card">
                                                <div className="review-header">
                                                    <div className="review-rating-stars">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                fill={i < review.rating ? "#0f172a" : "none"}
                                                                stroke={i < review.rating ? "#0f172a" : "#cbd5e1"}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="review-location">
                                                        <MapPin size={14} /> {review.numeLoc}
                                                    </span>
                                                </div>
                                                <p className="review-text">"{review.descriereRecenzie}"</p>
                                                <div className="review-footer">
                                                    <span className="review-author">
                                                        <User size={14} /> {review.userName}
                                                    </span>
                                                    <span className="review-date">
                                                        <Calendar size={14} />
                                                        {review.dataRecenzie ? new Date(review.dataRecenzie).toLocaleDateString('ro-RO') : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state success">
                                        <div className="empty-icon-wrapper green">
                                            <ThumbsUp size={32} />
                                        </div>
                                        <p>Nu există recenzii negative! Toate locațiile au feedback pozitiv.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Correlation Analysis */}
                    {activeMarketingReport === 'correlation' && correlationData && (
                        <div className="report-content">
                            <div className="report-header">
                                <h2>Corelație Rating-Vânzări</h2>
                                <p className="report-subtitle">Impactul calității serviciilor asupra încasărilor</p>
                            </div>

                            {/* Correlation Coefficient */}


                            {/* Overall Stats */}
                            <div className="overall-stats">
                                <div className="stat-box">
                                    <div className="stat-icon-bg purple">
                                        <Star size={24} />
                                    </div>
                                    <div className="stat-value">{correlationData.stats?.avgRatingOverall?.toFixed(1) || 0}</div>
                                    <div className="stat-label">Rating Mediu</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-bg green">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="stat-value">{correlationData.stats?.totalRevenueOverall?.toFixed(0) || 0} lei</div>
                                    <div className="stat-label">Total Venituri</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-bg blue">
                                        <BarChart2 size={24} />
                                    </div>
                                    <div className="stat-value">{correlationData.stats?.avgRevenuePerLocation?.toFixed(0) || 0} lei</div>
                                    <div className="stat-label">Media/Locație</div>
                                </div>
                            </div>

                            {/* Location Comparison Table */}
                            <div className="section">
                                <h3><Activity size={20} /> Comparație Locații</h3>
                                <div className="comparison-table-container">
                                    <table className="comparison-table">
                                        <thead>
                                            <tr>
                                                <th>Locație</th>
                                                <th>Rating</th>
                                                <th>Recenzii</th>
                                                <th>Venituri</th>
                                                <th>Comenzi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {correlationData.locationData?.map((loc) => (
                                                <tr key={loc.codUnicLocatie}>
                                                    <td className="loc-name">{loc.numeLoc}</td>
                                                    <td>
                                                        <span className={`rating-badge ${getRatingColor(loc.avgRating)}`}>
                                                            <Star size={12} fill="currentColor" /> {loc.avgRating.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td>{loc.totalReviews}</td>
                                                    <td className="revenue">{loc.totalRevenue.toFixed(2)} lei</td>
                                                    <td>{loc.totalOrders}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* At Risk Locations */}
                            {correlationData.atRiskLocations?.length > 0 && (
                                <div className="section warning-section">
                                    <h3><AlertTriangle size={20} /> Locații la Risc</h3>
                                    <p className="section-subtitle">Rating scăzut + venituri sub medie</p>
                                    <div className="at-risk-list">
                                        {correlationData.atRiskLocations.map((loc) => (
                                            <div key={loc.codUnicLocatie} className="at-risk-card">
                                                <div className="risk-header">
                                                    <h4>{loc.numeLoc}</h4>
                                                    <span className="rating-badge rating-negative">
                                                        <ArrowDownRight size={14} /> {loc.avgRating.toFixed(1)} <Star size={12} fill="#64748b" stroke="none" />
                                                    </span>
                                                </div>
                                                <div className="risk-stats">
                                                    <span> {loc.totalRevenue.toFixed(0)} lei</span>
                                                    <span> {loc.totalReviews} recenzii</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* High Performers */}
                            {correlationData.highPerformers?.length > 0 && (
                                <div className="section success-section">
                                    <h3><TrendingUp size={20} /> Performeri de Top</h3>
                                    <p className="section-subtitle">Rating ridicat + venituri peste medie</p>
                                    <div className="performers-list">
                                        {correlationData.highPerformers.map((loc) => (
                                            <div key={loc.codUnicLocatie} className="performer-card">
                                                <div className="performer-header">
                                                    <h4>{loc.numeLoc}</h4>
                                                    <span className="rating-badge rating-positive">
                                                        <ArrowUpRight size={14} /> {loc.avgRating.toFixed(1)} <Star size={12} fill="#0ea5e9" stroke="none" />
                                                    </span>
                                                </div>
                                                <div className="performer-stats">
                                                    <span> {loc.totalRevenue.toFixed(0)} lei</span>
                                                    <span> {loc.totalReviews} recenzii</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'director' && (
                <DirectorReports />
            )}
        </div>
    );
}
