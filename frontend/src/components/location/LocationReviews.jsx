import { useState } from 'react';
import { Star, MessageSquare, ChevronLeft, ChevronRight, UserCircle2, Send } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API = 'http://localhost:5000';
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
        <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'none'} stroke={i < rating ? '#f59e0b' : '#475569'} />
    ));
}

function InteractiveStars({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    size={24}
                    fill={(hover || value) > i ? '#f59e0b' : 'none'}
                    stroke={(hover || value) > i ? '#f59e0b' : 'var(--color-border)'}
                    onMouseEnter={() => setHover(i + 1)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(i + 1)}
                />
            ))}
        </div>
    );
}

/**
 * LocationReviews — paginated review carousel + review form.
 *
 * Props:
 *  - reviews, avgRating  (existing)
 *  - session             (auth session, null if not logged in)
 *  - locationId          (string)
 *  - onReviewAdded       (callback to refresh location data)
 */
export default function LocationReviews({ reviews, avgRating, session, locationId, onReviewAdded }) {
    const [page, setPage] = useState(0);
    const toast = useToast();

    // Review form state
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const totalPages = Math.ceil(reviews.length / PAGE_SIZE);
    const visibleReviews = reviews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const alreadyReviewed = session && reviews.some(
        r => r.codUnicUtilizator === session.user?.id
    );

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating < 1) {
            toast.error('Te rugăm să acorzi cel puțin o stea.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/api/users/reviews`, {
                codUnicLocatie: locationId,
                rating,
                descriereRecenzie: text.trim() || undefined,
            }, { withCredentials: true });
            if (res.data.success) {
                toast.success('Recenzia ta a fost adăugată!');
                setRating(0);
                setText('');
                if (onReviewAdded) onReviewAdded();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Eroare la adăugarea recenziei.');
        } finally {
            setSubmitting(false);
        }
    };

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

            {/* Review Form */}
            {session && !alreadyReviewed && (
                <form onSubmit={handleSubmitReview} className="loc-review-form">
                    <h4 style={{ margin: '0 0 0.75rem', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                        Scrie o recenzie
                    </h4>
                    <InteractiveStars value={rating} onChange={setRating} />
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Împărtășește-ți experiența (opțional)..."
                        rows={3}
                        style={{
                            width: '100%', marginTop: '0.75rem', padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)', border: '2px solid var(--color-border)',
                            background: 'var(--color-input-bg)', color: 'var(--color-text-main)',
                            fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                        <button
                            type="submit"
                            disabled={submitting || rating < 1}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.5rem', borderRadius: '25px',
                                background: rating < 1
                                    ? 'var(--color-border)'
                                    : 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                                color: rating < 1 ? 'var(--color-text-muted)' : '#fff',
                                border: 'none', cursor: rating < 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 600, fontSize: '0.9rem',
                                opacity: rating < 1 ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Send size={16} /> {submitting ? 'Se trimite...' : 'Trimite Recenzia'}
                        </button>
                    </div>
                </form>
            )}

            {session && alreadyReviewed && (
                <div className="loc-review-already">
                    Ai adăugat deja o recenzie pentru această locație. O poți edita din secțiunea "Recenziile Mele".
                </div>
            )}

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
                            <button className="loc-reviews-nav-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                                <ChevronLeft size={18} />
                            </button>
                            <span className="loc-reviews-page-info">{page + 1} / {totalPages}</span>
                            <button className="loc-reviews-nav-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
