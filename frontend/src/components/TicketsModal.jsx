import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Save, Edit2 } from 'lucide-react';
import './TicketsModal.css';

const API = 'http://localhost:5000';

const TICKET_TYPES = ['Adult', 'Elev', 'Student', 'Pensionar', 'Altele'];

export default function TicketsModal({ location, onClose }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ tipBilet: '', pret: '' });
    const [newForm, setNewForm] = useState({ tipBilet: 'Adult', pret: '' });
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/locations/${location.codUnicLocatie}/tickets`, { withCredentials: true });
            if (res.data.success) setTickets(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post(`${API}/api/locations/${location.codUnicLocatie}/tickets`, {
                tipBilet: newForm.tipBilet,
                pret: parseFloat(newForm.pret),
            }, { withCredentials: true });
            setNewForm({ tipBilet: 'Adult', pret: '' });
            setAdding(false);
            fetchTickets();
        } catch (err) {
            alert(err.response?.data?.error || 'Eroare la adăugare.');
        } finally { setSaving(false); }
    };

    const handleUpdate = async (id) => {
        setSaving(true);
        try {
            await axios.put(`${API}/api/locations/tickets/${id}`, {
                tipBilet: editForm.tipBilet,
                pret: parseFloat(editForm.pret),
            }, { withCredentials: true });
            setEditingId(null);
            fetchTickets();
        } catch (err) {
            alert(err.response?.data?.error || 'Eroare la actualizare.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Ștergi acest tip de bilet?')) return;
        try {
            await axios.delete(`${API}/api/locations/tickets/${id}`, { withCredentials: true });
            fetchTickets();
        } catch (err) {
            alert(err.response?.data?.error || 'Eroare la ștergere.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="event-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                    <h2>Bilete — {location.numeLoc}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="tickets-modal">
                    {loading ? (
                        <p className="tickets-loading">Se încarcă...</p>
                    ) : (
                        <>
                            <table className="tickets-table">
                                <thead>
                                    <tr>
                                        <th>Tip</th>
                                        <th>Preț (Lei)</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(t => (
                                        <tr key={t.codUnicTipBilet}>
                                            {editingId === t.codUnicTipBilet ? (
                                                <>
                                                    <td>
                                                        <select
                                                            className="tickets-select compact"
                                                            value={editForm.tipBilet}
                                                            onChange={e => setEditForm({ ...editForm, tipBilet: e.target.value })}
                                                        >
                                                            {TICKET_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="tickets-input compact price-edit"
                                                            value={editForm.pret}
                                                            onChange={e => setEditForm({ ...editForm, pret: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="td-actions">
                                                        <button className="btn-primary icon-btn compact" disabled={saving} onClick={() => handleUpdate(t.codUnicTipBilet)}>
                                                            <Save size={14} /> Salvează
                                                        </button>
                                                        <button className="btn-secondary icon-btn compact" onClick={() => setEditingId(null)}>
                                                            Anulează
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="td-type">{t.tipBilet}</td>
                                                    <td>{Number(t.pret).toFixed(2)} Lei</td>
                                                    <td className="td-actions">
                                                        <button
                                                            className="btn-secondary icon-btn compact"
                                                            onClick={() => { setEditingId(t.codUnicTipBilet); setEditForm({ tipBilet: t.tipBilet, pret: t.pret }); }}
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            className="btn-danger icon-btn compact"
                                                            onClick={() => handleDelete(t.codUnicTipBilet)}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {tickets.length === 0 && (
                                        <tr><td colSpan={3} className="tickets-empty">Niciun tip de bilet definit.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {adding ? (
                                <form onSubmit={handleAdd} className="tickets-add-form">
                                    <div className="field">
                                        <label>Tip Bilet</label>
                                        <select
                                            className="tickets-select"
                                            value={newForm.tipBilet}
                                            onChange={e => setNewForm({ ...newForm, tipBilet: e.target.value })}
                                        >
                                            {TICKET_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Preț (Lei)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            placeholder="0.00"
                                            className="tickets-input price-new"
                                            value={newForm.pret}
                                            onChange={e => setNewForm({ ...newForm, pret: e.target.value })}
                                        />
                                    </div>
                                    <div className="actions">
                                        <button type="submit" className="btn-primary icon-btn" disabled={saving}>
                                            <Plus size={14} /> Adaugă
                                        </button>
                                        <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Anulează</button>
                                    </div>
                                </form>
                            ) : (
                                <button className="btn-primary icon-btn tickets-add-trigger" onClick={() => setAdding(true)}>
                                    <Plus size={16} /> Adaugă Tip Bilet
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
