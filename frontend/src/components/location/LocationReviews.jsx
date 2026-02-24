import { Star, MessageSquare } from 'lucide-react';

/**
 * LocationReviews — review list with stars and average rating
 */
export default function LocationReviews({ reviews, avgRating }) {
    const renderStars = (rating) =>
        Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={14}
                fill={i < rating ? '#f59e0b' : 'none'}
                stroke={i < rating ? '#f59e0b' : '#cbd5e1'}
            />
        ));

    return (
        <div className="loc-reviews-card">
            <div className="loc-reviews-header">
                <h3><MessageSquare size={18} /> Recenzii</h3>
                {avgRating && (
                    <div className="loc-avg-rating">
                        <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                        <strong>{avgRating}</strong>
                        <span>({reviews.length})</span>
                    </div>
                )}
            </div>

            {reviews.length === 0 ? (
                <p className="loc-reviews-empty">Nicio recenzie încă. Fii primul!</p>
            ) : (
                <div className="loc-reviews-list">
                    {reviews.slice(0, 5).map(r => (
                        <div key={r.numarRecenzie} className="loc-review-item">
                            <div className="loc-review-top">
                                <div className="loc-review-stars">{renderStars(r.rating)}</div>
                                <span className="loc-review-date">
                                    {r.dataRecenziei
                                        ? new Date(r.dataRecenziei).toLocaleDateString('ro-RO')
                                        : ''}
                                </span>
                            </div>
                            {r.textRecenzie && (
                                <p className="loc-review-text">"{r.textRecenzie}"</p>
                            )}
                        </div>
                    ))}
                    {reviews.length > 5 && (
                        <p className="loc-reviews-more">+{reviews.length - 5} recenzii suplimentare</p>
                    )}
                </div>
            )}
        </div>
    );
}
