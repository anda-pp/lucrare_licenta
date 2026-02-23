import { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, ExternalLink, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Artists.css';

export default function Artists() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchArtists();
    }, []);

    const fetchArtists = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/artists', {
                withCredentials: true,
            });
            if (response.data.success) {
                setArtists(response.data.data);
            }
        } catch (error) {
            console.error('Eroare încărcare artiști:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="artists-loading">Se încarcă artiștii...</div>;
    }

    return (
        <div className="artists-page">
            <header className="artists-header">
                <h1>Artiști Români Contemporani</h1>
                <p>Descoperă talentul local. Cunoaște poveștile din spatele operelor de artă expuse în muzeele și galeriile noastre.</p>
            </header>

            {artists.length === 0 ? (
                <div className="no-artists">
                    <Palette size={48} strokeWidth={1} />
                    <h3>Momentan nu există artiști promovați</h3>
                    <p>Urmărește-ne pentru a descoperi noi talente în curând.</p>
                </div>
            ) : (
                <div className="artists-grid">
                    {artists.map(artist => (
                        <div key={artist.id} className="artist-card" onClick={() => navigate(`/artists/${artist.id}`)}>
                            <div className="artist-image-container">
                                {artist.imagineUrl ? (
                                    <img src={`http://localhost:5000${artist.imagineUrl}`} alt={artist.nume} className="artist-image" />
                                ) : (
                                    <div className="artist-image-placeholder">
                                        <Palette size={40} />
                                    </div>
                                )}
                            </div>

                            <div className="artist-info">
                                <h2>{artist.nume}</h2>
                                <p className="artist-bio-brief">
                                    {artist.biografie ? artist.biografie.substring(0, 100) + '...' : 'Biografie nedisponibilă momentan.'}
                                </p>

                                <div className="artist-actions">
                                    <span className="read-more">Poveștea artistului <ChevronRight size={16} /></span>
                                    {artist.linkOpere && (
                                        <button
                                            className="portfolio-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(artist.linkOpere, '_blank', 'noopener,noreferrer');
                                            }}
                                            title="Vezi portofoliul"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
