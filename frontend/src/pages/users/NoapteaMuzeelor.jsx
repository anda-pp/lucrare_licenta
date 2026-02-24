import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, Moon } from 'lucide-react';
import './NoapteaMuzeelor.css';
import './Events.css'; // Refolosim unele stiluri de la evenimente generale

export default function NoapteaMuzeelor() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [targetDate, setTargetDate] = useState(null);

    useEffect(() => {
        fetchNightEvents();
    }, []);

    useEffect(() => {
        if (!targetDate) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const fetchNightEvents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/events', {
                withCredentials: true,
            });
            if (response.data.success) {
                // Filtrăm doar evenimentele "Noaptea Muzeelor"
                const nightEvents = response.data.data.filter(e => e.tipEveniment === 'Noaptea Muzeelor');
                setEvents(nightEvents);

                // Setăm cronometrul pentru primul eveniment viitor
                if (nightEvents.length > 0) {
                    const sorted = nightEvents.sort((a, b) => new Date(a.dataStart) - new Date(b.dataStart));
                    const nextEvent = sorted.find(e => new Date(e.dataStart) > new Date());
                    if (nextEvent) {
                        setTargetDate(new Date(nextEvent.dataStart));
                    }
                }
            }
        } catch (error) {
            console.error('Eroare încărcare evenimente:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString, format = 'full') => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (format === 'time') {
            return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div className="events-loading">Se încarcă magia nopții...</div>;
    }

    return (
        <div className="night-page">
            <div className="night-hero">
                <div className="night-hero-content">
                    <Moon size={64} className="moon-icon" />
                    <h1>Noaptea Muzeelor</h1>
                    <p>O noapte magică în care cultura prinde viață sub clar de lună.</p>

                    {targetDate && new Date() < targetDate && (
                        <div className="countdown-container">
                            <div className="countdown-box">
                                <span className="countdown-value">{timeLeft.days}</span>
                                <span className="countdown-label">Zile</span>
                            </div>
                            <span className="countdown-separator">:</span>
                            <div className="countdown-box">
                                <span className="countdown-value">{timeLeft.hours}</span>
                                <span className="countdown-label">Ore</span>
                            </div>
                            <span className="countdown-separator">:</span>
                            <div className="countdown-box">
                                <span className="countdown-value">{timeLeft.minutes}</span>
                                <span className="countdown-label">Minute</span>
                            </div>
                            <span className="countdown-separator">:</span>
                            <div className="countdown-box accent">
                                <span className="countdown-value">{timeLeft.seconds}</span>
                                <span className="countdown-label">Secunde</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="events-page override-padding">
                {events.length === 0 ? (
                    <div className="no-events night-theme">
                        <Moon size={48} strokeWidth={1} />
                        <h3>Momentan nu sunt evenimente programate</h3>
                        <p>Urmărește-ne pentru noutăți despre ediția următoare.</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map(event => (
                            <div key={event.id} className="event-card night-card">
                                {event.imagineUrl ? (
                                    <div className="event-image">
                                        <img src={`http://localhost:5000${event.imagineUrl}`} alt={event.titlu} />
                                    </div>
                                ) : (
                                    <div className="event-image placeholder night-placeholder">
                                        <Moon size={48} />
                                    </div>
                                )}

                                <div className="event-content">
                                    <h2>{event.titlu}</h2>
                                    <div className="event-meta">
                                        <span className="meta-item">
                                            <Calendar size={16} />
                                            {formatDate(event.dataStart)}
                                        </span>
                                        <span className="meta-item">
                                            <Clock size={16} />
                                            {formatDate(event.dataStart, 'time')}
                                            {event.dataSfarsit && ` - ${formatDate(event.dataSfarsit, 'time')}`}
                                        </span>
                                        {event.numeLocatie && (
                                            <span className="meta-item">
                                                <MapPin size={16} />
                                                {event.numeLocatie}{event.orasLocatie ? `, ${event.orasLocatie}` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className="event-description">
                                        {event.descriere || 'Bucură-te de o experiență inedită!'}
                                    </p>
                                    <button className="view-details-btn night-btn" onClick={() => navigate(`/user/events/${event.id}`)}>Detalii Program</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
