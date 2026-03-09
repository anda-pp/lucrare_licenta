import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Trash2, MapPin, Filter, AlertCircle, MessageSquareQuote, User } from 'lucide-react';
import './Reviews.css';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterRating, setFilterRating] = useState('');

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/reviews', { withCredentials: true });
            setReviews(response.data.data);
            setError('');
        } catch (err) {
            setError('Nu s-au putut încărca recenziile');
            console.error('Fetch reviews error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi această recenzie?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/reviews/${id}`, { withCredentials: true });
            setReviews(prev => prev.filter(r => r.numarRecenzie !== id));
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderStars = (rating) =>
        Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? '#f59e0b' : 'none'}
                stroke={i < rating ? '#f59e0b' : 'currentColor'}
                className={i < rating ? '' : 'star-empty'}
            />
        ));

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === parseInt(filterRating))
        : reviews;

    if (loading) return <div className="loading">Se încarcă...</div>;

    return (
        <div className="reviews-page">
            <div className="page-header">
                <h1>Recenzii</h1>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterRating}
                        onChange={e => setFilterRating(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Toate ratingurile</option>
                        <option value="5">Excelent (5 ⭐)</option>
                        <option value="4">Foarte bun (4 ⭐)</option>
                        <option value="3">Bun (3 ⭐)</option>
                        <option value="2">Slab (2 ⭐)</option>
                        <option value="1">Foarte slab (1 ⭐)</option>
                    </select>
                </div>
                <span className="filter-count">{filteredReviews.length} recenzii</span>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {filteredReviews.length === 0 && !loading ? (
                <div className="empty-state">
                    <div className="empty-icon-wrapper">
                        <MessageSquareQuote size={48} strokeWidth={1} />
                    </div>
                    <p>Nu există recenzii {filterRating ? `cu rating ${filterRating}` : ''}</p>
                    {filterRating && (
                        <button className="btn-reset-filters" onClick={() => setFilterRating('')}>
                            Resetează filtrele
                        </button>
                    )}
                </div>
            ) : (
                <div className="admin-reviews-list">
                    {filteredReviews.map(review => (
                        <div key={review.numarRecenzie} className="admin-review-card">
                            {/* Header: Location pill + date + delete */}
                            <div className="review-card-header">
                                <div className="review-location-pill">
                                    <MapPin size={13} />
                                    <strong>{review.locationName || 'Locație nespecificată'}</strong>
                                    {review.locationCity && <span> · {review.locationCity}</span>}
                                </div>
                                <div className="review-card-meta">
                                    <span className="review-card-date">{formatDate(review.dataRecenzie)}</span>
                                    <button
                                        className="review-delete-btn"
                                        onClick={() => handleDelete(review.numarRecenzie)}
                                        title="Șterge recenzia"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="review-card-stars">
                                {renderStars(review.rating)}
                            </div>

                            {/* Text */}
                            {review.descriereRecenzie && (
                                <p className="review-card-text">"{review.descriereRecenzie}"</p>
                            )}

                            {/* User info */}
                            <div className="review-card-user">
                                <User size={13} />
                                <span className="review-user-name">{review.userName}</span>
                                <span className="review-user-email">{review.userEmail}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
