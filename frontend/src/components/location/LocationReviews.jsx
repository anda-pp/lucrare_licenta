import { useState } from 'react';
import { Star, MessageSquare, ChevronLeft, ChevronRight, UserCircle2 } from 'lucide-react';

const PAGE_SIZE = 3;

function timeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'azi';
    if (diffDays === 1) return 'ieri';
    if (diffDays < 7) return `acum ${diffDays} zile`;
    if (diffDays < 30) return `acum ${Math.floor(diffDays / 7)} săptămâni`;
    if (diffDays < 365) return `acum ${Math.floor(diffDays / 30)} luni`;
    return `acum ${Math.floor(diffDays / 365)} ani`;
}

function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
        <Star
            key={i}
            size={14}
            fill={i < rating ? '#f59e0b' : 'none'}
            stroke={i < rating ? '#f59e0b' : '#475569'}
        />
    ));
}

/**
 * LocationReviews — paginated review carousel, 3 per page,
 * showing author name, relative time, stars and message.
 */
export default function LocationReviews({ reviews, avgRating }) {
    const [page, setPage] = useState(0);

    const totalPages = Math.ceil(reviews.length / PAGE_SIZE);
    const visibleReviews = reviews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="loc-reviews-card">
            <div className="loc-reviews-header">
                <h3><MessageSquare size={18} /> Recenzii</h3>
                {avgRating && (
                    <div className="loc-avg-rating">
                        <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                        <strong>{avgRating}</strong>
                        <span>({reviews.length} {reviews.length === 1 ? 'recenzie' : 'recenzii'})</span>
                    </div>
                )}
            </div>

            {reviews.length === 0 ? (
                <p className="loc-reviews-empty">Nicio recenzie încă. Fii primul!</p>
            ) : (
                <>
                    <div className="loc-reviews-grid">
                        {visibleReviews.map(r => (
                            <div key={r.numarRecenzie} className="loc-review-card">
                                <div className="loc-review-card-header">
                                    <div className="loc-review-author">
                                        <UserCircle2 size={32} strokeWidth={1.5} className="loc-review-avatar" />
                                        <div>
                                            <span className="loc-review-name">
                                                {r.numeUtilizator || r.numeComplet || 'Utilizator'}
                                            </span>
                                            <span className="loc-review-time">{timeAgo(r.dataRecenziei || r.dataRecenzie)}</span>
                                        </div>
                                    </div>
                                    <div className="loc-review-stars">{renderStars(r.rating)}</div>
                                </div>
                                {(r.textRecenzie || r.descriereRecenzie) && (
                                    <p className="loc-review-text">
                                        "{r.textRecenzie || r.descriereRecenzie}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="loc-reviews-pagination">
                            <button
                                className="loc-reviews-nav-btn"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="loc-reviews-page-info">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                className="loc-reviews-nav-btn"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
