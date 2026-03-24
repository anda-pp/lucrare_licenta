import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Edit2, X, Landmark, Globe, MapPin, Clock, Info, Ticket } from 'lucide-react';
import '../admin/Dashboard.css';
import './MyMuseum.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MyMuseum() {
    const [muzeu, setMuzeu] = useState({
        numeLoc: '',
        orasLoc: '',
        adresa: '',
        orar: '',
        scurtaDescriere: '',
        siteOficial: ''
    });

    const [bilete, setBilete] = useState([]);

    const [showTicketModal, setShowTicketModal] = useState(false);
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [ticketForm, setTicketForm] = useState({ tipBilet: '', pret: '' });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { fetchMuseumData(); }, []);

    const fetchMuseumData = async () => {
        try {
            const res = await axios.get(`${API}/api/museum-admin/my-museum`, { withCredentials: true });
            if (res.data.success) {
                setMuzeu(res.data.data);
                setBilete(res.data.data.bilete || []);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'A apărut o eroare la încărcarea datelor.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMuseum = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await axios.put(`${API}/api/museum-admin/my-museum`, muzeu, { withCredentials: true });
            if (res.data.success) {
                setSuccessMsg('Datele muzeului au fost salvate cu succes!');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Eroare la salvare.');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenTicketModal = (ticket = null) => {
        if (ticket) {
            setEditingTicketId(ticket.codUnicTipBilet);
            setTicketForm({ tipBilet: ticket.tipBilet, pret: ticket.pret });
        } else {
            setEditingTicketId(null);
            setTicketForm({ tipBilet: '', pret: '' });
        }
        setShowTicketModal(true);
    };

    const handleSaveTicket = async (e) => {
        e.preventDefault();
        try {
            if (editingTicketId) {
                await axios.put(`${API}/api/museum-admin/tickets/${editingTicketId}`, ticketForm, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/museum-admin/tickets`, ticketForm, { withCredentials: true });
            }
            setShowTicketModal(false);
            fetchMuseumData();
        } catch (err) {
            alert(err.response?.data?.error || 'Eroare la salvarea biletului.');
        }
    };

    const handleDeleteTicket = async (id) => {
        if (!window.confirm('Sigur dorești să ștergi acest pachet de bilete?')) return;
        try {
            await axios.delete(`${API}/api/museum-admin/tickets/${id}`, { withCredentials: true });
            fetchMuseumData();
        } catch (err) {
            alert(err.response?.data?.error || 'Eroare la ștergerea biletului.');
        }
    };

    if (loading) return <div className="loading">Se încarcă detaliile...</div>;

    return (
        <div className="dashboard-page">
            <h1 className="page-title">Sediul Meu: {muzeu.numeLoc}</h1>
            <p className="subtitle">Gestionează biografia publică a locației tale și configurează prețurile biletelor de acces.</p>

            {error && <div className="alert-error">{error}</div>}
            {successMsg && <div className="alert-success">{successMsg}</div>}

            <div className="museum-container">

                {/* 1. Date Generale */}
                <div className="museum-card">
                    <div className="museum-card-header">
                        <h2><Landmark size={20} /> Date Oficiale Locație</h2>
                    </div>
                    <form onSubmit={handleSaveMuseum} className="museum-card-body">
                        <div className="form-group-row">
                            <div className="form-group">
                                <label><MapPin size={14} /> Adresă Completă</label>
                                <input
                                    type="text"
                                    value={muzeu.adresa || ''}
                                    onChange={(e) => setMuzeu({ ...muzeu, adresa: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label><Clock size={14} /> Program (Orar)</label>
                                <input
                                    type="text"
                                    value={muzeu.orar || ''}
                                    onChange={(e) => setMuzeu({ ...muzeu, orar: e.target.value })}
                                    placeholder="Ex: Luni-Vineri 09:00 - 17:00"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label><Globe size={14} /> Site Oficial</label>
                            <input
                                type="url"
                                value={muzeu.siteOficial || ''}
                                onChange={(e) => setMuzeu({ ...muzeu, siteOficial: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label><Info size={14} /> Scurtă Descriere</label>
                            <textarea
                                value={muzeu.scurtaDescriere || ''}
                                onChange={(e) => setMuzeu({ ...muzeu, scurtaDescriere: e.target.value })}
                                rows={5}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button type="submit" disabled={saving} className="museum-btn-save" style={{ marginTop: '0.5rem' }}>
                            <Save size={16} />
                            {saving ? 'Se salvează...' : 'Salvează Modificările'}
                        </button>
                    </form>
                </div>

                {/* 2. Tarife Bilete */}
                <div className="museum-card">
                    <div className="museum-card-header">
                        <h2><Ticket size={20} /> Planuri Tarifare</h2>
                        <button className="museum-header-action-btn primary" onClick={() => handleOpenTicketModal()}>
                            <Plus size={15} /> Adaugă Bilet
                        </button>
                    </div>
                    <div className="museum-card-body">
                        {bilete.length === 0 ? (
                            <p className="museum-empty-state" style={{ padding: '2rem' }}>Niciun bilet configurat momentan.</p>
                        ) : (
                            bilete.map((b) => (
                                <div key={b.codUnicTipBilet} className="ticket-item">
                                    <div className="ticket-info">
                                        <h4>{b.tipBilet}</h4>
                                        <p>{b.pret.toFixed(2)} LEI</p>
                                    </div>
                                    <div className="ticket-actions">
                                        <button onClick={() => handleOpenTicketModal(b)} className="icon-btn-edit" title="Editează">
                                            <Edit2 size={15} />
                                        </button>
                                        <button onClick={() => handleDeleteTicket(b.codUnicTipBilet)} className="icon-btn-delete" title="Șterge">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Bilet */}
            {showTicketModal && (
                <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
                    <div className="modal-box" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTicketId ? 'Editează Bilet' : 'Adaugă Bilet Nou'}</h2>
                            <button className="modal-close" onClick={() => setShowTicketModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTicket} className="form-body">
                            <div className="form-group">
                                <label>Tip Vizitator</label>
                                <select
                                    value={ticketForm.tipBilet}
                                    onChange={(e) => setTicketForm({ ...ticketForm, tipBilet: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Alege o categorie...</option>
                                    <option value="Adult">Adult</option>
                                    <option value="Elev">Elev</option>
                                    <option value="Student">Student</option>
                                    <option value="Pensionar">Pensionar</option>
                                    <option value="Altele">Altele</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Preț (LEI)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={ticketForm.pret}
                                    onChange={(e) => setTicketForm({ ...ticketForm, pret: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowTicketModal(false)}>
                                    Anulează
                                </button>
                                <button type="submit" className="museum-btn-save">
                                    Salvează
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
