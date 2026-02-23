import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../lib/auth';
import { Ticket, Star, CreditCard, MapPin, Calendar, Heart, ChevronRight, Building2 } from 'lucide-react';
import './UserDashboard.css';

const API = 'http://localhost:5000';

const TIER_COLORS = {
    BRONZE: '#cd7f32',
    SILVER: '#94a3b8',
    GOLD: '#f59e0b',
    PLATINUM: '#7c3aed',
};

export default function UserDashboard() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [card, setCard] = useState(null);
    const [interests, setInterests] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const fetchAll = async () => {
            try {
                const [ordersRes, reviewsRes, cardRes, interestsRes, favRes] = await Promise.all([
                    axios.get(`${API}/api/users/my-orders`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-reviews`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-card`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-interests`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-favorites`, { withCredentials: true }),
                ]);
                if (ordersRes.data.success) setOrders(ordersRes.data.data);
                if (reviewsRes.data.success) setReviews(reviewsRes.data.data);
                if (cardRes.data.success) setCard(cardRes.data.data);
                if (interestsRes.data.success) setInterests(interestsRes.data.data);
                if (favRes.data.success) setFavorites(favRes.data.data);
            } catch (err) {
                console.error('Eroare preluare date profil:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [session]);

    if (!session) return null;
    if (loading) return <div className="dashboard-loading">Se încarcă profilul tău...</div>;

    const currentColor = card ? (TIER_COLORS[card.tipUnicCard] || '#94a3b8') : '#94a3b8';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    return (
        <div className="user-dashboard-page">
            <header className="page-header">
                <h1>Bună, {session.user.name}!</h1>
                <p>Acesta este panoul tău de control personal.</p>
            </header>

            {/* ---- STAT CARDS ---- */}
            <div className="dashboard-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue"><Ticket size={24} /></div>
                    <div className="stat-info">
                        <h3>Comenzi plasate</h3>
                        <p className="stat-value">{orders.length}</p>
                        <button className="show-all-btn" onClick={() => navigate('/user/orders')}>Vezi toate →</button>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper yellow"><Star size={24} /></div>
                    <div className="stat-info">
                        <h3>Recenzii scrise</h3>
                        <p className="stat-value">{reviews.length}</p>
                        <button className="show-all-btn" onClick={() => navigate('/user/reviews')}>Vezi toate →</button>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper" style={{ background: `${currentColor}22`, color: currentColor }}>
                        <CreditCard size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Card Fidelitate</h3>
                        <p className="stat-value text-small" style={{ color: currentColor }}>
                            {card ? card.tipUnicCard : '—'}
                        </p>
                        <span className="points-label">{card ? `${card.puncteAcumulate || 0} puncte` : ''}</span>
                        <button className="show-all-btn" onClick={() => navigate('/user/loyalty')}>Află mai multe →</button>
                    </div>
                </div>
            </div>

            {/* ---- EXPANDED PANELS ---- */}
            <div className="dashboard-content-grid">

                {/* Events of Interest */}
                <div className="content-card">
                    <h2><Heart size={20} /> Evenimente de interes <span className="panel-count">{interests.length}</span></h2>
                    {interests.length === 0 ? (
                        <div className="empty-state-interests">
                            <p className="empty-text">Nu ai marcat niciun eveniment ca interesat.</p>
                            <button className="show-all-btn" onClick={() => navigate('/user/events')}>
                                Explorează evenimente →
                            </button>
                        </div>
                    ) : (
                        <div className="interests-list">
                            {interests.slice(0, 5).map(ev => (
                                <div key={ev.interestId} className="interest-item">
                                    <div className="interest-type-tag" style={{
                                        background: ev.tipEveniment === 'Noaptea Muzeelor' ? '#1e293b' : '#f0f9ff',
                                        color: ev.tipEveniment === 'Noaptea Muzeelor' ? '#e2e8f0' : '#0284c7'
                                    }}>
                                        {ev.tipEveniment}
                                    </div>
                                    <div className="interest-info">
                                        <strong>{ev.titlu}</strong>
                                        <span className="interest-meta">
                                            <Calendar size={13} /> {formatDate(ev.dataStart)}
                                            {ev.numeLocatie && <><MapPin size={13} /> {ev.numeLocatie}</>}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} className="interest-arrow" onClick={() => navigate('/user/events')} />
                                </div>
                            ))}
                            <button className="show-all-btn" onClick={() => navigate('/user/events')}>
                                Vezi toate →
                            </button>
                        </div>
                    )}
                </div>

                {/* Favorite Museums */}
                <div className="content-card">
                    <h2><Building2 size={20} /> Muzee favorite <span className="panel-count">{favorites.length}</span></h2>
                    {favorites.length === 0 ? (
                        <div className="empty-state-interests">
                            <p className="empty-text">Nu ai salvat niciun muzeu preferat.</p>
                            <button className="show-all-btn" onClick={() => navigate('/')}>
                                Explorează locații →
                            </button>
                        </div>
                    ) : (
                        <div className="favorites-list">
                            {favorites.slice(0, 5).map(fav => (
                                <div key={fav.id || fav.codUnicLocatie} className="favorite-item">
                                    {fav.imagineUrl ? (
                                        <img src={`${API}${fav.imagineUrl}`} alt={fav.numeLoc} className="fav-thumb" />
                                    ) : (
                                        <div className="fav-thumb fav-thumb-placeholder">
                                            <Building2 size={20} />
                                        </div>
                                    )}
                                    <div className="fav-info">
                                        <strong>{fav.numeLoc}</strong>
                                        <span className="fav-meta">
                                            <span className="fav-type-badge">{fav.tipLocatie}</span>
                                            {fav.orasLoc && <><MapPin size={12} /> {fav.orasLoc}</>}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} className="interest-arrow" />
                                </div>
                            ))}
                            <button className="show-all-btn" onClick={() => navigate('/')}>
                                Vezi toate favorit →
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
