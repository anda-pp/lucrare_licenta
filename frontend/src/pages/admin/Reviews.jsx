import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Trash2, MapPin, Quote, Filter, AlertCircle, MessageSquare } from 'lucide-react';
import './Reviews.css';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterRating, setFilterRating] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/reviews', {
                withCredentials: true,
            });
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
            await axios.delete(`http://localhost:5000/api/reviews/${id}`, {
                withCredentials: true,
            });
            fetchReviews();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const renderStars = (rating) => {
        return (
            <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={16}
                        className={i < rating ? 'star-filled' : 'star-empty'}
                        fill={i < rating ? "#0ea5e9" : "none"}
                    />
                ))}
            </div>
        );
    };

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === parseInt(filterRating))
        : reviews;

    if (loading) {
        return <div className="loading">Se încarcă...</div>;
    }

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
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Toate ratingurile</option>
                        <option value="5">Excellent (5)</option>
                        <option value="4">Foarte bun (4)</option>
                        <option value="3">Bun (3)</option>
                        <option value="2">Slab (2)</option>
                        <option value="1">Foarte slab (1)</option>
                    </select>
                </div>
                <span className="filter-count">{filteredReviews.length} recenzii</span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="reviews-grid">
                {filteredReviews.map((review) => (
                    <div key={review.numarRecenzie} className="review-card">
                        <div className="review-header">
                            <div className="review-rating">{renderStars(review.rating)}</div>
                            <span className="review-date">{formatDate(review.dataRecenzie)}</span>
                        </div>

                        <div className="review-location">
                            <MapPin size={16} className="location-icon" />
                            {review.locationName}
                        </div>

                        <div className="review-content-wrapper">
                            <Quote size={20} className="quote-icon start" />
                            <p className="review-content">{review.descriereRecenzie}</p>
                        </div>

                        <div className="review-footer">
                            <div className="reviewer-info">
                                <span className="reviewer-name">{review.userName}</span>
                                <span className="reviewer-email">{review.userEmail}</span>
                            </div>
                            <button
                                className="btn-danger-small icon-btn-small"
                                onClick={() => handleDelete(review.numarRecenzie)}
                                title="Șterge recenzia"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredReviews.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon-wrapper">
                        <MessageSquare size={48} />
                    </div>
                    <p>Nu există recenzii {filterRating ? `cu rating ${filterRating}` : ''}</p>
                    {filterRating && (
                        <button className="btn-reset-filters" onClick={() => setFilterRating('')}>
                            Resetează filtrele
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

