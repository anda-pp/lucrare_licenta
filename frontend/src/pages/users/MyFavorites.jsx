import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Heart, MapPin, Search } from 'lucide-react';
import { useSession } from '../../lib/auth';
import './MyFavorites.css';

const API = 'http://localhost:5000';

export default function MyFavorites() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        if (session) {
            fetchFavorites();
            // sync if user navigates back via browser
            const onFocus = () => fetchFavorites();
            window.addEventListener('focus', onFocus);
            return () => window.removeEventListener('focus', onFocus);
        }
    }, [session]);

    const fetchFavorites = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-favorites`, { withCredentials: true });
            if (res.data.success) {
                setFavorites(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFav = async (locId) => {
        setToggling(locId);
        try {
            // We are on the favorites page, so toggle always means remove
            await axios.delete(`${API}/api/users/my-favorites/${locId}`, { withCredentials: true });
            setFavorites(prev => prev.filter(f => f.codUnicLocatie !== locId));
        } catch (err) {
            console.error(err);
        } finally {
            setToggling(null);
        }
    };

    const filtered = favorites.filter(f =>
        f.numeLoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.orasLoc && f.orasLoc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="my-favs-loading">Se încarcă favoritele...</div>;

    return (
        <div className="my-favs-page">
            <header className="page-header">
                <h1>Muzeele Mele Favorite</h1>
                <p>Lista locațiilor pe care le-ai salvat pentru a le vizita pe viitor.</p>
            </header>

            <div className="my-favs-actions">
                <div className="my-favs-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Caută în favorite..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="my-favs-count">{filtered.length} salvate</span>
            </div>

            {filtered.length === 0 ? (
                <div className="my-favs-empty">
                    <Heart size={48} strokeWidth={1} />
                    <h3>Niciun muzeu favorit găsit</h3>
                    <p>{searchTerm ? 'Nu am găsit potriviri pentru căutare.' : 'Descoperă și salvează muzee și galerii care te interesează.'}</p>
                    {!searchTerm && (
                        <button className="my-favs-explore-btn" onClick={() => navigate('/user/locations')}>
                            Explorează Locații
                        </button>
                    )}
                </div>
            ) : (
                <div className="my-favs-grid">
                    {filtered.map(fav => (
                        <div
                            key={fav.id || fav.codUnicLocatie}
                            className="my-fav-card"
                            onClick={() => navigate(`/user/locations/${fav.codUnicLocatie}`)}
                        >
                            <div className="my-fav-card-image">
                                {fav.imagineUrl ? (
                                    <img src={`${API}${fav.imagineUrl}`} alt={fav.numeLoc} />
                                ) : (
                                    <div className="my-fav-placeholder">
                                        <Building2 size={32} />
                                    </div>
                                )}
                                <span className={`my-fav-type-badge ${fav.tipLocatie === 'Muzeu' ? 'museum' : 'gallery'}`}>
                                    {fav.tipLocatie}
                                </span>
                                <button
                                    className="my-fav-remove-btn"
                                    onClick={(e) => { e.stopPropagation(); toggleFav(fav.codUnicLocatie); }}
                                    disabled={toggling === fav.codUnicLocatie}
                                    title="Elimină din favorite"
                                >
                                    <Heart size={16} fill="currentColor" />
                                </button>
                            </div>
                            <div className="my-fav-card-body">
                                <h2>{fav.numeLoc}</h2>
                                <p className="my-fav-location">
                                    <MapPin size={14} />
                                    {fav.orasLoc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
