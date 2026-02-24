import { Clock, Globe, MapPin, Phone } from 'lucide-react';

/**
 * LocationInfoGrid — 2-column info section with description, schedule, website, address
 */
export default function LocationInfoGrid({ location }) {
    return (
        <div className="loc-info-section">
            {/* Description */}
            {location.scurtaDescriere && (
                <div className="loc-info-card full-width">
                    <h3>Despre</h3>
                    <p>{location.scurtaDescriere}</p>
                </div>
            )}

            {/* Details grid */}
            <div className="loc-info-details">
                {location.orar && (
                    <div className="loc-info-row">
                        <div className="loc-info-icon"><Clock size={18} /></div>
                        <div>
                            <span className="loc-info-label">Program</span>
                            <span className="loc-info-value">{location.orar}</span>
                        </div>
                    </div>
                )}

                {location.adresa && (
                    <div className="loc-info-row">
                        <div className="loc-info-icon"><MapPin size={18} /></div>
                        <div>
                            <span className="loc-info-label">Adresă</span>
                            <span className="loc-info-value">
                                {location.adresa}, {location.orasLoc}
                                {location.judet && `, ${location.judet}`}
                            </span>
                        </div>
                    </div>
                )}

                {location.siteOficial && (
                    <div className="loc-info-row">
                        <div className="loc-info-icon"><Globe size={18} /></div>
                        <div>
                            <span className="loc-info-label">Website</span>
                            <a
                                href={location.siteOficial.startsWith('http') ? location.siteOficial : `https://${location.siteOficial}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="loc-info-link"
                            >
                                {location.siteOficial}
                            </a>
                        </div>
                    </div>
                )}

                {location.locatieHarta && (
                    <div className="loc-info-row">
                        <div className="loc-info-icon"><MapPin size={18} /></div>
                        <div>
                            <span className="loc-info-label">Harta</span>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.locatieHarta)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="loc-info-link"
                            >
                                Deschide în Google Maps →
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
