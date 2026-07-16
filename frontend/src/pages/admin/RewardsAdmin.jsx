import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

const EMPTY_FORM = { nume: '', descriere: '', puncteNecesare: 100, tip: 'voucher', valoare: 0, activ: true };

export default function RewardsAdmin() {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [confirmTarget, setConfirmTarget] = useState(null);

    useEffect(() => { fetchRewards(); }, []);

    const fetchRewards = async () => {
        try {
            const res = await axios.get(`${API}/api/rewards`, { withCredentials: true });
            if (res.data.success) setRewards(res.data.data);
        } catch (err) {
            console.error('Error fetching rewards:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (reward = null) => {
        if (reward) {
            setEditingId(reward.id);
            setFormData({
                nume: reward.nume, descriere: reward.descriere || '',
                puncteNecesare: reward.puncte_necesare, tip: reward.tip || 'voucher',
                valoare: reward.valoare || '', activ: reward.activ === 1 || reward.activ === true
            });
        } else {
            setEditingId(null);
            setFormData(EMPTY_FORM);
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
                await axios.put(`${API}/api/rewards/${editingId}`, formData, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/rewards`, formData, { withCredentials: true });
            }
            setShowModal(false);
            fetchRewards();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Eroare la salvarea recompensei.');
        } finally {
            setSaving(false);
        }
    };

    // „Ștergerea" e de fapt o dezactivare — recompensele revendicate rămân în istoricul userilor
    const handleDeactivate = async () => {
        if (!confirmTarget) return;
        try {
            await axios.delete(`${API}/api/rewards/${confirmTarget}`, { withCredentials: true });
            fetchRewards();
        } catch (err) {
            alert('Eroare la dezactivare.');
        } finally {
            setConfirmTarget(null);
        }
    };

    const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    if (loading) return <div className="admin-loading">Se încarcă catalogul...</div>;

    return (
        <div className="admin-page rewards-admin">
            <header className="admin-page-header">
                <div>
                    <h1>Management Recompense</h1>
                    <p>Adaugă, editează sau dezactivează recompensele disponibile la schimb pe puncte.</p>
                </div>
                <button className="btn-primary icon-btn" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Adaugă Recompensă
                </button>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nume / Descriere</th>
                            <th>Cost Puncte</th>
                            <th>Beneficiu / Tip</th>
                            <th>Status</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rewards.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Nu există recompense.</td></tr>
                        ) : rewards.map(r => (
                            <tr key={r.id} className={!r.activ ? 'row-inactive' : ''}>
                                <td>
                                    <strong>{r.nume}</strong>
                                    <div className="text-muted text-sm">{r.descriere}</div>
                                </td>
                                <td><span className="badge-points">{r.puncte_necesare} pct</span></td>
                                <td>
                                    <span className="badge-type">{r.tip}</span>
                                    {/* Afișăm valoarea procentuală sau în lei în funcție de tip */}
                                    {r.valoare > 0 && (
                                        <div className="text-sm">
                                            ({r.tip === 'reducere' ? `${r.valoare}%` : `${r.valoare} Lei`})
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {r.activ ? (
                                        <span className="status-badge success"><CheckCircle size={14} /> Activ</span>
                                    ) : (
                                        <span className="status-badge error"><XCircle size={14} /> Inactiv</span>
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon edit" onClick={() => handleOpenModal(r)} title="Editează">
                                            <Edit2 size={16} />
                                        </button>
                                        {/* Dezactivarea e permisă doar pentru recompensele active */}
                                        {r.activ === 1 && (
                                            <button className="btn-icon delete" onClick={() => setConfirmTarget(r.id)} title="Dezactivează">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <FormModal
                show={showModal}
                title={editingId ? 'Editează Recompensa' : 'Adaugă Recompensă'}
                onClose={() => setShowModal(false)}
                onSubmit={handleSave}
                saving={saving}
                error={formError}
            >
                <div className="form-group">
                    <label>Nume Recompensă *</label>
                    <input required type="text" value={formData.nume} onChange={e => set('nume', e.target.value)} placeholder="ex: Bilet Gratuit" />
                </div>
                <div className="form-group">
                    <label>Descriere</label>
                    <textarea value={formData.descriere} onChange={e => set('descriere', e.target.value)} rows="3" />
                </div>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label>Cost Puncte *</label>
                        <input required type="number" min="1" value={formData.puncteNecesare} onChange={e => set('puncteNecesare', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="form-group flex-1">
                        <label>Tip Beneficiu *</label>
                        <select value={formData.tip} onChange={e => set('tip', e.target.value)}>
                            <option value="bilet_gratuit">Bilet Gratuit</option>
                            <option value="reducere">Reducere %</option>
                            <option value="voucher">Voucher Bani</option>
                            <option value="tur_ghidat">Tur Ghidat</option>
                            <option value="suvenir">Suvenir</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    {/* Label-ul se schimbă dinamic în funcție de tipul de beneficiu ales */}
                    <label>{formData.tip === 'reducere' ? 'Valoare Reducere (%)' : 'Valoare Nominală (Lei)'}</label>
                    <input
                        required type="number" step="0.01" min="0"
                        max={formData.tip === 'reducere' ? 100 : undefined}
                        value={formData.valoare}
                        onChange={e => set('valoare', parseFloat(e.target.value) || 0)}
                        placeholder={formData.tip === 'reducere' ? 'ex: 10, 20, 50' : 'ex: 15, 30, 50'}
                    />
                </div>
                {/* Checkbox de activare/dezactivare — vizibil doar la editare */}
                {editingId && (
                    <div className="form-checkbox">
                        <label>
                            <input type="checkbox" checked={formData.activ} onChange={e => set('activ', e.target.checked)} />
                            <span>Recompensă Activă (vizibilă pentru clienți)</span>
                        </label>
                    </div>
                )}
            </FormModal>

            <ConfirmDialog
                show={!!confirmTarget}
                title="Dezactivare Recompensă"
                message="Ești sigur că vrei să dezactivezi această recompensă?"
                confirmLabel="Da, dezactivează"
                onConfirm={handleDeactivate}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
