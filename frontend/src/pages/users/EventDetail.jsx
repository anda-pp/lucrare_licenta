import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, Clock, MapPin, Share2, Ticket } from 'lucide-react';
import LocationTickets from '../../components/location/LocationTickets';
import './EventDetail.css';

const API = 'http://localhost:5000';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`${API}/api/events/${id}`, {
                    withCredentials: true,
                });
                if (response.data.success) {
                    setEvent(response.data.data);
                } else {
                    setError('Evenimentul nu a fost găsit.');
                }
            } catch (err) {
                console.error('Eroare detaliu eveniment:', err);
                setError('A apărut o problemă la încărcarea evenimentului.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const formatDate = (dateString, format = 'full') => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (format === 'time') {
            return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ro-RO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) return <div className="event-loading">Se încarcă detaliile evenimentului...</div>;
    if (error) return <div className="event-error">{error}</div>;
    if (!event) return null;

    const isNight = event.tipEveniment === 'Noaptea Muzeelor';
    const mainClass = `event-detail-page ${isNight ? 'is-night' : ''}`;

    return (
        <div className={mainClass}>
            <button className="back-btn" onClick={() => navigate(isNight ? '/user/noaptea-muzeelor' : '/user/events')}>
                <ArrowLeft size={20} />
                {isNight ? 'Înapoi la Muzee' : 'Înapoi la Evenimente'}
            </button>

            <div className="event-header-banner">
                <div className="banner-image">
                    {event.imagineUrl ? (
                        <img src={`${API}${event.imagineUrl}`} alt={event.titlu} />
                    ) : (
                        <div className="banner-placeholder">
                            <Calendar size={64} />
                        </div>
                    )}
                </div>
                <div className="banner-content">
                    <span className="type-badge">{event.tipEveniment}</span>
                    <h1>{event.titlu}</h1>
                </div>
            </div>

            <div className="event-content-grid">
                <div className="event-main-col">
                    <section className="detail-section">
                        <h2>Despre Eveniment</h2>
                        <div className="desc-content">
                            {event.descriere ? (
                                <p>{event.descriere}</p>
                            ) : (
                                <p className="empty-text">Nu există o descriere detaliată pentru acest eveniment.</p>
                            )}
                        </div>
                    </section>

                    {/* Secțiunea Bilete / Rezervare */}
                    <section className="event-tickets-section" style={{ marginTop: '2rem' }}>
                        {event.isGratuit ? (
                            <div className="detail-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem' }}>
                                <Ticket size={48} color="var(--color-primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <h3 style={{ fontSize: '1.4rem', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Acest eveniment este gratuit!</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>Rezervă-ți locul acum gratuit pentru a primi biletul nominal în format PDF împreună cu un cod de acces QR.</p>
                                <button
                                    className="buy-tickets-btn reserve-btn"
                                    onClick={() => navigate(`/user/reserve/${event.id}`)}
                                    style={{ maxWidth: '300px', width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                >
                                    <Ticket size={20} /> Rezervă-ți Locul
                                </button>
                            </div>
                        ) : (
                            (event.ticketTypes?.length > 0) ? (
                                <div className="detail-section">
                                    <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Bilete Disponibile</h2>
                                    <LocationTickets
                                    tickets={event.ticketTypes}
                                    locationId={event.codUnicLocatie}
                                    minDate={event.dataStart?.split('T')[0]}
                                    maxDate={event.dataSfarsit?.split('T')[0] || event.dataStart?.split('T')[0]}
                                />
                                </div>
                            ) : (
                                <div className="detail-section" style={{ textAlign: 'center', padding: '3rem' }}>
                                    <p className="empty-text">Biletele nu sunt disponibile momentan pentru achiziționare online.</p>
                                </div>
                            )
                        )}
                    </section>
                </div>

                <div className="event-sidebar-col">
                    <div className="info-card">
                        <h3>Informații Utile</h3>

                        <div className="info-row">
                            <Calendar className="info-icon" size={20} />
                            <div className="info-text">
                                <strong>Dată Începere</strong>
                                <span>{formatDate(event.dataStart)}</span>
                            </div>
                        </div>

                        <div className="info-row">
                            <Clock className="info-icon" size={20} />
                            <div className="info-text">
                                <strong>Interval Orar</strong>
                                <span>
                                    {formatDate(event.dataStart, 'time')}
                                    {event.dataSfarsit && ` - ${formatDate(event.dataSfarsit, 'time')}`}
                                </span>
                            </div>
                        </div>

                        {event.numeLocatie && (
                            <div className="info-row">
                                <MapPin className="info-icon" size={20} />
                                <div className="info-text">
                                    <strong>Locație</strong>
                                    <span>{event.numeLocatie}</span>
                                    {event.orasLocatie && <span className="sub-loc">Oras: {event.orasLocatie}</span>}
                                </div>
                            </div>
                        )}

                        <div className="card-actions">
                            <button className="share-btn" style={{ width: '100%' }}>
                                <Share2 size={18} /> Distribuie
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
