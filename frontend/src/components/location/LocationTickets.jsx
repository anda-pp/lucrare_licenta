import { useState, useMemo } from 'react';
import { Ticket, Minus, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Culori asociate fiecărui tip de bilet pentru puncte vizuale în listă
const TICKET_COLORS = {
    Adult: '#6366f1',
    Elev: '#0ea5e9',
    Student: '#10b981',
    Pensionar: '#f59e0b',
    Altele: '#94a3b8',
};

const today = new Date().toISOString().split('T')[0];

// Mapare nume zi română → număr 1(Lun)..7(Dum), apoi spre formatul getDay() din JS (0=Dum, 1=Lun..6=Sâm)
const ZILE_RO = {
    'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4,
    'Vineri': 5, 'Sâmbătă': 6, 'Duminică': 7,
};
const TO_JS_DAY = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0 };

// Parsăm orarul locației (format: "Luni–Vineri: 09:00–17:00|Sâmbătă: Închis|Duminică: Închis")
// și returnăm un Set cu zilele (JS getDay()) în care locația este închisă
function parseClosedDays(orar) {
    if (!orar) return new Set();
    const closed = new Set();

    const segments = orar.split('|').map(s => s.trim());
    for (const seg of segments) {
        if (!seg.toLowerCase().includes('închis')) continue;
        const dayPart = seg.split(':')[0].trim();

        // Interval de zile: "Luni–Marți" sau "Duminică–Luni"
        const rangeMatch = dayPart.match(/(.+)[–\-](.+)/);
        if (rangeMatch) {
            const start = ZILE_RO[rangeMatch[1].trim()];
            const end   = ZILE_RO[rangeMatch[2].trim()];
            if (!start || !end) continue;
            if (end >= start) {
                for (let d = start; d <= end; d++) closed.add(TO_JS_DAY[d]);
            } else {
                // Wrap de la Duminică înapoi la Luni (ex: Duminică–Luni → 7, 1)
                for (let d = start; d <= 7; d++) closed.add(TO_JS_DAY[d]);
                for (let d = 1; d <= end; d++) closed.add(TO_JS_DAY[d]);
            }
        } else {
            // Zi singulară: "Luni: Închis"
            const day = ZILE_RO[dayPart];
            if (day !== undefined) closed.add(TO_JS_DAY[day]);
        }
    }
    return closed;
}

const ZI_LABEL = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

// Componenta de selectare și cumpărare bilete pentru o locație
// Calculăm subtotalul client-side pentru UX, dar prețul final e recalculat server-side la checkout
export default function LocationTickets({ tickets, locationId, orar, minDate, maxDate }) {
    const navigate = useNavigate();
    const [selection, setSelection] = useState({});
    const [dataVizita, setDataVizita] = useState('');

    const effectiveMin = minDate || today;
    // Parsăm zilele închise o singură dată pe baza orarului — memoizăm pentru performanță
    const closedDays = useMemo(() => parseClosedDays(orar), [orar]);

    // Verificăm dacă data selectată cade într-o zi de închidere
    const isClosedDay = dataVizita
        ? closedDays.has(new Date(dataVizita + 'T12:00:00').getDay())
        : false;

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

    // Checkout-ul e disponibil doar dacă există cel puțin un bilet, o dată selectată și nu e zi de închidere
    const canCheckout = subtotal > 0 && dataVizita && !isClosedDay;

    const handleCheckout = () => {
        if (!canCheckout) return;
        // Trecem biletele selectate prin React Router state — Checkout.jsx le recalculează server-side
        const ticketsPayload = tickets.map(t => ({
            codUnicTipBilet: t.codUnicTipBilet,
            tipBilet: t.tipBilet,
            pret: t.pret,
            cantitate: selection[t.codUnicTipBilet] || 0
        })).filter(t => t.cantitate > 0);

        navigate('/user/checkout', {
            state: { locationId, tickets: ticketsPayload, total: subtotal, dataVizita }
        });
    };

    // Text dinamic pe butonul de checkout care ghidează utilizatorul pas cu pas
    const checkoutLabel = () => {
        if (subtotal === 0) return 'Selectează bilete pentru a continua';
        if (!dataVizita) return 'Alege data vizitei pentru a continua';
        if (isClosedDay) return 'Muzeul este închis în ziua selectată';
        return `Continuă la Plată — ${subtotal.toFixed(2)} Lei`;
    };

    const closedDayNames = [...closedDays].map(d => ZI_LABEL[d]).join(', ');

    return (
        <div className="loc-tickets-card">
            <h3><Ticket size={18} /> Cumpără Bilete</h3>

            {/* Selectorul de dată cu validare pentru zilele de închidere */}
            <div className="loc-date-row">
                <label className="loc-date-label">
                    <Calendar size={15} />
                    Data vizitei
                </label>
                <input
                    type="date"
                    className={`loc-date-input${isClosedDay ? ' loc-date-input--error' : ''}`}
                    value={dataVizita}
                    min={effectiveMin}
                    max={maxDate || undefined}
                    onChange={e => setDataVizita(e.target.value)}
                />
                {isClosedDay && (
                    <div className="loc-date-closed-msg">
                        <AlertTriangle size={14} />
                        Muzeul este <strong>închis</strong> în această zi ({ZI_LABEL[new Date(dataVizita + 'T12:00:00').getDay()]}).
                        {closedDayNames && <> Zile închise: <strong>{closedDayNames}</strong>.</>}
                    </div>
                )}
                {closedDays.size > 0 && !isClosedDay && (
                    <p className="loc-date-hint">
                        Închis în: {closedDayNames}
                    </p>
                )}
            </div>

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

            <div className="loc-tickets-footer">
                {subtotal > 0 && (
                    <div className="subtotal-info">
                        <span>Subtotal:</span>
                        <strong>{subtotal.toFixed(2)} Lei</strong>
                    </div>
                )}
                <button
                    className={`loc-checkout-btn ${canCheckout ? 'active' : 'inactive'}`}
                    onClick={handleCheckout}
                    disabled={!canCheckout}
                >
                    {checkoutLabel()}
                </button>
            </div>
        </div>
    );
}
