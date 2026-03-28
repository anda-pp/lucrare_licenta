import { Ticket, Trash2 } from 'lucide-react';

const DEFAULT_TYPES = ['Adult', 'Elev', 'Student', 'Pensionar', 'Altele'];

/**
 * Ticket types manager for event forms (paid events).
 *
 * Props:
 *  - tickets      ({tip, pret}[])  – current list
 *  - onChange      (newTickets)     – called with updated array
 *  - ticketTypes   (string[])      – available type labels (default DEFAULT_TYPES)
 */
export default function EventTicketsInput({
    tickets = [],
    onChange,
    ticketTypes = DEFAULT_TYPES,
}) {
    const updateAt = (idx, field, value) => {
        const updated = [...tickets];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    return (
        <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Ticket size={16} /> Tipuri de Bilete
                </label>
                <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.82rem' }}
                    onClick={() => onChange([...tickets, { tip: ticketTypes[0], pret: '' }])}
                >
                    + Adaugă Bilet
                </button>
            </div>

            {tickets.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                    Niciun tip de bilet definit. Adaugă cel puțin unul.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tickets.map((bilet, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                                value={bilet.tip}
                                onChange={e => updateAt(idx, 'tip', e.target.value)}
                                style={{ flex: 1 }}
                            >
                                {ticketTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Preț"
                                    value={bilet.pret}
                                    onChange={e => updateAt(idx, 'pret', e.target.value)}
                                    style={{ width: '100%', paddingRight: '2.5rem' }}
                                />
                                <span style={{
                                    position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                                    fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600,
                                }}>
                                    LEI
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onChange(tickets.filter((_, i) => i !== idx))}
                                style={{
                                    background: 'none', border: '1px solid #fca5a5', borderRadius: '6px',
                                    cursor: 'pointer', color: '#ef4444', padding: '0.4rem',
                                    display: 'flex', alignItems: 'center',
                                }}
                                title="Șterge biletul"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
