import { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, BadgeInfo, Plus, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

export default function BadgesAdmin() {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        nume: '',
        descriere: '',
        iconita: 'Star',
        conditie: '',
        valoareConditie: 1,
        culoare: '#9333ea',
        mesajMotivatie: ''
    });

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            const res = await axios.get(`${API}/api/badges/admin`, { withCredentials: true });
            if (res.data.success) {
                setBadges(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (badge = null) => {
        if (badge) {
            setEditingId(badge.id);
            setFormData({
                id: badge.id,
                nume: badge.nume,
                descriere: badge.descriere || '',
                iconita: badge.iconita || 'Star',
                conditie: badge.conditie || '',
                valoareConditie: badge.valoare_conditie || 1,
                culoare: badge.culoare || '#9333ea',
                mesajMotivatie: badge.mesaj_motivatie || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                id: '',
                nume: '',
                descriere: '',
                iconita: 'Star',
                conditie: 'custom_condition',
                valoareConditie: 1,
                culoare: '#9333ea',
                mesajMotivatie: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API}/api/badges/admin/${editingId}`, formData, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/badges/admin`, formData, { withCredentials: true });
            }
            setShowModal(false);
            fetchBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'Eroare la salvarea insignei.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Atenție: Ștergerea insignei va șterge automat și progresul/insignele câștigate de utilizatori! Continuați?')) return;
        try {
            await axios.delete(`${API}/api/badges/admin/${id}`, { withCredentials: true });
            fetchBadges();
        } catch (err) {
            alert('Eroare la ștergerea insignei.');
        }
    };

    // Render dynamic lucide icon
    const renderIcon = (iconName, color) => {
        const Icon = LucideIcons[iconName];
        if (!Icon) return <LucideIcons.HelpCircle color={color || "var(--color-primary)"} size={24} />;
        return <Icon color={color || "var(--color-primary)"} size={24} />;
    };

    if (loading) return <div className="admin-loading">Se încarcă insignele...</div>;

    return (
        <div className="admin-page rewards-admin">
            <header className="admin-page-header">
                <div>
                    <h1>Catalog Insigne (Gamification)</h1>
                    <p>Gestionează vizualizarea grafică și textele insignelor acordate utilizatorilor.</p>
                </div>
                <button className="btn-primary icon-btn" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Adaugă Insignă
                </button>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Insignă</th>
                            <th>Iconiță / Culoare</th>
                            <th>Condiție Tehnică (Target)</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {badges.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Nu există insigne configurate.</td></tr>
                        ) : badges.map(b => (
                            <tr key={b.id}>
                                <td>
                                    <strong>{b.nume}</strong>
                                    <div className="text-muted text-sm">{b.descriere}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 8,
                                            background: `linear-gradient(135deg, ${b.culoare}40, ${b.culoare})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {renderIcon(b.iconita, 'white')}
                                        </div>
                                        <span className="text-sm code">{b.iconita}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge-points" style={{ background: '#f1f5f9', color: '#0f172a' }}>
                                        {b.conditie} &ge; {b.valoare_conditie}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon edit" onClick={() => handleOpenModal(b)} title="Editează Aspectul">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(b.id)} title="Șterge Insignă">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingId ? 'Editează Insignă' : 'Adaugă Insignă Nouă'}</h2>
                        <form onSubmit={handleSave} className="admin-form">
                            {!editingId && (
                                <div className="form-group">
                                    <label>ID Unic Insignă *</label>
                                    <input required type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="ex: b_custom_1" />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Nume Public Insignă *</label>
                                <input required type="text" value={formData.nume} onChange={e => setFormData({ ...formData, nume: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Descriere / Storytelling</label>
                                <textarea value={formData.descriere} onChange={e => setFormData({ ...formData, descriere: e.target.value })} rows="2"></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Cod Iconiță (ex: <i>Star, Trophy, Camera</i> din Lucide)</label>
                                    <input required type="text" value={formData.iconita} onChange={e => setFormData({ ...formData, iconita: e.target.value })} />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Culoare Bază (HEX) *</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="color" style={{ width: '50px', padding: '0', height: '42px', cursor: 'pointer' }} value={formData.culoare} onChange={e => setFormData({ ...formData, culoare: e.target.value })} />
                                        <input required type="text" value={formData.culoare} onChange={e => setFormData({ ...formData, culoare: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mesaj Motivațional</label>
                                <input type="text" value={formData.mesajMotivatie} onChange={e => setFormData({ ...formData, mesajMotivatie: e.target.value })} placeholder="ex: Ești pe drumul cel bun! Păstrează ritmul." />
                            </div>

                            {/* Informative / required variables */}
                            <div className={`form-row ${editingId ? 'opacity-50 select-none' : ''}`}>
                                <div className="form-group flex-1">
                                    <label>Condiție Tehnică {!editingId ? '*' : '(read-only)'}</label>
                                    <input required type="text" value={formData.conditie} onChange={e => setFormData({ ...formData, conditie: e.target.value })} disabled={!!editingId} />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Target Necesar {!editingId ? '*' : '(read-only)'}</label>
                                    <input required type="number" min="1" value={formData.valoareConditie} onChange={e => setFormData({ ...formData, valoareConditie: parseInt(e.target.value) || 1 })} disabled={!!editingId} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Anulare</button>
                                <button type="submit" className="btn-primary">Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
