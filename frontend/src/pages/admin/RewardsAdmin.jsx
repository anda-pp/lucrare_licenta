import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

export default function RewardsAdmin() {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nume: '',
        descriere: '',
        puncteNecesare: 100,
        tip: 'voucher',
        valoare: '',
        activ: true
    });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const res = await axios.get(`${API}/api/rewards`, { withCredentials: true });
            if (res.data.success) {
                setRewards(res.data.data);
            }
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
                nume: reward.nume,
                descriere: reward.descriere || '',
                puncteNecesare: reward.puncte_necesare,
                tip: reward.tip || 'voucher',
                valoare: reward.valoare || '',
                activ: reward.activ === 1 || reward.activ === true
            });
        } else {
            setEditingId(null);
            setFormData({
                nume: '',
                descriere: '',
                puncteNecesare: 100,
                tip: 'voucher',
                valoare: 0,
                activ: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API}/api/rewards/${editingId}`, formData, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/rewards`, formData, { withCredentials: true });
            }
            setShowModal(false);
            fetchRewards();
        } catch (err) {
            alert(err.response?.data?.message || 'Eroare la salvarea recompensei.');
        }
    };

    const handleDeactivate = async (id) => {
        if (!confirm('Ești sigur că vrei să dezactivezi această recompensă?')) return;
        try {
            await axios.delete(`${API}/api/rewards/${id}`, { withCredentials: true });
            fetchRewards();
        } catch (err) {
            alert('Eroare la dezactivare.');
        }
    };

    if (loading) return <div className="admin-loading">Se încarcă catalogul...</div>;

    return (
        <div className="admin-page rewards-admin">
            <header className="admin-page-header">
                <div>
                    <h1>Management Recompense</h1>
                    <p>Adaugă, editează sau dezactivează recompensele disponibile la schimb pe puncte.</p>
                </div>
                <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Recompensă Nouă
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
                                <td>
                                    <span className="badge-points">{r.puncte_necesare} pct</span>
                                </td>
                                <td>
                                    <span className="badge-type">{r.tip}</span>
                                    {r.valoare && <div className="text-sm">({r.valoare})</div>}
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
                                        {r.activ === 1 && (
                                            <button className="btn-icon delete" onClick={() => handleDeactivate(r.id)} title="Dezactivează">
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

            {/* Modal - A simplified overlay */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingId ? 'Editează Recompensa' : 'Recompensă Nouă'}</h2>
                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-group">
                                <label>Nume Recompensă *</label>
                                <input required type="text" value={formData.nume} onChange={e => setFormData({ ...formData, nume: e.target.value })} placeholder="ex: Bilet Gratuit" />
                            </div>

                            <div className="form-group">
                                <label>Descriere</label>
                                <textarea value={formData.descriere} onChange={e => setFormData({ ...formData, descriere: e.target.value })} rows="3"></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Cost Puncte *</label>
                                    <input required type="number" min="1" value={formData.puncteNecesare} onChange={e => setFormData({ ...formData, puncteNecesare: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Tip Beneficiu *</label>
                                    <select value={formData.tip} onChange={e => setFormData({ ...formData, tip: e.target.value })}>
                                        <option value="bilet_gratuit">Bilet Gratuit</option>
                                        <option value="reducere">Reducere %</option>
                                        <option value="voucher">Voucher Bani</option>
                                        <option value="tur_ghidat">Tur Ghidat</option>
                                        <option value="suvenir">Suvenir</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Valoare Nominală (ex: 15 lei, 10%) - Cifră exactă *</label>
                                <input required type="number" step="0.01" value={formData.valoare} onChange={e => setFormData({ ...formData, valoare: parseFloat(e.target.value) || 0 })} placeholder="ex: 10, 50, 0" />
                            </div>

                            {editingId && (
                                <div className="form-checkbox">
                                    <label>
                                        <input type="checkbox" checked={formData.activ} onChange={e => setFormData({ ...formData, activ: e.target.checked })} />
                                        <span>Recompensă Activă (vizibilă pentru clienți)</span>
                                    </label>
                                </div>
                            )}

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
