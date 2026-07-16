import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquareQuote, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { useSession } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './MyReviews.css';

const API = 'http://localhost:5000';

export default function MyReviews() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const toast = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Starea de editare inline — o singură recenzie poate fi editată la un moment dat
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editDesc, setEditDesc] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (session) fetchReviews();
    }, [session]);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-reviews`, { withCredentials: true });
            if (res.data.success) {
                setReviews(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await axios.delete(`${API}/api/users/my-reviews/${id}`, { withCredentials: true });
            if (res.data.success) {
                setReviews(prev => prev.filter(r => r.numarRecenzie !== id));
            }
        } catch (err) {
            toast.error('Eroare la ștergerea recenziei.');
            console.error('Delete error:', err);
        } finally {
            setConfirmTarget(null);
        }
    };

    // Populăm câmpurile de editare cu valorile existente ale recenziei selectate
    const startEdit = (review) => {
        setEditingId(review.numarRecenzie);
        setEditRating(review.rating);
        setEditDesc(review.descriereRecenzie || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditRating(0);
        setEditDesc('');
    };

    const saveEdit = async (id) => {
        if (editRating < 1 || editRating > 5) {
            toast.error('Te rugăm să acorzi un rating între 1 și 5 stele.');
            return;
        }
        setSaving(true);
        try {
            const res = await axios.put(`${API}/api/users/my-reviews/${id}`,
                { rating: editRating, descriereRecenzie: editDesc },
                { withCredentials: true }
            );
            if (res.data.success) {
                // Actualizăm local fără re-fetch pentru a evita flicker-ul
                setReviews(prev => prev.map(r => r.numarRecenzie === id
                    ? { ...r, rating: editRating, descriereRecenzie: editDesc }
                    : r
                ));
                cancelEdit();
            }
        } catch (err) {
            toast.error('Eroare la actualizarea recenziei.');
            console.error('Edit error:', err);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Stele read-only pentru afișarea recenziei în modul normal
    const renderStaticStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? '#f59e0b' : 'none'}
                stroke={i < rating ? '#f59e0b' : '#cbd5e1'}
            />
        ));
    };

    // Stele clickabile pentru modul de editare
    const renderInteractiveStars = () => {
        return (
            <div className="interactive-stars">
                {Array.from({ length: 5 }, (_, i) => {
                    const ratingValue = i + 1;
                    return (
                        <Star
                            key={i}
                            size={20}
                            className="star-btn"
                            fill={ratingValue <= editRating ? '#f59e0b' : 'none'}
                            stroke={ratingValue <= editRating ? '#f59e0b' : '#94a3b8'}
                            onClick={() => setEditRating(ratingValue)}
                        />
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className="my-reviews-loading">Se încarcă recenziile...</div>;

    return (
        <div className="my-reviews-page">
            <button className="profile-back-btn" onClick={() => navigate('/user')}>
                <ArrowLeft size={18} /> Înapoi la cont
            </button>
            <header className="page-header">
                <h1>Recenziile Mele</h1>
                <p>Toate părerile și experiențele tale lăsate pentru muzee și galerii.</p>
            </header>

            {reviews.length === 0 ? (
                <div className="my-reviews-empty">
                    <MessageSquareQuote size={48} strokeWidth={1} />
                    <h3>Nu ai nicio recenzie</h3>
                    <p>Împărtășește-ți experiențele cu alții lăsând recenzii locațiilor vizitate!</p>
                </div>
            ) : (
                <div className="reviews-list">
                    {reviews.map(rev => {
                        const isEditing = editingId === rev.numarRecenzie;

                        return (
                            <div key={rev.numarRecenzie} className={`review-card ${isEditing ? 'editing' : ''}`}>
                                <div className="review-header">
                                    <div className="review-location">
                                        <strong>{rev.numeLocatie || 'Locație Nespecificată'}</strong>
                                        {rev.orasLocatie && <span> • {rev.orasLocatie}</span>}
                                    </div>
                                    <div className="review-meta">
                                        <span className="review-date">{formatDate(rev.dataRecenzie)}</span>
                                        {/* Butoanele de editare/ștergere sunt ascunse cât timp recenzia e în modul editare */}
                                        {!isEditing && (
                                            <div className="review-actions">
                                                <button className="icon-btn edit-btn" onClick={() => startEdit(rev)} title="Editează">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn delete-btn" onClick={() => setConfirmTarget(rev.numarRecenzie)} title="Șterge">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="review-edit-form">
                                        <div className="edit-form-group">
                                            <label>Rating:</label>
                                            {renderInteractiveStars()}
                                        </div>
                                        <div className="edit-form-group">
                                            <label>Impresii:</label>
                                            <textarea
                                                value={editDesc}
                                                onChange={(e) => setEditDesc(e.target.value)}
                                                rows={4}
                                                placeholder="Scrie-ți experiența aici..."
                                            />
                                        </div>
                                        <div className="edit-form-actions">
                                            <button
                                                className="btn-save"
                                                onClick={() => saveEdit(rev.numarRecenzie)}
                                                disabled={saving}
                                            >
                                                <Save size={16} /> {saving ? 'Se salvează...' : 'Salvează'}
                                            </button>
                                            <button className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                                                <X size={16} /> Anulează
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="review-body">
                                        <div className="review-rating">
                                            {renderStaticStars(rev.rating)}
                                        </div>
                                        {rev.descriereRecenzie && (
                                            <p className="review-text">"{rev.descriereRecenzie}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <ConfirmDialog
                show={!!confirmTarget}
                title="Ștergere Recenzie"
                message="Ești sigur că vrei să ștergi această recenzie?"
                onConfirm={() => handleDelete(confirmTarget)}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
