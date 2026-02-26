import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import axios from 'axios';
import './Checkout.css';

const API = 'http://localhost:5000';

export default function Checkout() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        nume: '',
        card: '',
        exp: '',
        cvv: ''
    });

    // If no state passed (e.g., direct navigation), redirect back
    useEffect(() => {
        if (!state || !state.tickets || state.tickets.length === 0) {
            navigate('/user/locations');
        }
    }, [state, navigate]);

    if (!state) return null;

    const { locationId, tickets, total } = state;

    const handleCheckout = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const res = await axios.post(`${API}/api/users/checkout`, {
                locationId,
                tickets,
                total
            }, { withCredentials: true });

            if (res.data.success) {
                setIsSuccess(true);
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'A apărut o eroare la procesarea plății.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="checkout-page success-container">
                <div className="checkout-success-card">
                    <CheckCircle size={64} color="#10b981" strokeWidth={1.5} />
                    <h2>Plată Finalizată!</h2>
                    <p>Comanda ta a fost procesată cu succes. Biletele în format PDF au fost generate și adăugate în contul tău.</p>
                    <button className="base-btn primary-btn mt-6" onClick={() => navigate('/user/orders')}>
                        Vezi Comenzile Mele <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <button className="back-btn" onClick={() => navigate(`/user/locations/${locationId}`)}>
                <ArrowLeft size={16} /> Înapoi la locație
            </button>

            <div className="checkout-layout">
                {/* Left Column: Order Summary */}
                <div className="checkout-summary-col">
                    <div className="checkout-card">
                        <h3>Sumar Comandă</h3>
                        <div className="checkout-tickets-list">
                            {tickets.map((t, idx) => (
                                <div key={idx} className="checkout-ticket-item">
                                    <div className="checkout-ticket-info">
                                        <Ticket size={16} className="text-muted" />
                                        <span>{t.cantitate}x {t.tipBilet}</span>
                                    </div>
                                    <strong>{(t.pret * t.cantitate).toFixed(2)} Lei</strong>
                                </div>
                            ))}
                        </div>
                        <div className="checkout-total">
                            <span>Total de plată</span>
                            <h2>{total.toFixed(2)} Lei</h2>
                        </div>
                    </div>

                    <div className="checkout-trust-badge">
                        <ShieldCheck size={20} color="#8b5cf6" />
                        <p>Plată securizată (Mod Simulare). Tranzacția este procesată anonim pentru demonstrație.</p>
                    </div>
                </div>

                {/* Right Column: Payment Form */}
                <div className="checkout-form-col">
                    <div className="checkout-card">
                        <div className="checkout-card-header">
                            <CreditCard size={24} color="#1e1b4b" />
                            <h3>Detalii Plată</h3>
                        </div>
                        <form className="checkout-form" onSubmit={handleCheckout}>
                            <div className="input-group">
                                <label>Nume titular card</label>
                                <input
                                    type="text"
                                    placeholder="Ion Popescu"
                                    required
                                    value={formData.nume}
                                    onChange={e => setFormData({ ...formData, nume: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Număr Card</label>
                                <input
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength="19"
                                    required
                                    value={formData.card}
                                    onChange={e => setFormData({ ...formData, card: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Expirare (LL/AA)</label>
                                    <input
                                        type="text"
                                        placeholder="12/26"
                                        maxLength="5"
                                        required
                                        value={formData.exp}
                                        onChange={e => setFormData({ ...formData, exp: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>CVV / CVC</label>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        maxLength="3"
                                        required
                                        value={formData.cvv}
                                        onChange={e => setFormData({ ...formData, cvv: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="base-btn primary-btn checkout-submit-btn"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Se procesează...' : `Plătește ${total.toFixed(2)} Lei`}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
