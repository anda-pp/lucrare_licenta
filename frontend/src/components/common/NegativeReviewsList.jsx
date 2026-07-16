import { AlertTriangle, ThumbsUp, Star, Calendar, User } from 'lucide-react';
import StarRating from './StarRating';

// Lista recenziilor negative recente (rating ≤ 2) — pentru monitorizare și follow-up rapid
// Dacă nu există recenzii negative, afișăm un mesaj pozitiv cu thumbs up
export default function NegativeReviewsList({ reviews = [] }) {
    return (
        <div className="mr-negative-section">
            <h3 className="mr-section-title">
                <AlertTriangle size={18} />
                Recenzii Negative Recente (&le; 2 &#9733;)
            </h3>

            {reviews.length === 0 ? (
                <div className="mr-no-negative">
                    <ThumbsUp size={28} />
                    <p>Nu există recenzii negative! Clienții sunt mulțumiți.</p>
                </div>
            ) : (
                <div className="mr-negative-list">
                    {reviews.map(r => (
                        <div key={r.numarRecenzie} className="mr-negative-card">
                            <div className="mr-neg-header">
                                {/* Stelele negative în roșu pentru a sublinia ratingul slab */}
                                <StarRating value={r.rating} size={13} filledColor="#ef4444" emptyColor="var(--color-border)" />
                                <span className="mr-neg-date">
                                    <Calendar size={13} />
                                    {r.data ? new Date(r.data).toLocaleDateString('ro-RO') : 'N/A'}
                                </span>
                            </div>
                            {r.descriere && <p className="mr-neg-text">"{r.descriere}"</p>}
                            <span className="mr-neg-author"><User size={13} /> {r.userName}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
