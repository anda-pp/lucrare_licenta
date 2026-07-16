import { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

const EMPTY_FORM = {
    id: '', nume: '', descriere: '', iconita: 'Star',
    conditie: '', valoareConditie: 1, culoare: '#9333ea', mesajMotivatie: ''
};

export default function BadgesAdmin() {
    const [badges, setBadges] = useState([]);
    // Condițiile tehnice disponibile — vin din backend și definesc ce eveniment declanșează insigna
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [confirmTarget, setConfirmTarget] = useState(null);

    useEffect(() => { fetchBadges(); fetchConditions(); }, []);

    const fetchBadges = async () => {
        try {
            const res = await axios.get(`${API}/api/badges/admin`, { withCredentials: true });
            if (res.data.success) setBadges(res.data.data);
        } catch (err) {
            console.error('Error fetching badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConditions = async () => {
        try {
            const res = await axios.get(`${API}/api/badges/admin/conditions`, { withCredentials: true });
            if (res.data.success) setConditions(res.data.data);
        } catch (err) {
            console.error('Error fetching conditions:', err);
        }
    };

    const handleOpenModal = (badge = null) => {
        if (badge) {
            setEditingId(badge.id);
            setFormData({
                id: badge.id, nume: badge.nume, descriere: badge.descriere || '',
                iconita: badge.iconita || 'Star', conditie: badge.conditie || '',
                valoareConditie: badge.valoare_conditie || 1, culoare: badge.culoare || '#9333ea',
                mesajMotivatie: badge.mesaj_motivatie || ''
            });
        } else {
            setEditingId(null);
            // Pre-selectăm prima condiție disponibilă pentru confort la adăugare rapidă
            setFormData({ ...EMPTY_FORM, conditie: conditions[0]?.conditie || '' });
        }
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (editingId) {
                await axios.put(`${API}/api/badges/admin/${editingId}`, formData, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/badges/admin`, formData, { withCredentials: true });
            }
            setShowModal(false);
            fetchBadges();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Eroare la salvarea insignei.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmTarget) return;
        try {
            await axios.delete(`${API}/api/badges/admin/${confirmTarget}`, { withCredentials: true });
            fetchBadges();
        } catch (err) {
            alert('Eroare la ștergerea insignei.');
        } finally {
            setConfirmTarget(null);
        }
    };

    // Renderăm iconița dinamică din Lucide — fallback la HelpCircle dacă nu există
    const renderIcon = (iconName, color) => {
        const Icon = LucideIcons[iconName];
        if (!Icon) return <LucideIcons.HelpCircle color={color || "var(--color-primary)"} size={24} />;
        return <Icon color={color || "var(--color-primary)"} size={24} />;
    };

    // Helper pentru update parțial al formularului
    const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

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
                                        {/* Preview icon cu culoarea corespunzătoare insignei */}
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
                                    <span className="badge-points">
                                        {b.conditie} &ge; {b.valoare_conditie}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon edit" onClick={() => handleOpenModal(b)} title="Editează Aspectul">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => setConfirmTarget(b.id)} title="Șterge Insignă">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <FormModal
                show={showModal}
                title={editingId ? 'Editează Insignă' : 'Adaugă Insignă Nouă'}
                onClose={() => setShowModal(false)}
                onSubmit={handleSave}
                saving={saving}
                error={formError}
            >
                {/* ID-ul e editat doar la creare — la editare rămâne fix */}
                {!editingId && (
                    <div className="form-group">
                        <label>ID Unic Insignă *</label>
                        <input required type="text" value={formData.id} onChange={e => set('id', e.target.value)} placeholder="ex: b_custom_1" />
                    </div>
                )}
                <div className="form-group">
                    <label>Nume Public Insignă *</label>
                    <input required type="text" value={formData.nume} onChange={e => set('nume', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Descriere / Storytelling</label>
                    <textarea value={formData.descriere} onChange={e => set('descriere', e.target.value)} rows="2" />
                </div>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label>Cod Iconiță (ex: <i>Star, Trophy, Camera</i> din Lucide)</label>
                        <input required type="text" value={formData.iconita} onChange={e => set('iconita', e.target.value)} />
                    </div>
                    <div className="form-group flex-1">
                        <label>Culoare Bază (HEX) *</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="color" style={{ width: '50px', padding: '0', height: '42px', cursor: 'pointer' }} value={formData.culoare} onChange={e => set('culoare', e.target.value)} />
                            <input required type="text" value={formData.culoare} onChange={e => set('culoare', e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label>Mesaj Motivațional</label>
                    <input type="text" value={formData.mesajMotivatie} onChange={e => set('mesajMotivatie', e.target.value)} placeholder="ex: Ești pe drumul cel bun! Păstrează ritmul." />
                </div>
                {/* Condiția tehnică e read-only la editare — schimbarea ei ar reseta progresul tuturor */}
                <div className={`form-row ${editingId ? 'opacity-50 select-none' : ''}`}>
                    <div className="form-group flex-1">
                        <label>Condiție Tehnică {!editingId ? '*' : '(read-only)'}</label>
                        <select
                            required
                            value={formData.conditie}
                            onChange={e => set('conditie', e.target.value)}
                            disabled={!!editingId}
                        >
                            <option value="" disabled>-- Alege o condiție --</option>
                            {/* La editare, condiția veche poate fi „legacy" — o includem ca fallback */}
                            {editingId && formData.conditie && !conditions.some(c => c.conditie === formData.conditie) && (
                                <option value={formData.conditie}>{formData.conditie} (neimplementată)</option>
                            )}
                            {conditions.map(c => (
                                <option key={c.conditie} value={c.conditie}>{c.label}</option>
                            ))}
                        </select>
                        {!editingId && formData.conditie && (
                            <small className="text-muted">
                                {conditions.find(c => c.conditie === formData.conditie)?.description}
                            </small>
                        )}
                    </div>
                    <div className="form-group flex-1">
                        <label>Target Necesar {!editingId ? '*' : '(read-only)'}</label>
                        <input required type="number" min="1" value={formData.valoareConditie} onChange={e => set('valoareConditie', parseInt(e.target.value) || 1)} disabled={!!editingId} />
                    </div>
                </div>
            </FormModal>

            {/* Atenționare specială — ștergerea insignei afectează și progresul utilizatorilor */}
            <ConfirmDialog
                show={!!confirmTarget}
                title="Ștergere Insignă"
                message="Atenție: Ștergerea insignei va șterge automat și progresul/insignele câștigate de utilizatori! Continuați?"
                onConfirm={handleDelete}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
