import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Ticket, Tag, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './Checkout.css';

const API = 'http://localhost:5000';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK);

// ─── Inner form that uses Stripe hooks ───────────────────────────────────────
function StripePaymentForm({ finalTotal, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handlePay = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMsg('');

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/user/payment/success` },
            redirect: 'if_required', // stay on page if no redirect needed
        });

        if (error) {
            setErrorMsg(error.message || 'A apărut o eroare.');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--color-input-bg)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        wallets: { applePay: 'never', googlePay: 'never' }
                    }}
                />
            </div>

            {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '0.9rem 1.25rem', color: '#dc2626', fontSize: '0.9rem' }}>
                    {errorMsg}
                </div>
            )}

            <button
                type="submit"
                className="base-btn primary-btn checkout-submit-btn"
                disabled={!stripe || isProcessing}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
            >
                {isProcessing ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Se procesează...</>
                ) : (
                    <>Plătește {finalTotal.toFixed(2)} Lei</>
                )}
            </button>
        </form>
    );
}

// ─── Main Checkout component ──────────────────────────────────────────────────
export default function Checkout() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [clientSecret, setClientSecret] = useState('');
    const [isLoadingIntent, setIsLoadingIntent] = useState(false);
    const [intentError, setIntentError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

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
                // Reset intent so it gets recreated with new total
                setClientSecret('');
            }
        } catch (err) {
            setPromoError(err.response?.data?.error || 'Cod invalid');
            setAppliedPromo(null);
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const handleCreateIntent = async () => {
        setIsLoadingIntent(true);
        setIntentError('');
        try {
            const res = await axios.post(`${API}/api/stripe/create-payment-intent`, {
                locationId,
                tickets,
                promoCode: appliedPromo ? promoCode : undefined,
            }, { withCredentials: true });

            if (res.data.success) {
                setClientSecret(res.data.clientSecret);
            }
        } catch (err) {
            setIntentError(err.response?.data?.error || 'Eroare la inițializarea plății.');
        } finally {
            setIsLoadingIntent(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (isSuccess) {
        return (
            <div className="checkout-page success-container">
                <div className="checkout-success-card">
                    <CheckCircle size={64} color="#10b981" strokeWidth={1.5} />
                    <h2>Plată Finalizată!</h2>
                    <p>Comanda ta a fost procesată cu succes. Biletele sunt disponibile în contul tău.</p>
                    <button className="base-btn primary-btn mt-6" onClick={() => navigate('/user/orders')}>
                        Vezi Comenzile Mele <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // ── Stripe appearance matching app theme ──────────────────────────────────
    const stripeAppearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#9333ea',
            colorBackground: '#faf5ff',
            colorText: '#2e1065',
            colorDanger: '#ef4444',
            fontFamily: 'Outfit, system-ui, sans-serif',
            borderRadius: '10px',
        },
    };

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

                        {/* Promo Code */}
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Ai un cod promoțional?</label>

                            {!appliedPromo ? (
                                <>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Ex: ART-X9B2"
                                            value={promoCode}
                                            onChange={e => { setPromoCode(e.target.value.toUpperCase()); if (promoError) setPromoError(''); }}
                                            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text-main)', fontSize: '0.95rem' }}
                                        />
                                        <button type="button" className="checkout-apply-btn" onClick={handleApplyPromo} disabled={isApplyingPromo || !promoCode.trim()}>
                                            {isApplyingPromo ? 'Validare...' : 'Aplică'}
                                        </button>
                                    </div>
                                    {promoError && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{promoError}</p>}
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 500 }}>
                                        <Tag size={18} />
                                        <span>Cod <strong style={{ letterSpacing: '1px' }}>{promoCode}</strong> aplicat!</span>
                                    </div>
                                    <button type="button" onClick={() => { setAppliedPromo(null); setPromoCode(''); setClientSecret(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                        Șterge
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid var(--color-bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                <span>Subtotal</span><span>{total.toFixed(2)} Lei</span>
                            </div>
                            {appliedPromo && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                                    <span>Reducere Promo</span><span>- {(total - finalTotal).toFixed(2)} Lei</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px dashed var(--color-border)', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Total de plată</span>
                                <h2 style={{ color: 'var(--color-primary)', margin: 0, fontSize: '1.6rem' }}>{finalTotal.toFixed(2)} Lei</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Embedded Stripe */}
                <div className="checkout-form-col">
                    <div className="checkout-card">
                        <div className="checkout-card-header">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '26px' }} />
                            <h3>Detalii Plată</h3>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            {!clientSecret ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ background: 'var(--color-input-bg)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid var(--color-border)', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                                        Card test: <code style={{ background: 'rgba(147,51,234,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>4242 4242 4242 4242</code> · Orice dată viitoare · Orice CVV
                                    </div>

                                    {intentError && (
                                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '0.9rem', color: '#dc2626', fontSize: '0.9rem' }}>
                                            {intentError}
                                        </div>
                                    )}

                                    <button
                                        className="base-btn primary-btn checkout-submit-btn"
                                        onClick={handleCreateIntent}
                                        disabled={isLoadingIntent}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                    >
                                        {isLoadingIntent
                                            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Se pregătește...</>
                                            : <>Continuă spre plată — {finalTotal.toFixed(2)} Lei</>
                                        }
                                    </button>
                                </div>
                            ) : (
                                <Elements
                                    stripe={stripePromise}
                                    options={{ clientSecret, appearance: stripeAppearance }}
                                >
                                    <StripePaymentForm
                                        finalTotal={finalTotal}
                                        onSuccess={() => setIsSuccess(true)}
                                    />
                                </Elements>
                            )}
                        </div>
                    </div>

                    <div className="checkout-trust-badge">
                        <ShieldCheck size={20} color="#8b5cf6" />
                        <p>Plată procesată securizat prin <strong>Stripe</strong>. Datele cardului nu sunt stocate pe serverele noastre.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
