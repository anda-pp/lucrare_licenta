import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Building2, Search, Heart } from 'lucide-react';
import { useSession } from '../../lib/auth';
import './Locations.css';

const API = 'http://localhost:5000';

export default function Locations() {
    const { data: session } = useSession();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [favIds, setFavIds] = useState(new Set());
    const [toggling, setToggling] = useState(null);

    useEffect(() => { fetchLocations(); }, []);
    useEffect(() => { if (session) fetchFavs(); }, [session]);

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`${API}/api/locations`, { withCredentials: true });
            if (res.data.success) setLocations(res.data.data.filter(l => l.statusLocatie === 'Activ'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchFavs = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-favorites`, { withCredentials: true });
            if (res.data.success) setFavIds(new Set(res.data.data.map(f => f.codUnicLocatie)));
        } catch (_) { }
    };

    const toggleFav = async (locId) => {
        if (!session) return;
        setToggling(locId);
        try {
            if (favIds.has(locId)) {
                await axios.delete(`${API}/api/users/my-favorites/${locId}`, { withCredentials: true });
                setFavIds(prev => { const n = new Set(prev); n.delete(locId); return n; });
            } else {
                await axios.post(`${API}/api/users/my-favorites/${locId}`, {}, { withCredentials: true });
                setFavIds(prev => new Set([...prev, locId]));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setToggling(null);
        }
    };

    const filtered = locations.filter(l => {
        const matchSearch = l.numeLoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.scurtaDescriere && l.scurtaDescriere.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (l.orasLoc && l.orasLoc.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchType = filterType ? l.tipLocatie === filterType : true;
        return matchSearch && matchType;
    });

    if (loading) return <div className="loc-loading">Se încarcă locațiile...</div>;

    return (
        <div className="locations-page">
            <header className="page-header">
                <h1>Muzee &amp; Galerii</h1>
                <p>Explorează instituțiile culturale din România și salvează-ți favoritele.</p>
            </header>

            {/* Filters */}
            <div className="loc-filters">
                <div className="loc-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Caută după nume, oraș..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="loc-type-filters">
                    {['', 'Muzeu', 'Galerie'].map(t => (
                        <button
                            key={t}
                            className={`loc-filter-btn ${filterType === t ? 'active' : ''}`}
                            onClick={() => setFilterType(t)}
                        >
                            {t || 'Toate'}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="loc-empty">
                    <Building2 size={48} strokeWidth={1} />
                    <h3>Nicio locație găsită</h3>
                    <p>Încearcă alte filtre.</p>
                </div>
            ) : (
                <div className="loc-grid">
                    {filtered.map(loc => {
                        const isFav = favIds.has(loc.codUnicLocatie);
                        return (
                            <div key={loc.codUnicLocatie} className="loc-card">
                                <div className="loc-card-image">
                                    {loc.imagineUrl ? (
                                        <img src={`${API}${loc.imagineUrl}`} alt={loc.numeLoc} />
                                    ) : (
                                        <div className="loc-image-placeholder">
                                            <Building2 size={40} />
                                        </div>
                                    )}
                                    <span className={`loc-type-badge ${loc.tipLocatie === 'Muzeu' ? 'museum' : 'gallery'}`}>
                                        {loc.tipLocatie}
                                    </span>
                                    {session && (
                                        <button
                                            className={`loc-fav-btn ${isFav ? 'active' : ''}`}
                                            onClick={() => toggleFav(loc.codUnicLocatie)}
                                            disabled={toggling === loc.codUnicLocatie}
                                            title={isFav ? 'Elimină din favorite' : 'Adaugă la favorite'}
                                        >
                                            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                                        </button>
                                    )}
                                </div>
                                <div className="loc-card-body">
                                    <h2>{loc.numeLoc}</h2>
                                    <p className="loc-location">
                                        <MapPin size={14} />
                                        {loc.orasLoc}{loc.judet ? `, ${loc.judet}` : ''}
                                    </p>
                                    {loc.scurtaDescriere && (
                                        <p className="loc-description">{loc.scurtaDescriere}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
