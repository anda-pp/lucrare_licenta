import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, Download, Ticket } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../../lib/auth';
import { useToast } from '../../components/common/Toast';
import './EventReservation.css';

const API = 'http://localhost:5000';

function generateDays(dataStart, dataSfarsit) {
    if (!dataSfarsit) return [new Date(dataStart)];
    const days = [];
    const start = new Date(dataStart);
    const end = new Date(dataSfarsit);
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);
    while (cur <= endDay) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return days;
}

function formatDay(date) {
    return date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

export default function EventReservation() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { data: session } = useSession();

    const toast = useToast();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservationId, setReservationId] = useState(null);

    const [nrPersoane, setNrPersoane] = useState(1);
    const [ziuaAleasa, setZiuaAleasa] = useState('');
    const [intervalOrar, setIntervalOrar] = useState('');

    useEffect(() => {
        axios.get(`${API}/api/events/${eventId}`, { withCredentials: true })
            .then(res => {
                if (res.data.success) {
                    const ev = res.data.data;
                    if (!ev.isGratuit) {
                        navigate(-1);
                        return;
                    }
                    setEvent(ev);
                    // Pre-select first day and time interval
                    const days = generateDays(ev.dataStart, ev.dataSfarsit);
                    setZiuaAleasa(days[0].toISOString().split('T')[0]);

                    if (ev.intervaleOrare && ev.intervaleOrare.length > 0) {
                        setIntervalOrar(ev.intervaleOrare[0]);
                    } else {
                        setIntervalOrar(`${formatTime(ev.dataStart)} – ${ev.dataSfarsit ? formatTime(ev.dataSfarsit) : '—'}`);
                    }
                }
            })
            .catch(() => navigate(-1))
            .finally(() => setLoading(false));
    }, [eventId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API}/api/users/events/${eventId}/reserve`, {
                nrPersoane, ziuaAleasa, intervalOrar
            }, { withCredentials: true });
            if (res.data.success) setReservationId(res.data.reservationId);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Eroare la rezervare.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="er-loading">Se încarcă evenimentul...</div>;
    if (!event) return null;

    const days = generateDays(event.dataStart, event.dataSfarsit);
    const isMultiDay = days.length > 1;

    if (reservationId) {
        return (
            <div className="er-page er-success-container">
                <div className="er-success-card">
                    <CheckCircle size={64} color="#10b981" strokeWidth={1.5} />
                    <h2>Rezervare Confirmată!</h2>
                    <p>Locul tău la <strong>{event.titlu}</strong> a fost rezervat cu succes.</p>
                    <div className="er-success-actions">
                        <a
                            href={`${API}/api/users/my-reservations/${reservationId}/ticket`}
                            target="_blank"
                            rel="noreferrer"
                            className="er-download-btn"
                        >
                            <Download size={18} /> Descarcă Biletul PDF
                        </a>
                        <button className="er-back-link" onClick={() => navigate('/user/events')}>
                            Înapoi la Evenimente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="er-page">
            <button className="back-btn" onClick={() => navigate(`/user/events/${eventId}`)}>
                <ArrowLeft size={16} /> Înapoi la eveniment
            </button>

            <div className="er-layout">
                {/* Left: Event Summary */}
                <div className="er-summary-col">
                    <div className="er-summary-card">
                        <div className="er-gratuit-badge">
                            <Ticket size={14} /> GRATUIT
                        </div>
                        <h3>{event.titlu}</h3>
                        {event.numeLocatie && (
                            <div className="er-info-row">
                                <MapPin size={15} />
                                <span>{event.numeLocatie}{event.orasLocatie ? `, ${event.orasLocatie}` : ''}</span>
                            </div>
                        )}
                        <div className="er-info-row">
                            <Calendar size={15} />
                            <span>{formatDay(new Date(event.dataStart))}</span>
                        </div>
                        <div className="er-info-row">
                            <Clock size={15} />
                            <span>
                                {formatTime(event.dataStart)}
                                {event.dataSfarsit ? ` – ${formatTime(event.dataSfarsit)}` : ''}
                            </span>
                        </div>
                    </div>

                    <div className="er-trust-badge">
                        <Ticket size={18} color="#8b5cf6" />
                        <p>Vei primi un bilet PDF cu cod QR după confirmarea rezervării.</p>
                    </div>
                </div>

                {/* Right: Reservation Form */}
                <div className="er-form-col">
                    <div className="er-form-card">
                        <h3>Detalii Rezervare</h3>
                        <form className="er-form" onSubmit={handleSubmit}>
                            {isMultiDay && (
                                <div className="er-input-group">
                                    <label><Calendar size={14} /> Alege Ziua</label>
                                    <select value={ziuaAleasa} onChange={e => setZiuaAleasa(e.target.value)} required>
                                        {days.map(d => (
                                            <option key={d.toISOString()} value={d.toISOString().split('T')[0]}>
                                                {formatDay(d)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="er-input-group">
                                <label><Clock size={14} /> Interval Orar</label>
                                {event.intervaleOrare && event.intervaleOrare.length > 0 ? (
                                    <select value={intervalOrar} onChange={e => setIntervalOrar(e.target.value)} required>
                                        {event.intervaleOrare.map((intv, idx) => (
                                            <option key={idx} value={intv}>{intv}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div style={{ padding: '0.75rem', background: 'var(--color-input-bg)', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        Nu sunt intervale disponibile.
                                    </div>
                                )}
                            </div>

                            <div className="er-input-group">
                                <label><Users size={14} /> Număr Persoane</label>
                                <div className="er-persons-row">
                                    <button type="button" className="er-qty-btn" onClick={() => setNrPersoane(p => Math.max(1, p - 1))} disabled={nrPersoane <= 1}>−</button>
                                    <span className="er-qty-val">{nrPersoane}</span>
                                    <button type="button" className="er-qty-btn" onClick={() => setNrPersoane(p => Math.min(10, p + 1))} disabled={nrPersoane >= 10}>+</button>
                                    <span className="er-persons-label">pers.</span>
                                </div>
                            </div>

                            <div className="er-participant-info">
                                <strong>Rezervat pe numele:</strong>
                                <span>{session?.user?.name || 'Contul tău'}</span>
                            </div>

                            <button type="submit" className="er-submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Se procesează...' : 'Confirmă Rezervarea'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
