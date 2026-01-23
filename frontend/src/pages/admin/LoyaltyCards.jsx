import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Award, Trophy, Key, Gift, Edit, Trash2, Ticket, CreditCard } from 'lucide-react';
import LoyaltyCardModal from '../../components/LoyaltyCardModal';
import './LoyaltyCards.css';

export default function LoyaltyCards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/loyalty-cards');
            setCards(response.data.data);
            setError('');
        } catch (err) {
            setError('Nu s-au putut încărca cardurile');
            console.error('Fetch cards error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCard(null);
        setShowModal(true);
    };

    const handleEdit = (card) => {
        setEditingCard(card);
        setShowModal(true);
    };

    const handleSave = async (data) => {
        try {
            if (editingCard) {
                await axios.put(
                    `http://localhost:5000/api/loyalty-cards/${editingCard.tipUnicCard}`,
                    data,
                    { withCredentials: true }
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/loyalty-cards',
                    data,
                    { withCredentials: true }
                );
            }
            fetchCards();
        } catch (err) {
            throw err;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi acest card de fidelitate?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/loyalty-cards/${id}`, {
                withCredentials: true,
            });
            fetchCards();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) {
        return <div className="loading">Se încarcă...</div>;
    }

    return (
        <div className="loyalty-cards-page">
            <div className="page-header">
                <h1>Carduri de Fidelitate</h1>
                <button className="btn-primary" onClick={handleAdd}>
                    <Plus size={18} />
                    Adaugă Card
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="cards-grid">
                {cards.map((card) => (
                    <div key={card.tipUnicCard} className="loyalty-card">
                        <div className="card-overlay"></div>
                        <div className="card-info">
                            <div className="card-header-icon">
                                <Award size={32} />
                            </div>
                            <h3>{card.numeCard}</h3>

                            <div className="card-detail-group">
                                <Trophy size={16} className="detail-icon" />
                                <p className="card-points">Puncte necesare: {card.puncteCard}</p>
                            </div>

                            <div className="card-detail-group">
                                <Key size={16} className="detail-icon" />
                                <p className="card-type">{card.tipUnicCard}</p>
                            </div>

                            {card.oferteSpeciale && (
                                <div className="card-offer">
                                    <div className="offer-header">
                                        <Gift size={16} />
                                        <strong>Oferte Speciale:</strong>
                                    </div>
                                    <p>{card.oferteSpeciale}</p>
                                </div>
                            )}

                            {card.oferteBunVenit && (
                                <div className="card-offer">
                                    <div className="offer-header">
                                        <Ticket size={16} />
                                        <strong>Oferte Bun Venit:</strong>
                                    </div>
                                    <p>{card.oferteBunVenit}</p>
                                </div>
                            )}
                        </div>

                        <div className="card-actions">
                            <button className="btn-edit-card" onClick={() => handleEdit(card)}>
                                <Edit size={16} />
                                Editează
                            </button>
                            <button className="btn-delete-card" onClick={() => handleDelete(card.tipUnicCard)}>
                                <Trash2 size={16} />
                                Șterge
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {cards.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon-wrapper">
                        <CreditCard size={48} />
                    </div>
                    <p>Nu există carduri de fidelitate</p>
                    <button className="btn-primary" onClick={handleAdd}>
                        <Plus size={18} />
                        Adaugă primul card
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

