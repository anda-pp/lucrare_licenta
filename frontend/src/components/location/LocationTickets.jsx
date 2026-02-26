import { useState } from 'react';
import { Ticket, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TICKET_COLORS = {
    Adult: '#6366f1',
    Elev: '#0ea5e9',
    Student: '#10b981',
    Pensionar: '#f59e0b',
    Altele: '#94a3b8',
};

export default function LocationTickets({ tickets, locationId }) {
    const navigate = useNavigate();
    const [selection, setSelection] = useState({});

    const updateQuantity = (codUnic, delta) => {
        setSelection(prev => {
            const current = prev[codUnic] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [codUnic]: next };
        });
    };

    const subtotal = tickets.reduce((sum, t) => {
        return sum + (t.pret * (selection[t.codUnicTipBilet] || 0));
    }, 0);

    const handleCheckout = () => {
        const ticketsPayload = tickets.map(t => ({
            codUnicTipBilet: t.codUnicTipBilet,
            tipBilet: t.tipBilet,
            pret: t.pret,
            cantitate: selection[t.codUnicTipBilet] || 0
        })).filter(t => t.cantitate > 0);

        navigate('/user/checkout', {
            state: {
                locationId,
                tickets: ticketsPayload,
                total: subtotal
            }
        });
    };

    return (
        <div className="loc-tickets-card">
            <h3><Ticket size={18} /> Cumpără Bilete</h3>
            <div className="loc-tickets-list">
                {tickets.map(t => {
                    const qty = selection[t.codUnicTipBilet] || 0;
                    return (
                        <div key={t.codUnicTipBilet} className="loc-ticket-row interactive">
                            <div className="loc-ticket-info">
                                <div className="loc-ticket-type" style={{ color: TICKET_COLORS[t.tipBilet] || '#64748b' }}>
                                    <span className="loc-ticket-dot" style={{ background: TICKET_COLORS[t.tipBilet] || '#64748b' }} />
                                    {t.tipBilet}
                                </div>
                                <span className="loc-ticket-price">{t.pret.toFixed(2)} Lei</span>
                            </div>
                            <div className="loc-ticket-actions">
                                <button
                                    className="qty-btn"
                                    onClick={() => updateQuantity(t.codUnicTipBilet, -1)}
                                    disabled={qty === 0}
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="qty-display">{qty}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => updateQuantity(t.codUnicTipBilet, 1)}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {subtotal > 0 && (
                <div className="loc-tickets-footer">
                    <div className="subtotal-info">
                        <span>Subtotal:</span>
                        <strong>{subtotal.toFixed(2)} Lei</strong>
                    </div>
                    <button
                        className="base-btn primary-btn w-full"
                        onClick={handleCheckout}
                    >
                        Continuă la Plată
                    </button>
                </div>
            )}
        </div>
    );
}
