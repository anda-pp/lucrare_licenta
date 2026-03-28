import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import TimeIntervalsInput from '../../components/common/TimeIntervalsInput';
import EventTicketsInput from '../../components/common/EventTicketsInput';
import '../admin/Dashboard.css';
import './MyMuseum.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EMPTY_FORM = {
    titlu: '', descriere: '', dataStart: '', dataSfarsit: '',
    tipEveniment: 'General', isGratuit: false, intervaleOrare: [],
};

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [bilete, setBilete] = useState([]);

    // Confirm dialog
    const [confirmId, setConfirmId] = useState(null);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/museum-admin/events`, { withCredentials: true });
            if (res.data.success) setEvents(res.data.data);
        } catch (error) {
            const msg = error.response?.data?.error || 'Eroare la încărcarea evenimentelor.';
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const openModal = (ev = null) => {
        setErrorMsg('');
        if (ev) {
            setIsEditing(true);
            setEditingId(ev.id);
            let intervale = [];
            try { intervale = ev.intervaleOrare ? JSON.parse(ev.intervaleOrare) : []; } catch { intervale = []; }
            setFormData({
                titlu: ev.titlu || '', descriere: ev.descriere || '',
                dataStart: ev.dataStart ? new Date(ev.dataStart).toISOString().slice(0, 16) : '',
                dataSfarsit: ev.dataSfarsit ? new Date(ev.dataSfarsit).toISOString().slice(0, 16) : '',
                tipEveniment: ev.tipEveniment || 'General',
                isGratuit: ev.isGratuit === 1 || ev.isGratuit === true,
                intervaleOrare: intervale,
            });
            setBilete(ev.ticketTypes ? ev.ticketTypes.map(t => ({ tip: t.tip, pret: t.pret })) : []);
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData(EMPTY_FORM);
            setBilete([]);
        }
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmId) return;
        try {
            const res = await axios.delete(`${API}/api/museum-admin/events/${confirmId}`, { withCredentials: true });
            if (res.data.success) fetchEvents();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        } finally {
            setConfirmId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);

        if (!formData.isGratuit) {
            const invalidTicket = bilete.some(b => !b.tip || b.pret === '' || isNaN(parseFloat(b.pret)) || parseFloat(b.pret) < 0);
            if (invalidTicket) {
                setErrorMsg('Verifică că toate biletele au un tip și un preț valid.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                isGratuit: formData.isGratuit ? 1 : 0,
                intervaleOrare: formData.isGratuit ? formData.intervaleOrare : [],
                bilete: formData.isGratuit ? [] : bilete.map(b => ({ tip: b.tip, pret: parseFloat(b.pret) })),
            };
            if (isEditing) {
                await axios.put(`${API}/api/museum-admin/events/${editingId}`, payload, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/museum-admin/events`, payload, { withCredentials: true });
            }
            setIsModalOpen(false);
            fetchEvents();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'A apărut o eroare la salvarea evenimentului.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEvents = events.filter(ev =>
        (ev.titlu || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-page relative">
            <div className="page-header museum-page-header">
                <div>
                    <h1 className="page-title">Management Evenimente</h1>
                    <p className="subtitle">Gestionează atelierele și expozițiile locației tale curente.</p>
                </div>
                <button className="museum-header-action-btn primary" onClick={() => openModal()}>
                    <Plus size={18} /> Adaugă Eveniment
                </button>
            </div>

            <div className="museum-card">
                <div className="museum-card-header museum-search-header">
                    <div className="museum-search-bar">
                        <Search size={16} className="search-icon-muted" />
                        <input
                            type="text"
                            placeholder="Caută eveniment..."
                            className="museum-search-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container museum-table-container">
                    <table className="activity-table museum-activity-table">
                        <thead>
                            <tr>
                                <th>Nume Eveniment</th>
                                <th>Dată & Ora</th>
                                <th>Tip Eveniment</th>
                                <th>Stare (Cost)</th>
                                <th className="text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="museum-empty-state">Se încarcă evenimentele...</td></tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">
                                        <CalendarDays size={40} className="museum-empty-icon" />
                                        {errorMsg || (searchTerm ? 'Niciun eveniment nu corespunde căutării.' : 'Nu există evenimente adăugate încă.')}
                                    </td>
                                </tr>
                            ) : filteredEvents.map(ev => (
                                <tr key={ev.id}>
                                    <td><div className="ev-title">{ev.titlu}</div></td>
                                    <td>
                                        <div className="ev-date-primary">
                                            {new Date(ev.dataStart).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                        {ev.dataSfarsit && (
                                            <div className="ev-date-secondary">
                                                Până: {new Date(ev.dataSfarsit).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        )}
                                    </td>
                                    <td>{ev.tipEveniment || 'General'}</td>
                                    <td>
                                        <span className={ev.isGratuit ? 'ev-badge ev-badge--free' : 'ev-badge ev-badge--paid'}>
                                            {ev.isGratuit ? 'Gratuit' : 'Cu bilet'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="ev-actions">
                                            <button className="icon-btn-edit" onClick={() => openModal(ev)} title="Editează"><Edit2 size={16} /></button>
                                            <button className="icon-btn-delete" onClick={() => setConfirmId(ev.id)} title="Șterge"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Modal */}
            <FormModal
                show={isModalOpen}
                title={isEditing ? 'Editează Evenimentul' : 'Adaugă Eveniment Nou'}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                saving={isSubmitting}
                error={errorMsg}
                submitLabel="Salvează Eveniment"
            >
                <div className="form-group">
                    <label>Titlu Eveniment *</label>
                    <input type="text" required value={formData.titlu}
                        onChange={e => setFormData({ ...formData, titlu: e.target.value })}
                        placeholder="Ex: Noaptea Muzeelor" />
                </div>

                <div className="form-group">
                    <label>Descriere</label>
                    <textarea rows={3} value={formData.descriere}
                        onChange={e => setFormData({ ...formData, descriere: e.target.value })}
                        placeholder="Detalii despre eveniment..." />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Dată / Oră Începere *</label>
                        <input type="datetime-local" required value={formData.dataStart}
                            onChange={e => setFormData({ ...formData, dataStart: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Dată / Oră Finalizare</label>
                        <input type="datetime-local" value={formData.dataSfarsit}
                            onChange={e => setFormData({ ...formData, dataSfarsit: e.target.value })} />
                    </div>
                </div>

                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group">
                        <label>Tip Eveniment</label>
                        <select value={formData.tipEveniment}
                            onChange={e => setFormData({ ...formData, tipEveniment: e.target.value })}>
                            <option value="General">General</option>
                            <option value="Expozitie">Expoziție Temporală</option>
                            <option value="Noaptea Muzeelor">Noaptea Muzeelor</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Concert">Concert / Performance</option>
                        </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '0.5rem' }}>
                        <input type="checkbox" checked={formData.isGratuit}
                            onChange={e => setFormData({ ...formData, isGratuit: e.target.checked })}
                            style={{ width: '18px', height: '18px' }} />
                        <span style={{ fontWeight: 600 }}>Intrare Gratuită</span>
                    </label>
                </div>

                {formData.isGratuit && (
                    <TimeIntervalsInput
                        intervals={formData.intervaleOrare}
                        onChange={intervaleOrare => setFormData(prev => ({ ...prev, intervaleOrare }))}
                        onError={setErrorMsg}
                    />
                )}

                {!formData.isGratuit && (
                    <EventTicketsInput
                        tickets={bilete}
                        onChange={setBilete}
                    />
                )}
            </FormModal>

            {/* Confirm Delete */}
            <ConfirmDialog
                show={!!confirmId}
                title="Șterge Eveniment"
                message="Ești sigur că vrei să ștergi acest eveniment? Această acțiune este ireversibilă."
                onConfirm={handleDelete}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
}
