import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

// Pagina afișată când utilizatorul anulează plata în Stripe Checkout sau apare o eroare de procesare
export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
                padding: '3rem', maxWidth: '450px', width: '100%',
                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)',
                textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'
            }}>
                <XCircle size={72} color="#ef4444" strokeWidth={1.5} />
                <div>
                    <h2 style={{ color: 'var(--color-navy)', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Plată Anulată</h2>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                        Nu a fost efectuată nicio plată. Coșul tău de cumpărături este intact.
                    </p>
                </div>

                <div style={{
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', width: '100%'
                }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#b91c1c' }}>
                        Plata a fost anulată sau a apărut o eroare la procesare. Poți încerca din nou oricând.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                    <button
                        className="base-btn primary-btn"
                        onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} /> Încearcă Din Nou
                    </button>
                    <button
                        className="base-btn secondary-btn"
                        onClick={() => navigate('/user/locations')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={16} /> Înapoi la Muzee
                    </button>
                </div>
            </div>
        </div>
    );
}
