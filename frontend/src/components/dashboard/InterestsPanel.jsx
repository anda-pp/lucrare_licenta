import { Heart, Calendar, MapPin, ChevronRight } from 'lucide-react';

// Panoul cu evenimentele marcate ca "interesante" de utilizator — afișat în dashboard
// Evenimentele de tip "Noaptea Muzeelor" au un stil vizual distinct (dark)
export default function InterestsPanel({ interests, formatDate, onNavigate }) {
    return (
        <div className="content-card">
            <h2>
                <Heart size={20} /> Evenimente de interes{' '}
                <span className="panel-count">{interests.length}</span>
            </h2>

            {interests.length === 0 ? (
                <div className="empty-state-interests">
                    <p className="empty-text">Nu ai marcat niciun eveniment ca interesat.</p>
                    <button className="show-all-btn" onClick={() => onNavigate('/user/events')}>
                        Explorează evenimente →
                    </button>
                </div>
            ) : (
                <div className="interests-list">
                    {/* Afișăm primele 5 interese pentru a nu aglomera dashboard-ul */}
                    {interests.slice(0, 5).map(ev => (
                        <div
                            key={ev.interestId}
                            className="interest-item"
                            style={{ cursor: 'pointer' }}
                            onClick={() => onNavigate(`/user/events/${ev.eventId}`)}
                        >
                            <div
                                className="interest-type-tag"
                                style={{
                                    background: ev.tipEveniment === 'Noaptea Muzeelor' ? '#1e293b' : '#f0f9ff',
                                    color: ev.tipEveniment === 'Noaptea Muzeelor' ? '#e2e8f0' : '#0284c7',
                                }}
                            >
                                {ev.tipEveniment}
                            </div>
                            <div className="interest-info">
                                <strong>{ev.titlu}</strong>
                                <span className="interest-meta">
                                    <Calendar size={13} /> {formatDate(ev.dataStart)}
                                    {ev.numeLocatie && <><MapPin size={13} /> {ev.numeLocatie}</>}
                                </span>
                            </div>
                            <ChevronRight
                                size={16}
                                className="interest-arrow"
                                onClick={() => onNavigate('/user/interests')}
                            />
                        </div>
                    ))}
                    <button className="show-all-btn" onClick={() => onNavigate('/user/interests')}>
                        Vezi toate →
                    </button>
                </div>
            )}
        </div>
    );
}
