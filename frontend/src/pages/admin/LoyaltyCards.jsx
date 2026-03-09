import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Star, Gift, ChevronRight, Edit, Trash2, CreditCard } from 'lucide-react';
import LoyaltyCardModal from '../../components/LoyaltyCardModal';
import './LoyaltyCards.css';
import './admin-shared.css';

const API = 'http://localhost:5000';

/* Per-tier color palette — matches user-side */
const TIER_COLORS = {
    BRONZE: { accent: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
    SILVER: { accent: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)' },
    GOLD: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    PLATINUM: { accent: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
};

function getTierColors(tipUnicCard) {
    const key = (tipUnicCard || '').toUpperCase();
    return TIER_COLORS[key] || { accent: 'var(--color-primary)', bg: 'var(--color-accent)', border: 'var(--color-border)' };
}

export default function LoyaltyCards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

    useEffect(() => { fetchCards(); }, []);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/loyalty-cards');
            setCards(response.data.data);
            setError('');
        } catch (err) {
            setError('Nu s-au putut încărca cardurile');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => { setEditingCard(null); setShowModal(true); };
    const handleEdit = (card) => { setEditingCard(card); setShowModal(true); };

    const handleSave = async (data) => {
        if (editingCard) {
            await axios.put(`http://localhost:5000/api/loyalty-cards/${editingCard.tipUnicCard}`, data, { withCredentials: true });
        } else {
            await axios.post('http://localhost:5000/api/loyalty-cards', data, { withCredentials: true });
        }
        fetchCards();
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi acest card de fidelitate?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/loyalty-cards/${id}`, { withCredentials: true });
            fetchCards();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="loading">Se încarcă...</div>;

    return (
        <div className="loyalty-cards-page">
            <div className="page-header">
                <h1>Carduri de Fidelitate</h1>
                <button className="btn-primary icon-btn" onClick={handleAdd}>
                    <Plus size={18} /> Adaugă Card
                </button>
            </div>

            {error && <div className="lc-error">{error}</div>}

            <div className="lc-grid">
                {cards.map(card => {
                    const colors = getTierColors(card.tipUnicCard);
                    return (
                        <div
                            key={card.tipUnicCard}
                            className="lc-tier-card"
                            style={{ borderColor: colors.border }}
                        >
                            {/* Icon box */}
                            <div className="lc-icon-box" style={{ background: colors.bg, color: colors.accent }}>
                                <CreditCard size={26} />
                            </div>

                            {/* Tier name */}
                            <h3 className="lc-tier-name" style={{ color: colors.accent }}>
                                {(card.tipUnicCard || card.numeCard).toUpperCase()}
                            </h3>

                            {/* Points threshold */}
                            <div className="lc-threshold">
                                <Star size={13} />
                                de la {card.puncteCard} puncte
                            </div>

                            {/* Special offers */}
                            {card.oferteSpeciale && (
                                <div className="lc-benefit-row special">
                                    <Gift size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <span>{card.oferteSpeciale}</span>
                                </div>
                            )}

                            {/* Welcome offers */}
                            {card.oferteBunVenit && (
                                <div className="lc-benefit-row welcome">
                                    <ChevronRight size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <span>{card.oferteBunVenit}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="lc-actions">
                                <button className="lc-btn-edit icon-btn" onClick={() => handleEdit(card)}>
                                    <Edit size={15} /> Editează
                                </button>
                                <button className="lc-btn-delete icon-btn" onClick={() => handleDelete(card.tipUnicCard)}>
                                    <Trash2 size={15} /> Șterge
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {cards.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon-wrapper"><CreditCard size={48} /></div>
                    <p>Nu există carduri de fidelitate</p>
                    <button className="btn-primary icon-btn" onClick={handleAdd}>
                        <Plus size={18} /> Adaugă primul card
                    </button>
                </div>
            )}

            {showModal && (
                <LoyaltyCardModal
                    card={editingCard}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
