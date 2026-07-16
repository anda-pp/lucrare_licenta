import { useState } from 'react';
import { Heart, Star, MapPin, X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

const API = 'http://localhost:5000';

// Lightbox full-screen pentru vizualizarea galeriei de imagini
function PhotoLightbox({ images, startIndex, onClose }) {
    const [current, setCurrent] = useState(startIndex);

    const prev = (e) => {
        e.stopPropagation();
        setCurrent(i => (i - 1 + images.length) % images.length);
    };
    const next = (e) => {
        e.stopPropagation();
        setCurrent(i => (i + 1) % images.length);
    };

    // Navigare cu tastatura
    const handleKey = (e) => {
        if (e.key === 'ArrowLeft') setCurrent(i => (i - 1 + images.length) % images.length);
        if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % images.length);
        if (e.key === 'Escape') onClose();
    };

    return (
        <div
            className="lightbox-overlay"
            onClick={onClose}
            onKeyDown={handleKey}
            tabIndex={0}
            autoFocus
        >
            {/* Header */}
            <div className="lightbox-header" onClick={e => e.stopPropagation()}>
                <span className="lightbox-counter">
                    <Images size={16} /> {current + 1} / {images.length}
                </span>
                <button className="lightbox-close" onClick={onClose}>
                    <X size={22} />
                </button>
            </div>

            {/* Imaginea principală */}
            <div className="lightbox-main" onClick={e => e.stopPropagation()}>
                {images.length > 1 && (
                    <button className="lightbox-nav prev" onClick={prev}>
                        <ChevronLeft size={28} />
                    </button>
                )}
                <img
                    src={`${API}${images[current].caleFisier}`}
                    alt={images[current].numeOriginal}
                    className="lightbox-img"
                />
                {images.length > 1 && (
                    <button className="lightbox-nav next" onClick={next}>
                        <ChevronRight size={28} />
                    </button>
                )}
            </div>

            {/* Miniaturi */}
            {images.length > 1 && (
                <div className="lightbox-thumbs" onClick={e => e.stopPropagation()}>
                    {images.map((img, idx) => (
                        <img
                            key={img.codUnicImagine}
                            src={`${API}${img.caleFisier}`}
                            alt={img.numeOriginal}
                            className={`lightbox-thumb ${idx === current ? 'active' : ''}`}
                            onClick={() => setCurrent(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Banner-ul principal al paginii de detalii locație — imagine de fundal, nume, tip, rating și buton favorite
export default function LocationHero({ location, isFav, favToggling, session, onToggleFav, avgRating, galleryImages = [] }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxStart, setLightboxStart] = useState(0);

    // Numărul de imagini extra față de cover (cover-ul e deja afișat în hero)
    const extraCount = galleryImages.length > 1 ? galleryImages.length - 1 : 0;

    const openLightbox = (startIdx = 0) => {
        setLightboxStart(startIdx);
        setLightboxOpen(true);
    };

    return (
        <>
            <div className="loc-hero">
                <div className="loc-hero-image">
                    {location.imagineUrl ? (
                        <img src={`${API}${location.imagineUrl}`} alt={location.numeLoc} />
                    ) : (
                        <div className="loc-hero-placeholder">
                            <span style={{ fontSize: '5rem' }}>🏛️</span>
                        </div>
                    )}
                    {/* Overlay gradient pentru lizibilitatea textului suprapus */}
                    <div className="loc-hero-overlay" />

                    {/* Buton "+N poze" — apare dacă există mai mult de o imagine în galerie */}
                    {galleryImages.length > 0 && (
                        <button
                            className="hero-more-photos-btn"
                            onClick={() => openLightbox(0)}
                            title="Vezi toate fotografiile"
                        >
                            {extraCount > 0 ? (
                                <>
                                    <Images size={15} />
                                    +{extraCount} {extraCount === 1 ? 'poză' : 'poze'}
                                </>
                            ) : (
                                <>
                                    <Images size={15} />
                                    Vezi foto
                                </>
                            )}
                        </button>
                    )}
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

                    {/* Butonul de favorite apare doar pentru utilizatorii autentificați */}
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

            {/* Lightbox — se montează în afara hero-ului pentru a fi full-screen */}
            {lightboxOpen && galleryImages.length > 0 && (
                <PhotoLightbox
                    images={galleryImages}
                    startIndex={lightboxStart}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}
