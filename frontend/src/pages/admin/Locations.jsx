import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, MapPin, Star, Image, Edit, Trash2, Filter, AlertCircle, Building2, Activity, Ticket } from 'lucide-react';
import LocationModal from '../../components/LocationModal';
import ImageGalleryModal from '../../components/ImageGalleryModal';
import TicketsModal from '../../components/TicketsModal';
import './Locations.css';
import './admin-shared.css';

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ type: '', status: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [galleryLocation, setGalleryLocation] = useState(null);
    const [ticketsLocation, setTicketsLocation] = useState(null);

    // Debounce la căutare — așteptăm 300ms după ultima tastare înainte de fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLocations();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filtrele de tip/status se aplică imediat, fără debounce
    useEffect(() => {
        fetchLocations();
    }, [filter]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.type) params.append('type', filter.type);
            if (filter.status) params.append('status', filter.status);
            if (searchTerm) params.append('search', searchTerm);

            const response = await axios.get(`http://localhost:5000/api/locations?${params}`);
            setLocations(response.data.data);
            setError('');
        } catch (err) {
            setError('Nu s-au putut încărca locațiile');
            console.error('Fetch locations error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingLocation(null);
        setShowModal(true);
    };

    const handleEdit = (location) => {
        setEditingLocation(location);
        setShowModal(true);
    };

    const handleSave = async (data) => {
        try {
            if (editingLocation) {
                await axios.put(
                    `http://localhost:5000/api/locations/${editingLocation.codUnicLocatie}`,
                    data,
                    { withCredentials: true }
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/locations',
                    data,
                    { withCredentials: true }
                );
            }
            fetchLocations();
        } catch (err) {
            // Re-aruncăm eroarea pentru ca modalul să poată afișa mesajul de validare
            throw err;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi această locație?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/locations/${id}`, {
                withCredentials: true,
            });
            fetchLocations();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    // Mesaj de stare goală contextualizat — reflectă filtrele active
    const getEmptyMessage = () => {
        if (filter.type && filter.status && searchTerm) {
            return `Nu s-au găsit ${filter.type === 'Muzeu' ? 'muzee' : 'galerii'} cu status "${filter.status}" pentru "${searchTerm}"`;
        }
        if (filter.type && searchTerm) {
            return `Nu s-au găsit ${filter.type === 'Muzeu' ? 'muzee' : 'galerii'} pentru "${searchTerm}"`;
        }
        if (filter.status && searchTerm) {
            return `Nu s-au găsit locații cu status "${filter.status}" pentru "${searchTerm}"`;
        }
        if (filter.type) {
            return `Nu există ${filter.type === 'Muzeu' ? 'muzee' : 'galerii'} înregistrate`;
        }
        if (filter.status) {
            return `Nu există locații cu status "${filter.status}"`;
        }
        if (searchTerm) {
            return `Nu s-au găsit locații pentru "${searchTerm}"`;
        }
        return 'Nu există locații înregistrate încă. Adaugă prima locație!';
    };

    const hasActiveFilters = filter.type || filter.status || searchTerm;

    const resetFilters = () => {
        setFilter({ type: '', status: '' });
        setSearchTerm('');
    };

    if (loading && locations.length === 0) {
        return <div className="loading">Se încarcă...</div>;
    }

    return (
        <div className="locations-page">
            <div className="page-header">
                <h1>Muzee & Galerii</h1>
                <button className="btn-primary icon-btn" onClick={handleAdd}>
                    <Plus size={18} />
                    Adaugă Locație
                </button>
            </div>

            <div className="filters">
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Caută după nume..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <Building2 className="filter-icon" size={18} />
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">Toate tipurile</option>
                        <option value="Muzeu">Muzeu</option>
                        <option value="Galerie">Galerie</option>
                    </select>
                </div>

                <div className="filter-group">
                    <Activity className="filter-icon" size={18} />
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">Toate statusurile</option>
                        <option value="Activ">Activ</option>
                        <option value="Inactiv">Inactiv</option>
                        <option value="Cerere">Cerere</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="locations-grid">
                {locations.map((location) => (
                    <div key={location.codUnicLocatie} className="location-card">
                        <div className="card-header">
                            <h3>{location.numeLoc}</h3>
                            <span className={`badge badge-${location.tipLocatie.toLowerCase()}`}>
                                {location.tipLocatie}
                            </span>
                        </div>

                        <div className="card-body">
                            {/* Rândul de adresă: locație + badge status pe același rând */}
                            <div className="location-address-row">
                                <p className="location-address">
                                    <MapPin size={16} />
                                    {location.orasLoc}, {location.adresa}
                                </p>
                                <span className={`status-badge status-${location.statusLocatie.toLowerCase()}`}>
                                    {location.statusLocatie}
                                </span>
                            </div>

                            <div className="location-stats">
                                <div className="stat">
                                    <span className="stat-label">Recenzii:</span>
                                    <span className="stat-value">{location.reviewCount || 0}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Rating:</span>
                                    <span className="stat-value star-rating">
                                        <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                                        {location.avgRating ? Number(location.avgRating).toFixed(1) : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {location.scurtaDescriere && (
                                <p className="location-description">{location.scurtaDescriere}</p>
                            )}
                        </div>

                        <div className="card-footer">
                            <div className="footer-left">
                                <button className="btn-gallery icon-btn" onClick={() => setGalleryLocation(location)}>
                                    <Image size={15} /> Galerie
                                </button>
                                <button className="btn-tickets icon-btn" onClick={() => setTicketsLocation(location)}>
                                    <Ticket size={15} /> Bilete
                                </button>
                            </div>
                            <div className="footer-right">
                                <button className="btn-secondary icon-btn" onClick={() => handleEdit(location)}>
                                    <Edit size={15} /> Editează
                                </button>
                                <button className="btn-danger icon-btn" onClick={() => handleDelete(location.codUnicLocatie)}>
                                    <Trash2 size={15} /> Șterge
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {locations.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon-wrapper">
                        <AlertCircle size={48} />
                    </div>
                    <p>{getEmptyMessage()}</p>
                    {hasActiveFilters && (
                        <button className="btn-reset-filters" onClick={resetFilters}>
                            Resetează filtrele
                        </button>
                    )}
                </div>
            )}

            {showModal && (
                <LocationModal
                    location={editingLocation}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {galleryLocation && (
                <ImageGalleryModal
                    location={galleryLocation}
                    onClose={() => setGalleryLocation(null)}
                    onCoverChanged={async () => {
                        await fetchLocations();
                        // Actualizăm și galleryLocation cu noul imagineUrl din lista reîncărcată
                        const res = await axios.get(`http://localhost:5000/api/locations/${galleryLocation.codUnicLocatie}`, { withCredentials: true });
                        if (res.data.success) setGalleryLocation(res.data.data);
                    }}
                />
            )}
            {ticketsLocation && (
                <TicketsModal
                    location={ticketsLocation}
                    onClose={() => setTicketsLocation(null)}
                />
            )}
        </div>
    );
}
