import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Clock, ChevronRight, Map, Building2, Palette } from 'lucide-react';
import './CulturalTrails.css';
import { useNavigate } from 'react-router-dom';

const TYPE_ICON = {
    'Muzeu': Building2,
    'Galerie': Palette,
};

export default function CulturalTrails() {
    const [trails, setTrails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/api/trails', { withCredentials: true })
            .then(res => {
                if (res.data.success) {
                    // Preia doar cele active public (daca exista campul activ)
                    const activeTrails = res.data.data.filter(t => t.activ !== false && t.activ !== 0);
                    setTrails(activeTrails);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const copyFormat = (durataMinutes) => {
        const h = Math.floor(durataMinutes / 60);
        const m = durataMinutes % 60;
        return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
    }

    if (loading) return <div className="trails-loading">Se încarcă traseele...</div>;

    return (
        <div className="trails-page">
            {/* Header */}
            <div className="trails-header">
                <div className="trails-header-icon"><Map size={40} /></div>
                <div>
                    <h1>Trasee Culturale</h1>
                    <p>Itinerare curatoriate special pentru tine de ghizii noștri.</p>
                </div>
            </div>

            {trails.length === 0 ? (
                <div className="no-trails">
                    <Map size={48} strokeWidth={1} />
                    <h3>Nu sunt trasee disponibile momentan</h3>
                    <p>Administratorii platformei lucrează la noi experiențe.</p>
                </div>
            ) : (
                <div className="trails-grouped">
                    {Object.entries(
                        trails.reduce((acc, trail) => {
                            if (!acc[trail.oras]) acc[trail.oras] = [];
                            acc[trail.oras].push(trail);
                            return acc;
                        }, {})
                    ).map(([city, cityTrails]) => (
                        <div key={city} className="city-section">
                            <h2 className="city-section-title">
                                <MapPin size={28} color="var(--color-primary)" /> {city}
                            </h2>
                            <div className="trails-grid">
                                {cityTrails.map(trail => (
                                    <div key={trail.id} className="trail-card">
                                        {/* Cover Image Header */}
                                        <div
                                            className="trail-cover-image"
                                            style={{
                                                height: '140px',
                                                background: trail.imagineUrl ? `url(${trail.imagineUrl}) center/cover` : 'var(--color-input-bg)',
                                                borderTopLeftRadius: '12px',
                                                borderTopRightRadius: '12px',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                                padding: '1rem', color: 'white',
                                                borderBottomLeftRadius: '12px',
                                                borderBottomRightRadius: '12px'
                                            }}>
                                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{trail.titlu}</h2>
                                                <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>{trail.oras}</span>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="trail-meta" style={{ paddingTop: '1rem' }}>
                                            <span><Clock size={14} /> {copyFormat(trail.durataEstimata)}</span>
                                            <span><Building2 size={14} /> {trail.locatii?.length || 0} locații</span>
                                        </div>

                                        {trail.descriere && (
                                            <div style={{ padding: '0 1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                                {trail.descriere}
                                            </div>
                                        )}

                                        {/* Locations list */}
                                        <div className="trail-locations">
                                            {trail.locatii && trail.locatii.map((loc, idx) => {
                                                const IconComp = TYPE_ICON[loc.tipLocatie] || Building2;
                                                return (
                                                    <div key={`${loc.codUnicLocatie}-${idx}`} className="trail-loc-item">
                                                        <span className="trail-loc-num">{idx + 1}</span>
                                                        <IconComp size={16} className="trail-loc-icon" />
                                                        <span className="trail-loc-name">{loc.numeLoc}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Expanded details */}
                                        {expanded === trail.id && (
                                            <div className="trail-details">
                                                {trail.locatii && trail.locatii.map(loc => (
                                                    <div key={loc.codUnicLocatie} className="trail-detail-card">
                                                        <h4>{loc.numeLoc}</h4>
                                                        <p className="trail-detail-type">{loc.tipLocatie}</p>
                                                        {loc.adresa && <p className="trail-detail-desc" style={{ fontSize: '0.8rem' }}><MapPin size={12} /> {loc.adresa}</p>}
                                                        <button
                                                            className="trail-visit-btn"
                                                            onClick={() => navigate(`/user/locations/${loc.codUnicLocatie}`)}
                                                            style={{ marginTop: '0.5rem' }}
                                                        >
                                                            <ChevronRight size={16} /> Încarcă Muzeul
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="trail-actions">
                                            <button
                                                className="trail-expand-btn"
                                                onClick={() => setExpanded(expanded === trail.id ? null : trail.id)}
                                            >
                                                {expanded === trail.id ? 'Închide' : 'Detalii Navigare'} <ChevronRight size={16} />
                                            </button>
                                            {trail.locatii && trail.locatii.length > 0 && (
                                                <button
                                                    className="trail-start-btn"
                                                    onClick={() => navigate(`/user/locations/${trail.locatii[0]?.codUnicLocatie}`)}
                                                >
                                                    <MapPin size={16} /> Începe
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
