import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Search, Heart } from 'lucide-react';
import { useSession } from '../../lib/auth';
import './Events.css';

const API = 'http://localhost:5000';

export default function Events() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCity, setFilterCity] = useState('');
    // Set cu ID-urile evenimentelor marcate de interes de utilizatorul curent
    const [interestedIds, setInterestedIds] = useState(new Set());
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (session) fetchMyInterests();
    }, [session]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${API}/api/events`, { withCredentials: true });
            if (response.data.success) setEvents(response.data.data);
        } catch (error) {
            console.error('Eroare încărcare evenimente:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyInterests = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-interests`, { withCredentials: true });
            if (res.data.success) {
                setInterestedIds(new Set(res.data.data.map(i => i.eventId)));
            }
        } catch (_) { }
    };

    const toggleInterest = async (eventId) => {
        if (!session) return;
        setToggling(eventId);
        try {
            if (interestedIds.has(eventId)) {
                await axios.delete(`${API}/api/users/my-interests/${eventId}`, { withCredentials: true });
                setInterestedIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
            } else {
                await axios.post(`${API}/api/users/my-interests/${eventId}`, {}, { withCredentials: true });
                setInterestedIds(prev => new Set([...prev, eventId]));
            }
        } catch (err) {
            console.error('Toggle interest error:', err);
        } finally {
            setToggling(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ro-RO', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    };

    const cities = [...new Set(events.map(e => e.orasLocatie).filter(Boolean))];

    // Excludem evenimentele de tip "Noaptea Muzeelor" — au secțiunea lor dedicată
    const filteredEvents = events.filter(event => {
        if (event.tipEveniment === 'Noaptea Muzeelor') return false;

        const matchesSearch = event.titlu.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.descriere && event.descriere.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCity = filterCity ? event.orasLocatie === filterCity : true;
        return matchesSearch && matchesCity;
    });

    if (loading) return <div className="events-loading">Se încarcă evenimentele...</div>;

    return (
        <div className="events-page">
            <header className="events-header">
                <h1>Evenimente Culturale</h1>
                <p>Descoperă expoziții, ateliere și evenimente speciale la muzeele din zona ta.</p>
            </header>

            <div className="events-filters">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Caută un eveniment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="city-select">
                        <option value="">Toate orașele</option>
                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
            </div>

            {filteredEvents.length === 0 ? (
                <div className="no-events">
                    <Calendar size={48} strokeWidth={1} />
                    <h3>Niciun eveniment găsit</h3>
                    <p>Încearcă alte filtre de căutare.</p>
                </div>
            ) : (
                <div className="events-grid">
                    {filteredEvents.map(event => {
                        const isInterested = interestedIds.has(event.id);
                        const isToggling = toggling === event.id;
                        return (
                            <div key={event.id} className="event-card">
                                {event.imagineUrl ? (
                                    <div className="event-image">
                                        <img src={`${API}${event.imagineUrl}`} alt={event.titlu} />
                                        <span className="event-type-badge">{event.tipEveniment}</span>
                                    </div>
                                ) : (
                                    <div className="event-image placeholder">
                                        <Calendar size={48} />
                                        <span className="event-type-badge">{event.tipEveniment}</span>
                                    </div>
                                )}

                                <div className="event-content">
                                    <h2>{event.titlu}</h2>
                                    <div className="event-meta">
                                        <span className="meta-item">
                                            <Calendar size={16} />
                                            {formatDate(event.dataStart)}
                                        </span>
                                        {event.numeLocatie && (
                                            <span className="meta-item">
                                                <MapPin size={16} />
                                                {event.numeLocatie}{event.orasLocatie ? `, ${event.orasLocatie}` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className="event-description">
                                        {event.descriere || 'Nicio descriere disponibilă.'}
                                    </p>
                                    <div className="event-actions">
                                        <button className="view-details-btn" onClick={() => navigate(`/user/events/${event.id}`)}>Vezi Detalii</button>
                                        {/* Butonul de interes apare doar dacă utilizatorul este autentificat */}
                                        {session && (
                                            <button
                                                className={`interest-btn ${isInterested ? 'interested' : ''}`}
                                                onClick={() => toggleInterest(event.id)}
                                                disabled={isToggling}
                                                title={isInterested ? 'Elimină interesul' : 'Mă interesează'}
                                            >
                                                <Heart size={16} fill={isInterested ? 'currentColor' : 'none'} />
                                                {isInterested ? 'Interesat' : 'Mă interesează'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
