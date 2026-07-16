import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Search, MessageSquareX } from 'lucide-react';
import '../admin/Dashboard.css';
import './MyMuseum.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`${API}/api/museum-admin/reviews`, { withCredentials: true });
                if (res.data.success) {
                    setReviews(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    // Filtrăm simultan după text (nume/comentariu) și după rating
    const filteredReviews = reviews.filter(r => {
        const matchesSearch = (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (r.comentariu || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesRating = true;
        // Filtrul '1,2' acoperă recenziile negative — util pentru monitorizare rapidă
        if (filterRating === '1,2') {
            matchesRating = r.rating === 1 || r.rating === 2;
        } else if (filterRating) {
            matchesRating = r.rating === parseInt(filterRating);
        }

        return matchesSearch && matchesRating;
    });
    
    return (
        <div className="dashboard-page">
            <div className="page-header museum-page-header">
                <div>
                    <h1 className="page-title">Recenzii & Rating</h1>
                    <p className="subtitle">Citește părerile vizitatorilor despre experiența la muzeu.</p>
                </div>
            </div>

            <div className="museum-card">
                <div className="museum-card-header museum-search-header-multi">
                    <div className="museum-search-bar">
                        <Search size={16} className="search-icon-muted" />
                        <input 
                            type="text" 
                            placeholder="Caută recenzie..." 
                            className="museum-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="museum-filter-select"
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                    >
                        <option value="">Toate Notele</option>
                        <option value="5">5 Stele</option>
                        <option value="4">4 Stele</option>
                        <option value="3">3 Stele</option>
                        <option value="1,2">Negative (1-2 Stele)</option>
                    </select>
                </div>
                
                <div className="table-container museum-table-container">
                    <table className="activity-table museum-activity-table">
                        <thead>
                            <tr>
                                <th>Vizitator</th>
                                <th>Rating</th>
                                <th>Comentariu</th>
                                <th>Dată Adăugare</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="museum-empty-state">Se încarcă recenziile...</td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="museum-empty-state">
                                        <Star size={40} className="museum-empty-icon" />
                                        {searchTerm || filterRating ? 'Nu s-au găsit recenzii conform filtrelor.' : 'Muzeul nu a primit recenzii încă.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredReviews.map(rev => (
                                    <tr key={rev.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{rev.userName || 'Anonim'}</div>
                                            <div className="muted">{rev.userEmail || '-'}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Star size={16}
                                                    fill={rev.rating >= 4 ? '#eab308' : rev.rating >= 3 ? '#fbbf24' : 'var(--color-text-muted)'}
                                                    color={rev.rating >= 4 ? '#eab308' : rev.rating >= 3 ? '#fbbf24' : 'var(--color-text-muted)'}
                                                />
                                                <span style={{ fontWeight: 600 }}>{rev.rating}/5</span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', color: 'var(--color-text-main)' }}>
                                                {rev.comentariu ? `"${rev.comentariu}"` : <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Fără text</span>}
                                            </p>
                                        </td>
                                        <td className="muted">
                                            {rev.data ? new Date(rev.data).toLocaleDateString('ro-RO') : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
