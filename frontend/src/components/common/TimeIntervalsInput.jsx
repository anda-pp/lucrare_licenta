import { useState } from 'react';
import { Clock, X } from 'lucide-react';

/**
 * Time intervals add / remove UI for event forms.
 *
 * Props:
 *  - intervals   (string[])           – current list, e.g. ["10:00 - 12:00"]
 *  - onChange     (newIntervals)       – called with updated array
 *  - onError      (msg)               – optional, for inline error feedback
 *  - label        (string)            – section title (default "Intervale Orare")
 *  - required     (bool)              – show "obligatoriu" hint
 */
export default function TimeIntervalsInput({
    intervals = [],
    onChange,
    onError,
    label = 'Intervale Orare',
    required = false,
}) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleAdd = () => {
        if (!startTime || !endTime) return;
        if (startTime >= endTime) {
            onError?.('Ora de început trebuie să fie mai mică decât ora de sfârșit.');
            return;
        }
        const intervalStr = `${startTime} - ${endTime}`;
        if (intervals.includes(intervalStr)) {
            onError?.('Acest interval a fost deja adăugat.');
            return;
        }
        onError?.('');
        onChange([...intervals, intervalStr]);
        setStartTime('');
        setEndTime('');
    };

    const handleRemove = (idx) => {
        onChange(intervals.filter((_, i) => i !== idx));
    };

    return (
        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> {label}
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>–</span>
                <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button type="button" className="btn-secondary" onClick={handleAdd}>
                    Adaugă
                </button>
            </div>

            {intervals.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {intervals.map((intv, idx) => (
                        <span
                            key={idx}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                background: '#ede9fe', color: '#6d28d9',
                                padding: '0.25rem 0.6rem', borderRadius: '20px',
                                fontSize: '0.82rem', fontWeight: 500,
                            }}
                        >
                            {intv}
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, display: 'flex' }}
                            >
                                <X size={13} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {required && intervals.length === 0 && (
                <small style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Adăugarea a cel puțin un interval este obligatorie.
                </small>
            )}
        </div>
    );
}
