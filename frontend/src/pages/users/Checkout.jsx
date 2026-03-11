import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle, ArrowRight, ShieldCheck, Ticket, Tag } from 'lucide-react';
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

    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    // If no state passed (e.g., direct navigation), redirect back
    useEffect(() => {
        if (!state || !state.tickets || state.tickets.length === 0) {
            navigate('/user/locations');
        }
    }, [state, navigate]);

    if (!state) return null;

    const { locationId, tickets, total } = state;

    let finalTotal = total;
    if (appliedPromo) {
        const valoare = parseFloat(appliedPromo.valoare) || 0;
        if (appliedPromo.tip === 'reducere' || appliedPromo.tip === 'Procentaj' || appliedPromo.tip === 'reducere_%') {
            finalTotal = finalTotal - (finalTotal * (valoare / 100));
        } else if (appliedPromo.tip === 'voucher' || appliedPromo.tip === 'SumaFixa' || appliedPromo.tip === 'reducere_fixa') {
            finalTotal = Math.max(0, finalTotal - valoare);
        } else if (appliedPromo.tip === 'bilet_gratuit' || appliedPromo.tip === 'Gratuitate') {
            finalTotal = 0;
        }
    }

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);
        setPromoError('');
        try {
            const res = await axios.post(`${API}/api/users/checkout/validate-promo`, { promoCode }, { withCredentials: true });
            if (res.data.success) {
                setAppliedPromo(res.data.data);
            }
        } catch (err) {
            setPromoError(err.response?.data?.error || 'Cod invalid');
            setAppliedPromo(null);
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const res = await axios.post(`${API}/api/users/checkout`, {
                locationId,
                tickets,
                total,
                promoCode: appliedPromo ? promoCode : undefined
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

                        {/* Promo Code Section */}
                        <div className="checkout-promo-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Ai un cod promoțional?</label>

                            {!appliedPromo ? (
                                <>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Ex: ART-X9B2"
                                            value={promoCode}
                                            onChange={e => {
                                                setPromoCode(e.target.value.toUpperCase());
                                                if (promoError) setPromoError('');
                                            }}
                                            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', fontSize: '0.95rem' }}
                                        />
                                        <button
                                            type="button"
                                            className="checkout-apply-btn"
                                            onClick={handleApplyPromo}
                                            disabled={isApplyingPromo || !promoCode.trim()}
                                        >
                                            {isApplyingPromo ? 'Validare...' : 'Aplică'}
                                        </button>
                                    </div>
                                    {promoError && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{promoError}</p>}
                                </>
                            ) : (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #10b981',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 500 }}>
                                        <Tag size={18} />
                                        <span>Cod <strong style={{ letterSpacing: '1px' }}>{promoCode}</strong> aplicat!</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setAppliedPromo(null); setPromoCode(''); }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                                    >
                                        Șterge
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="checkout-total" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid var(--color-bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                                <span>Subtotal</span>
                                <span>{total.toFixed(2)} Lei</span>
                            </div>
                            {appliedPromo && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'var(--color-success)', fontSize: '1rem', fontWeight: 600 }}>
                                    <span>Reducere Promo</span>
                                    <span>- {(total - finalTotal).toFixed(2)} Lei</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingTop: '1rem', borderTop: '1px dashed var(--color-border)', alignItems: 'center', marginTop: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Total de plată</span>
                                <h2 style={{ color: 'var(--color-primary)', margin: 0, fontSize: '1.6rem' }}>{finalTotal.toFixed(2)} Lei</h2>
                            </div>
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
                                {isProcessing ? 'Se procesează...' : `Plătește ${finalTotal.toFixed(2)} Lei`}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
