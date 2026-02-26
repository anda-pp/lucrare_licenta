import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Star, Gift, ChevronRight } from 'lucide-react';
import { useSession } from '../../lib/auth';
import './LoyaltyCard.css';

const API = 'http://localhost:5000';

const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
const TIER_COLORS = {
    BRONZE: { main: '#cd7f32', bg: '#fdf6ec', border: '#e8c99a' },
    SILVER: { main: '#94a3b8', bg: '#f8fafc', border: '#cbd5e1' },
    GOLD: { main: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    PLATINUM: { main: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
};

export default function LoyaltyCard() {
    const { data: session } = useSession();
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

    return (
        <div className="loyalty-page">
            <header className="page-header">
                <h1>Card de Fidelitate</h1>
                <p>Acumulează puncte la fiecare vizită și avansează spre beneficii exclusive.</p>
            </header>

            {/* Current card visual */}
            {card ? (
                <div className="my-card-visual" style={{
                    borderColor: TIER_COLORS[card.tipUnicCard]?.border,
                    background: `linear-gradient(135deg, ${TIER_COLORS[card.tipUnicCard]?.bg}, var(--color-bg))`,
                }}>
                    <div className="card-visual-chip" style={{ background: TIER_COLORS[card.tipUnicCard]?.main }}></div>
                    <div className="card-visual-body">
                        <div>
                            <p className="card-visual-label">Nivelul tău actual</p>
                            <p className="card-visual-tier" style={{ color: TIER_COLORS[card.tipUnicCard]?.main }}>
                                {card.tipUnicCard}
                            </p>
                        </div>
                        <div className="card-visual-pts">
                            <span className="pts-number">{card.puncteAcumulate || 0}</span>
                            <span className="pts-label">PUNCTE</span>
                        </div>
                    </div>
                    {card.beneficii && <p className="card-visual-benefit">{card.beneficii}</p>}
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

                                {/* Progress bar only for current tier */}
                                {isCurrent && sortedTiers[idx + 1]?.puncteCard > 0 && (
                                    <div className="tier-progress">
                                        <div className="tier-progress-bar">
                                            <div
                                                className="tier-progress-fill"
                                                style={{
                                                    width: `${Math.min(100, ((card.puncteAcumulate || 0) / sortedTiers[idx + 1].puncteCard) * 100)}%`,
                                                    background: colors.main,
                                                }}
                                            />
                                        </div>
                                        <p className="tier-progress-label">
                                            {card.puncteAcumulate || 0} / {sortedTiers[idx + 1].puncteCard} pct până la {sortedTiers[idx + 1].tipUnicCard}
                                        </p>
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
