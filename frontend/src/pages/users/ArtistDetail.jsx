import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Link as LinkIcon, Video, Palette } from 'lucide-react';
import './ArtistDetail.css';

export default function ArtistDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/artists/${id}`, {
                    withCredentials: true,
                });
                if (response.data.success) {
                    setArtist(response.data.data);
                } else {
                    setError('Artistul nu a fost găsit.');
                }
            } catch (err) {
                console.error('Eroare detaliu artist:', err);
                setError('Eroare la încărcarea datelor.');
            } finally {
                setLoading(false);
            }
        };

        fetchArtist();
    }, [id]);

    // Detectăm dacă link-ul de interviu este un video YouTube pentru a-l putea afișa embedded
    const isYouTubeLink = (url) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    // Extragem ID-ul videoclipului YouTube pentru a construi URL-ul de embed
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    if (loading) return <div className="artist-loading">Se încarcă detaliile...</div>;
    if (error) return <div className="artist-error">{error}</div>;
    if (!artist) return null;

    return (
        <div className="artist-detail-page">
            <button className="back-btn" onClick={() => navigate('/user/artists')}>
                <ArrowLeft size={20} />
                Înapoi la Artiști
            </button>

            <div className="artist-profile-header">
                <div className="artist-profile-image">
                    {artist.imagineUrl ? (
                        <img src={`http://localhost:5000${artist.imagineUrl}`} alt={artist.nume} />
                    ) : (
                        <div className="profile-placeholder">
                            <User size={64} />
                        </div>
                    )}
                </div>
                <div className="artist-profile-title">
                    <h1>{artist.nume}</h1>
                    {/* Link extern spre portofoliul complet — deschis în tab nou */}
                    {artist.linkOpere && (
                        <a href={artist.linkOpere} target="_blank" rel="noopener noreferrer" className="external-portfolio-link">
                            <LinkIcon size={18} />
                            Vezi Portofoliul Complet
                        </a>
                    )}
                </div>
            </div>

            <div className="artist-content-grid">
                <div className="main-biography">
                    <section className="detail-section">
                        <h2><Palette size={24} /> Despre Artist</h2>
                        <div className="bio-content">
                            {artist.biografie ? (
                                <p>{artist.biografie}</p>
                            ) : (
                                <p className="empty-text">Biografia acestui artist va fi actualizată curând.</p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="sidebar-media">
                    <section className="detail-section highlight-section">
                        <h2><Video size={24} /> Interviu / Prezentare</h2>
                        <div className="media-container">
                            {artist.interviu ? (
                                isYouTubeLink(artist.interviu) ? (
                                    // Dacă link-ul e YouTube, afișăm player-ul embedded
                                    <div className="video-responsive">
                                        <iframe
                                            width="560"
                                            height="315"
                                            src={getYouTubeEmbedUrl(artist.interviu)}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    // Altfel afișăm textul interviului direct
                                    <div className="text-interview">
                                        <p>{artist.interviu}</p>
                                    </div>
                                )
                            ) : (
                                <p className="empty-text">Niciun material media disponibil momentan.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
