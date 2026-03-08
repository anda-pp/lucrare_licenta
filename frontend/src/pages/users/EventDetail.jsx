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
                            {event.isGratuit ? (
                                <button
                                    className="buy-tickets-btn reserve-btn"
                                    onClick={() => navigate(`/user/reserve/${event.id}`)}
                                >
                                    <Ticket size={18} /> Rezervă-ți Locul
                                </button>
                            ) : (
                                (event.ticketTypes?.length > 0) ? (
                                    <LocationTickets tickets={event.ticketTypes} locationId={event.codUnicLocatie} />
                                ) : (
                                    <div className="event-error" style={{ padding: '1rem', textAlign: 'left' }}>Biletele nu sunt disponibile momentan.</div>
                                )
                            )}
                            <button className="share-btn" style={{ marginTop: '1rem', width: '100%' }}>
                                <Share2 size={18} /> Distribuie
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
