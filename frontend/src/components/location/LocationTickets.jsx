import { Ticket } from 'lucide-react';

const TICKET_COLORS = {
    Adult: '#6366f1',
    Elev: '#0ea5e9',
    Student: '#10b981',
    Pensionar: '#f59e0b',
    Altele: '#94a3b8',
};

/**
 * LocationTickets — displays ticket types and prices
 */
export default function LocationTickets({ tickets }) {
    return (
        <div className="loc-tickets-card">
            <h3><Ticket size={18} /> Prețuri bilete</h3>
            <div className="loc-tickets-list">
                {tickets.map(t => (
                    <div key={t.codUnicTipBilet} className="loc-ticket-row">
                        <div className="loc-ticket-type" style={{ color: TICKET_COLORS[t.tipBilet] || '#64748b' }}>
                            <span className="loc-ticket-dot" style={{ background: TICKET_COLORS[t.tipBilet] || '#64748b' }} />
                            {t.tipBilet}
                        </div>
                        <span className="loc-ticket-price">{t.pret.toFixed(2)} Lei</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
