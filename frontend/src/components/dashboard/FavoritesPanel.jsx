import { Building2, MapPin, ChevronRight } from 'lucide-react';

const API = 'http://localhost:5000';

// Panoul cu locațiile favorite ale utilizatorului din dashboard
// Afișează primele 5 favorite cu thumbnail, tip și oraș — clickabile spre pagina locației
export default function FavoritesPanel({ favorites, onNavigate }) {
    return (
        <div className="content-card">
            <h2>
                <Building2 size={20} /> Muzee favorite{' '}
                <span className="panel-count">{favorites.length}</span>
            </h2>

            {favorites.length === 0 ? (
                <div className="empty-state-interests">
                    <p className="empty-text">Nu ai salvat niciun muzeu preferat.</p>
                    <button className="show-all-btn" onClick={() => onNavigate('/user/locations')}>
                        Explorează locații →
                    </button>
                </div>
            ) : (
                <div className="favorites-list">
                    {/* Limităm la primele 5 pentru a nu aglomera dashboard-ul */}
                    {favorites.slice(0, 5).map(fav => (
                        <div
                            key={fav.id || fav.codUnicLocatie}
                            className="favorite-item"
                            onClick={() => onNavigate(`/user/locations/${fav.codUnicLocatie}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            {fav.imagineUrl ? (
                                <img
                                    src={`${API}${fav.imagineUrl}`}
                                    alt={fav.numeLoc}
                                    className="fav-thumb"
                                />
                            ) : (
                                <div className="fav-thumb fav-thumb-placeholder">
                                    <Building2 size={20} />
                                </div>
                            )}
                            <div className="fav-info">
                                <strong>{fav.numeLoc}</strong>
                                <span className="fav-meta">
                                    <span className="fav-type-badge">{fav.tipLocatie}</span>
                                    {fav.orasLoc && <><MapPin size={12} /> {fav.orasLoc}</>}
                                </span>
                            </div>
                            <ChevronRight size={16} className="interest-arrow" />
                        </div>
                    ))}
                    <button className="show-all-btn" onClick={() => onNavigate('/user/my-favorites')}>
                        Vezi toate favorite →
                    </button>
                </div>
            )}
        </div>
    );
}
