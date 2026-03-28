import { Ticket, Calendar } from 'lucide-react';

/**
 * Order summary card showing tickets, date, subtotal, promo discount and total.
 *
 * Props:
 *  - tickets       ({cantitate, tipBilet, pret}[])
 *  - dataVizita    (string|null)
 *  - subtotal      (number)
 *  - finalTotal    (number)
 *  - appliedPromo  (object|null)
 *  - children      (ReactNode) – extra content (e.g., PromoCodeInput)
 */
export default function OrderSummaryCard({
    tickets,
    dataVizita,
    subtotal,
    finalTotal,
    appliedPromo,
    children,
}) {
    return (
        <div className="checkout-card">
            <h3>Sumar Comandă</h3>

            {dataVizita && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.9rem', background: 'rgba(139,92,246,0.07)',
                    borderRadius: 'var(--radius-md)', marginBottom: '1rem',
                    fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600,
                }}>
                    <Calendar size={16} />
                    Data vizitei: {new Date(dataVizita + 'T12:00:00').toLocaleDateString('ro-RO', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                </div>
            )}

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

            {/* Promo code slot */}
            {children}

            {/* Totals */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                marginTop: '1.5rem', paddingTop: '1.5rem',
                borderTop: '2px solid var(--color-bg)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    <span>Subtotal</span><span>{subtotal.toFixed(2)} Lei</span>
                </div>
                {appliedPromo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                        <span>Reducere Promo</span><span>- {(subtotal - finalTotal).toFixed(2)} Lei</span>
                    </div>
                )}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: '1rem', borderTop: '1px dashed var(--color-border)', alignItems: 'center',
                }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Total de plată</span>
                    <h2 style={{ color: 'var(--color-primary)', margin: 0, fontSize: '1.6rem' }}>{finalTotal.toFixed(2)} Lei</h2>
                </div>
            </div>
        </div>
    );
}
