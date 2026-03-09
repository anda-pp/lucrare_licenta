import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Clock, Star, ChevronRight, Map, Building2, Palette } from 'lucide-react';
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
            .then(res => { if (res.data.success) setTrails(res.data.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="trails-loading">Se generează traseele...</div>;

    return (
        <div className="trails-page">
            {/* Header */}
            <div className="trails-header">
                <div className="trails-header-icon"><Map size={40} /></div>
                <div>
                    <h1>Trasee Culturale</h1>
                    <p>Itinerare sugerate pentru a descoperi cultura României într-o zi sau un weekend</p>
                </div>
            </div>

            {trails.length === 0 ? (
                <div className="no-trails">
                    <Map size={48} strokeWidth={1} />
                    <h3>Nu sunt trasee disponibile momentan</h3>
                </div>
            ) : (
                <div className="trails-grid">
                    {trails.map(trail => (
                        <div key={trail.id} className="trail-card">
                            {/* Card header */}
                            <div className="trail-card-header">
                                <div className="trail-pin-icon"><MapPin size={24} /></div>
                                <div>
                                    <h2>{trail.titlu}</h2>
                                    <span className="trail-city">{trail.oras}</span>
                                </div>
                                <div className="trail-format">
                                    {trail.nrLocatii >= 4 ? '🏕️ Weekend' : '☀️ O zi'}
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="trail-meta">
                                <span><Clock size={14} /> {trail.durata}</span>
                                <span><Building2 size={14} /> {trail.nrLocatii} locații</span>
                                <span><Star size={14} /> {trail.ratingMediu > 0 ? trail.ratingMediu : '—'}</span>
                            </div>

                            {/* Locations list */}
                            <div className="trail-locations">
                                {trail.locatii.map((loc, idx) => {
                                    const IconComp = TYPE_ICON[loc.tip_locatie] || Building2;
                                    return (
                                        <div key={loc.cod_unic_locatie} className="trail-loc-item">
                                            <span className="trail-loc-num">{idx + 1}</span>
                                            <IconComp size={16} className="trail-loc-icon" />
                                            <span className="trail-loc-name">{loc.nume_loc}</span>
                                            {loc.orar && (
                                                <span className="trail-loc-orar">{loc.orar.split(',')[0]}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Expanded details */}
                            {expanded === trail.id && (
                                <div className="trail-details">
                                    {trail.locatii.map(loc => (
                                        <div key={loc.cod_unic_locatie} className="trail-detail-card">
                                            <h4>{loc.nume_loc}</h4>
                                            <p className="trail-detail-type">{loc.tip_locatie}</p>
                                            {loc.scurta_descriere && <p className="trail-detail-desc">{loc.scurta_descriere}</p>}
                                            <button
                                                className="trail-visit-btn"
                                                onClick={() => navigate(`/user/locations/${loc.cod_unic_locatie}`)}
                                            >
                                                <ChevronRight size={16} /> Detalii locație
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
                                    {expanded === trail.id ? 'Mai puțin' : 'Explorează traseul'} <ChevronRight size={16} />
                                </button>
                                <button
                                    className="trail-start-btn"
                                    onClick={() => navigate(`/user/locations/${trail.locatii[0]?.cod_unic_locatie}`)}
                                >
                                    <MapPin size={16} /> Primul stop
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
