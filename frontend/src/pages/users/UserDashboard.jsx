import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../lib/auth';
import { Ticket, Star, CreditCard, CalendarCheck } from 'lucide-react';

// Dashboard sub-components (single responsibility, reusable)
import StatCard from '../../components/dashboard/StatCard';
import InterestsPanel from '../../components/dashboard/InterestsPanel';
import FavoritesPanel from '../../components/dashboard/FavoritesPanel';

import './UserDashboard.css';

const API = 'http://localhost:5000';

const TIER_COLORS = {
    BRONZE: '#cd7f32',
    SILVER: '#94a3b8',
    GOLD: '#f59e0b',
    PLATINUM: '#7c3aed',
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export default function UserDashboard() {
    const { data: session } = useSession();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [card, setCard] = useState(null);
    const [interests, setInterests] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        (async () => {
            try {
                const [ordersRes, reviewsRes, cardRes, interestsRes, favRes, resrvRes] = await Promise.all([
                    axios.get(`${API}/api/users/my-orders`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-reviews`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-card`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-interests`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-favorites`, { withCredentials: true }),
                    axios.get(`${API}/api/users/my-reservations`, { withCredentials: true }),
                ]);
                if (ordersRes.data.success) setOrders(ordersRes.data.data);
                if (reviewsRes.data.success) setReviews(reviewsRes.data.data);
                if (cardRes.data.success) setCard(cardRes.data.data);
                if (interestsRes.data.success) setInterests(interestsRes.data.data);
                if (favRes.data.success) setFavorites(favRes.data.data);
                if (resrvRes.data.success) setReservations(resrvRes.data.data);
            } catch (err) {
                console.error('Eroare preluare date profil:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [session]);

    if (!session) return null;
    if (loading) return <div className="dashboard-loading">Se încarcă profilul tău...</div>;

    const tierColor = card ? (TIER_COLORS[card.tipUnicCard] || '#94a3b8') : '#94a3b8';

    return (
        <div className="user-dashboard-page">
            <header className="page-header">
                <h1>Bună, {session.user.name}!</h1>
                <p>Acesta este panoul tău de control personal.</p>
            </header>

            {/* ── Stat cards ── */}
            <div className="dashboard-stats-grid">
                <StatCard
                    icon={<Ticket size={24} />}
                    iconClass="blue"
                    title="Comenzi plasate"
                    value={orders.length}
                    btnLabel="Vezi toate →"
                    onBtnClick={() => navigate('/user/orders')}
                />
                <StatCard
                    icon={<CalendarCheck size={24} />}
                    iconClass="green"
                    title="Rezervări evenimente"
                    value={reservations.length}
                    btnLabel="Vezi toate →"
                    onBtnClick={() => navigate('/user/reservations')}
                />
                <StatCard
                    icon={<Star size={24} />}
                    iconClass="yellow"
                    title="Recenzii scrise"
                    value={reviews.length}
                    btnLabel="Vezi toate →"
                    onBtnClick={() => navigate('/user/reviews')}
                />
                <StatCard
                    icon={<CreditCard size={24} />}
                    iconStyle={{ background: `${tierColor}22`, color: tierColor }}
                    title="Card Fidelitate"
                    value={card ? card.tipUnicCard : '—'}
                    valueStyle={{ color: tierColor, fontSize: '1rem' }}
                    subLabel={card ? `${card.puncteAcumulate || 0} puncte` : ''}
                    btnLabel="Află mai multe →"
                    onBtnClick={() => navigate('/user/loyalty')}
                />
            </div>

            {/* ── Expanded panels ── */}
            <div className="dashboard-content-grid">
                <InterestsPanel
                    interests={interests}
                    formatDate={formatDate}
                    onNavigate={navigate}
                />
                <FavoritesPanel
                    favorites={favorites}
                    onNavigate={navigate}
                />
            </div>
        </div>
    );
}
