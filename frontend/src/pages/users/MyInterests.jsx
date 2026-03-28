import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Calendar, MapPin, Trash2 } from 'lucide-react';
import { useSession } from '../../lib/auth';
import { useToast } from '../../components/common/Toast';
import './MyInterests.css';

const API = 'http://localhost:5000';

export default function MyInterests() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const toast = useToast();
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (session) fetchInterests();
    }, [session]);

    const fetchInterests = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-interests`, { withCredentials: true });
            if (res.data.success) {
                setInterests(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching interests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveInterest = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await axios.delete(`${API}/api/users/my-interests/${id}`, { withCredentials: true });
            if (res.data.success) {
                setInterests(prev => prev.filter(i => i.interestId !== id));
            }
        } catch (err) {
            console.error('Error removing interest:', err);
            toast.error('Eroare la ștergerea interesului.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredInterests = interests.filter(i =>
        i.titlu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.numeLocatie?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="my-interests-loading">Se încarcă evenimentele...</div>;

    return (
        <div className="my-interests-page">
            <header className="page-header">
                <h1>Evenimente de interes</h1>
                <p>Lista evenimentelor la care ți-ai exprimat interesul de a participa.</p>
            </header>

            {interests.length === 0 ? (
                <div className="my-interests-empty">
                    <Heart size={48} strokeWidth={1} />
                    <h3>Niciun eveniment marcat</h3>
                    <p>Nu ți-ai exprimat interesul pentru niciun eveniment încă.</p>
                    <button className="my-interests-explore-btn" onClick={() => navigate('/user/events')}>
                        Descoperă evenimente
                    </button>
                </div>
            ) : (
                <>
                    <div className="my-interests-actions">
                        <div className="my-interests-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Caută în evenimentele de interes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="my-interests-count">
                            {filteredInterests.length} {filteredInterests.length === 1 ? 'eveniment' : 'evenimente'}
                        </div>
                    </div>

                    {filteredInterests.length === 0 ? (
                        <div className="my-interests-empty">
                            <p>Nu s-au găsit evenimente care să corespundă căutării.</p>
                        </div>
                    ) : (
                        <div className="my-interests-grid">
                            {filteredInterests.map(ev => (
                                <div
                                    key={ev.interestId}
                                    className="my-interest-card"
                                    onClick={() => navigate(`/user/events/${ev.eventId}`)}
                                >
                                    <div className="my-interest-card-image">
                                        {ev.imagineUrl ? (
                                            <img src={`${API}${ev.imagineUrl}`} alt={ev.titlu} />
                                        ) : (
                                            <div className="my-interest-placeholder">Fără imagine</div>
                                        )}
                                        <div className={`my-interest-type-badge ${ev.tipEveniment === 'Noaptea Muzeelor' ? 'nm' : 'normal'}`}>
                                            {ev.tipEveniment}
                                        </div>
                                        <button
                                            className="my-interest-remove-btn"
                                            onClick={(e) => handleRemoveInterest(e, ev.interestId)}
                                            title="Șterge"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="my-interest-card-body">
                                        <h2>{ev.titlu}</h2>
                                        <div className="my-interest-meta">
                                            <p className="my-interest-date">
                                                <Calendar size={14} /> {formatDate(ev.dataStart)}
                                            </p>
                                            {ev.numeLocatie && (
                                                <p className="my-interest-location">
                                                    <MapPin size={14} /> {ev.numeLocatie}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
