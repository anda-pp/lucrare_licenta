import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../lib/auth';
import { ArrowLeft, Heart, Building2 } from 'lucide-react';
import LocationHero from '../../components/location/LocationHero';
import LocationInfoGrid from '../../components/location/LocationInfoGrid';
import LocationTickets from '../../components/location/LocationTickets';
import LocationReviews from '../../components/location/LocationReviews';
import './LocationDetail.css';

const API = 'http://localhost:5000';

export default function LocationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: session } = useSession();

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [favToggling, setFavToggling] = useState(false);

    useEffect(() => {
        fetchLocation();
    }, [id]);

    useEffect(() => {
        if (session && location) checkFav();
    }, [session, location]);

    const fetchLocation = async () => {
        try {
            const res = await axios.get(`${API}/api/locations/${id}`, { withCredentials: true });
            if (res.data.success) {
                setLocation(res.data.data);
            } else {
                setNotFound(true);
            }
        } catch (e) {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const checkFav = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-favorites`, { withCredentials: true });
            if (res.data.success) {
                setIsFav(res.data.data.some(f => f.codUnicLocatie === id));
            }
        } catch (_) { }
    };

    const toggleFav = async () => {
        if (!session) return;
        setFavToggling(true);
        try {
            if (isFav) {
                await axios.delete(`${API}/api/users/my-favorites/${id}`, { withCredentials: true });
                setIsFav(false);
            } else {
                await axios.post(`${API}/api/users/my-favorites/${id}`, {}, { withCredentials: true });
                setIsFav(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFavToggling(false);
        }
    };

    if (loading) return (
        <div className="loc-detail-loading">
            <div className="loading-spinner" />
            <p>Se încarcă...</p>
        </div>
    );

    if (notFound) return (
        <div className="loc-detail-not-found">
            <Building2 size={64} strokeWidth={1} />
            <h2>Locația nu a fost găsită</h2>
            <button className="back-btn" onClick={() => navigate('/user/locations')}>
                <ArrowLeft size={16} /> Înapoi la Locații
            </button>
        </div>
    );

    const avgRating = location.reviews?.length > 0
        ? (location.reviews.reduce((s, r) => s + r.rating, 0) / location.reviews.length).toFixed(1)
        : null;

    return (
        <div className="loc-detail-page">
            {/* Back button */}
            <button className="back-btn" onClick={() => navigate('/user/locations')}>
                <ArrowLeft size={16} /> Înapoi la Locații
            </button>

            {/* Hero section */}
            <LocationHero
                location={location}
                isFav={isFav}
                favToggling={favToggling}
                session={session}
                onToggleFav={toggleFav}
                avgRating={avgRating}
            />

            <div className="loc-detail-body">
                <div className="loc-info-section">
                    {/* Description */}
                    {location.scurtaDescriere && (
                        <div className="loc-info-card full-width">
                            <h3>Despre</h3>
                            <p>{location.scurtaDescriere}</p>
                        </div>
                    )}

                    {/* Ticket prices */}
                    {location.ticketTypes?.length > 0 && (
                        <LocationTickets tickets={location.ticketTypes} locationId={id} orar={location.orar} />
                    )}
                </div>

                <div className="loc-detail-right">
                    {/* Details grid */}
                    <LocationInfoGrid location={location} />
                </div>
            </div>

            {/* Reviews (Full Width) */}
            <div className="loc-detail-reviews-container" style={{ marginTop: '2rem' }}>
                <LocationReviews
                    reviews={location.reviews || []}
                    avgRating={avgRating}
                    session={session}
                    locationId={id}
                    onReviewAdded={fetchLocation}
                />
            </div>
        </div>
    );
}
