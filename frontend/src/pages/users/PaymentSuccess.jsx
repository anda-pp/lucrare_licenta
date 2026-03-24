import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');

    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!sessionId) {
            navigate('/user/locations');
            return;
        }

        // Poll session status – webhook may need a moment to create the order
        let attempts = 0;
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API}/api/stripe/session/${sessionId}`, { withCredentials: true });
                if (res.data.success && res.data.status === 'paid') {
                    setSessionData(res.data);
                    setLoading(false);
                    clearInterval(interval);
                }
            } catch {
                // keep polling
            }
            attempts++;
            if (attempts > 10) {
                // After ~5s, show success anyway (webhook may be slightly delayed)
                setLoading(false);
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [sessionId, navigate]);

    return (
        <div style={{
            minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
                padding: '3rem', maxWidth: '500px', width: '100%',
                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)',
                textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'
            }}>
                {loading ? (
                    <>
                        <Loader2 size={56} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                        <h2 style={{ color: 'var(--color-navy)', margin: 0 }}>Se confirmă plata...</h2>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Așteptăm confirmarea de la Stripe. Durează câteva secunde.</p>
                    </>
                ) : (
                    <>
                        <CheckCircle size={72} color="#10b981" strokeWidth={1.5} />
                        <div>
                            <h2 style={{ color: 'var(--color-navy)', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Plată Confirmată!</h2>
                            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                                {sessionData
                                    ? `Am primit plata de ${sessionData.amountTotal?.toFixed(2)} ${sessionData.currency}. `
                                    : ''}
                                Biletele tale sunt gata!
                            </p>
                        </div>

                        <div style={{
                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', width: '100%'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857' }}>
                                ✓ Comanda a fost înregistrată în contul tău<br />
                                ✓ Biletele PDF sunt disponibile pentru descărcare<br />
                                ✓ Puncte de fidelitate acordate
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                            <button
                                className="btn-primary"
                                onClick={() => navigate('/user/orders')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                Comenzile Mele <ArrowRight size={16} />
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => navigate('/user/locations')}
                            >
                                Explorează mai mult
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
