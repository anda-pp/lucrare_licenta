import { Heart, Star, MapPin } from 'lucide-react';

const API = 'http://localhost:5000';

/**
 * LocationHero — top banner with image, name, type badge, rating, and favorite button
 */
export default function LocationHero({ location, isFav, favToggling, session, onToggleFav, avgRating }) {
    return (
        <div className="loc-hero">
            <div className="loc-hero-image">
                {location.imagineUrl ? (
                    <img src={`${API}${location.imagineUrl}`} alt={location.numeLoc} />
                ) : (
                    <div className="loc-hero-placeholder">
                        <span style={{ fontSize: '5rem' }}>🏛️</span>
                    </div>
                )}
                <div className="loc-hero-overlay" />
            </div>

            <div className="loc-hero-content">
                <div className="loc-hero-badges">
                    <span className={`loc-type-badge-lg ${location.tipLocatie === 'Muzeu' ? 'museum' : 'gallery'}`}>
                        {location.tipLocatie}
                    </span>
                    {avgRating && (
                        <span className="loc-rating-badge">
                            <Star size={14} fill="currentColor" /> {avgRating}
                        </span>
                    )}
                </div>

                <h1>{location.numeLoc}</h1>

                <p className="loc-hero-location">
                    <MapPin size={16} />
                    {location.adresa && `${location.adresa}, `}
                    {location.orasLoc}
                    {location.judet && `, ${location.judet}`}
                </p>

                {session && (
                    <button
                        className={`loc-hero-fav-btn ${isFav ? 'active' : ''}`}
                        onClick={onToggleFav}
                        disabled={favToggling}
                    >
                        <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                        {isFav ? 'Salvat la favorite' : 'Adaugă la favorite'}
                    </button>
                )}
            </div>
        </div>
    );
}
