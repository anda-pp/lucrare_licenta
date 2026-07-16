import { Clock, Globe, MapPin, Phone } from 'lucide-react';

// Gridul cu informațiile detaliate ale locației: program, adresă, site și link Google Maps
// Randăm condițional fiecare rând — nu afișăm câmpuri goale
export default function LocationInfoGrid({ location }) {
    return (
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
                        {/* Adăugăm https:// dacă url-ul nu conține deja un protocol */}
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

            <div className="loc-info-row map-row">
                <div className="loc-info-icon"><MapPin size={18} /></div>
                <div style={{ width: '100%' }}>
                    <span className="loc-info-label">Harta Locației</span>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.locatieHarta)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="loc-info-link"
                        style={{ display: 'inline-block', marginTop: '0.2rem' }}
                    >
                        Deschide în aplicația Google Maps →
                    </a>
                </div>
            </div>
        </div>
    );
}
