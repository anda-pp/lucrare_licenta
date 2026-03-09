import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Save, Edit2 } from 'lucide-react';

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

                <div style={{ padding: '1.25rem 1.5rem' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Se încarcă...</p>
                    ) : (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tip</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Preț (Lei)</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(t => (
                                        <tr key={t.codUnicTipBilet} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {editingId === t.codUnicTipBilet ? (
                                                <>
                                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                                        <select value={editForm.tipBilet} onChange={e => setEditForm({ ...editForm, tipBilet: e.target.value })}
                                                            style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                                                            {TICKET_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                                        <input type="number" step="0.01" min="0" value={editForm.pret}
                                                            onChange={e => setEditForm({ ...editForm, pret: e.target.value })}
                                                            style={{ width: '80px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
                                                    </td>
                                                    <td style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.4rem' }}>
                                                        <button className="btn-primary icon-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} disabled={saving} onClick={() => handleUpdate(t.codUnicTipBilet)}>
                                                            <Save size={14} /> Salvează
                                                        </button>
                                                        <button className="btn-secondary icon-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => setEditingId(null)}>
                                                            Anulează
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{t.tipBilet}</td>
                                                    <td style={{ padding: '0.6rem 0.75rem' }}>{Number(t.pret).toFixed(2)} Lei</td>
                                                    <td style={{ padding: '0.6rem 0.75rem', display: 'flex', gap: '0.4rem' }}>
                                                        <button className="btn-secondary icon-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                                                            onClick={() => { setEditingId(t.codUnicTipBilet); setEditForm({ tipBilet: t.tipBilet, pret: t.pret }); }}>
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button className="btn-danger icon-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                                                            onClick={() => handleDelete(t.codUnicTipBilet)}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {tickets.length === 0 && (
                                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Niciun tip de bilet definit.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {adding ? (
                                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Tip Bilet</label>
                                        <select value={newForm.tipBilet} onChange={e => setNewForm({ ...newForm, tipBilet: e.target.value })}
                                            style={{ padding: '0.5rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', width: '100%' }}>
                                            {TICKET_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Preț (Lei)</label>
                                        <input type="number" step="0.01" min="0" required placeholder="0.00" value={newForm.pret}
                                            onChange={e => setNewForm({ ...newForm, pret: e.target.value })}
                                            style={{ width: '90px', padding: '0.5rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button type="submit" className="btn-primary icon-btn" disabled={saving}>
                                            <Plus size={14} /> Adaugă
                                        </button>
                                        <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Anulează</button>
                                    </div>
                                </form>
                            ) : (
                                <button className="btn-primary icon-btn" style={{ marginTop: '1rem' }} onClick={() => setAdding(true)}>
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
