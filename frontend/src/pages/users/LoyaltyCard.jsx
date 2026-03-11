import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Star, Gift, ChevronRight, ArrowLeft } from 'lucide-react';
import { useSession } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import './LoyaltyCard.css';

const API = 'http://localhost:5000';

const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
const TIER_COLORS = {
    BRONZE: {
        main: '#2e1065',
        bg: 'linear-gradient(135deg, #f3e8ff 0%, #b892ff 100%)',
        border: '#a36cf5',
        text: '#2e1065'
    },
    SILVER: {
        main: '#ffffff',
        bg: 'linear-gradient(135deg, #7e22ce 0%, #e9d5ff 100%)',
        border: '#9333ea',
        text: '#ffffff'
    },
    GOLD: {
        main: '#7e22ce',
        bg: 'linear-gradient(135deg, #d8b4fe 0%, #9333ea 100%)',
        border: '#9333ea',
        text: '#ffffff'
    },
    PLATINUM: {
        main: '#f3e8ff',
        bg: 'linear-gradient(135deg, #7e22ce 0%, #2e1065 100%)',
        border: '#9333ea',
        text: '#ffffff'
    },
};

export default function LoyaltyCard() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [card, setCard] = useState(null);
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const load = async () => {
            try {
                const [cardRes, tiersRes] = await Promise.all([
                    axios.get(`${API}/api/users/my-card`, { withCredentials: true }),
                    axios.get(`${API}/api/users/card-tiers`, { withCredentials: true }),
                ]);
                if (cardRes.data.success) setCard(cardRes.data.data);
                if (tiersRes.data.success) setTiers(tiersRes.data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    if (!session || loading) return <div className="lc-loading">Se încarcă...</div>;

    const currentIndex = card ? TIER_ORDER.indexOf(card.tipUnicCard) : -1;
    // Sort tiers in our display order
    const sortedTiers = TIER_ORDER.map(t => tiers.find(x => x.tipUnicCard === t)).filter(Boolean);

    const nextTier = sortedTiers ? sortedTiers[currentIndex + 1] : null;
    const currentPoints = card?.puncteAcumulate || 0;
    const targetPoints = nextTier ? nextTier.puncteCard : null;
    let progressPct = 100;
    if (targetPoints) {
        progressPct = Math.min(100, (currentPoints / targetPoints) * 100);
    }

    return (
        <div className="loyalty-page">
            <button className="profile-back-btn" onClick={() => navigate('/user')}>
                <ArrowLeft size={18} /> Înapoi la cont
            </button>
            <header className="page-header">
                <h1>Card de Fidelitate</h1>
                <p>Acumulează puncte la fiecare vizită și avansează spre beneficii exclusive.</p>
            </header>

            {/* Premium Card Visual */}
            {card ? (
                <div className="premium-card-wrapper">
                    <div className="premium-card" style={{
                        background: TIER_COLORS[card.tipUnicCard]?.bg,
                        color: TIER_COLORS[card.tipUnicCard]?.text,
                        borderColor: TIER_COLORS[card.tipUnicCard]?.border
                    }}>
                        {/* Glow effect */}
                        <div className="card-glow"></div>

                        <div className="card-top-row">
                            <span className="card-header-logo">MUSEUM PASS</span>
                            <span className="card-type-label">VIRTUAL CARD</span>
                        </div>

                        <div className="card-chip-row">
                            <div className="card-chip"></div>
                            <svg className="nfc-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 10A10 10 0 0 1 14 0" transform="translate(3, 4) rotate(45)"></path>
                                <path d="M4 14A6 6 0 0 1 10 8" transform="translate(5, 6) rotate(45)"></path>
                                <path d="M4 18A2 2 0 0 1 6 16" transform="translate(7, 8) rotate(45)"></path>
                            </svg>
                        </div>

                        <div className="card-middle-content">
                            <div className="card-tier-box">
                                <p className="card-tier-sub">Nivel Actual</p>
                                <h2 className="card-tier-name">{card.tipUnicCard}</h2>
                            </div>
                            <div className="card-points-box">
                                <span className="points-big">{currentPoints}</span>
                                <span className="points-sub">PUNCTE</span>
                            </div>
                        </div>

                        <div className="card-bottom-row">
                            <div className="cardholder-info">
                                <p className="card-label-small">CARDHOLDER</p>
                                <p className="cardholder-name">{session.user.name.toUpperCase()}</p>
                            </div>
                            <div className="card-member-since">
                                <p className="card-label-small">MEMBER ID</p>
                                <p className="card-member-id">#{card.nrUnicCard?.slice(0, 8)}</p>
                            </div>
                        </div>

                        {/* Integrated Progress Bar to Next Tier */}
                        {targetPoints && (
                            <div className="card-integrated-progress">
                                <div className="card-progress-bar-wrap">
                                    <div className="card-progress-fill" style={{ width: `${progressPct}%`, backgroundColor: TIER_COLORS[card.tipUnicCard]?.text }}></div>
                                </div>
                                <div className="card-progress-labels">
                                    <span>{currentPoints} pct</span>
                                    <span>{targetPoints} pct pentru {nextTier.tipUnicCard}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="no-card-notice">
                    <CreditCard size={40} strokeWidth={1.5} />
                    <p>Nu ai un card de fidelitate asociat contului tău.</p>
                </div>
            )}

            {/* Progression path */}
            <section className="tiers-section">
                <h2>Niveluri disponibile</h2>
                <div className="tiers-cards">
                    {sortedTiers.map((tier, idx) => {
                        const colors = TIER_COLORS[tier.tipUnicCard] || {};
                        const isCurrent = tier.tipUnicCard === card?.tipUnicCard;
                        const isAchieved = idx <= currentIndex;
                        const isNext = idx === currentIndex + 1;

                        return (
                            <div
                                key={tier.tipUnicCard}
                                className={`tier-card ${isCurrent ? 'tier-current' : ''} ${isAchieved && !isCurrent ? 'tier-achieved' : ''} ${isNext ? 'tier-next' : ''}`}
                                style={{ borderColor: isCurrent ? colors.main : undefined }}
                            >
                                {isCurrent && <div className="tier-current-badge" style={{ background: colors.main }}>Nivelul tău</div>}
                                {isNext && <div className="tier-current-badge next-badge">Următor</div>}

                                <div className="tier-card-icon" style={{ background: colors.bg, color: colors.main }}>
                                    <CreditCard size={28} />
                                </div>

                                <h3 style={{ color: colors.main }}>{tier.tipUnicCard}</h3>

                                {tier.puncteCard > 0 && (
                                    <p className="tier-threshold">
                                        <Star size={14} /> de la {tier.puncteCard} puncte
                                    </p>
                                )}

                                {/* Benefits */}
                                {tier.oferteSpeciale && (
                                    <div className="tier-benefit-row">
                                        <Gift size={14} />
                                        <span>{tier.oferteSpeciale}</span>
                                    </div>
                                )}

                                {tier.oferteBunVenit && (
                                    <div className="tier-benefit-row welcome">
                                        <ChevronRight size={14} />
                                        <span>{tier.oferteBunVenit}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
