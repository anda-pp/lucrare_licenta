import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import '../admin/Dashboard.css';
import './MyMuseum.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    
    const TICKET_TYPES = ['Adult', 'Elev', 'Student', 'Pensionar', 'Altele'];

    const [formData, setFormData] = useState({
        titlu: '',
        descriere: '',
        dataStart: '',
        dataSfarsit: '',
        tipEveniment: 'General',
        isGratuit: false,
        intervaleOrare: [],
    });
    const [bilete, setBilete] = useState([]);  // [{tip, pret}]
    const [newIntervalStart, setNewIntervalStart] = useState('');
    const [newIntervalEnd, setNewIntervalEnd] = useState('');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/museum-admin/events`, { withCredentials: true });
            if (res.data.success) {
                setEvents(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const openModal = (ev = null) => {
        setErrorMsg('');
        setNewIntervalStart('');
        setNewIntervalEnd('');
        if (ev) {
            setIsEditing(true);
            setEditingId(ev.id);
            let intervale = [];
            try { intervale = ev.intervaleOrare ? JSON.parse(ev.intervaleOrare) : []; } catch { intervale = []; }
            setFormData({
                titlu: ev.titlu || '',
                descriere: ev.descriere || '',
                dataStart: ev.dataStart ? new Date(ev.dataStart).toISOString().slice(0, 16) : '',
                dataSfarsit: ev.dataSfarsit ? new Date(ev.dataSfarsit).toISOString().slice(0, 16) : '',
                tipEveniment: ev.tipEveniment || 'General',
                isGratuit: ev.isGratuit === 1 || ev.isGratuit === true,
                intervaleOrare: intervale,
            });
            // Incarca biletele din ticketTypes (relational din tipuri_bilete)
            setBilete(ev.ticketTypes ? ev.ticketTypes.map(t => ({ tip: t.tip, pret: t.pret })) : []);
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                titlu: '', descriere: '', dataStart: '', dataSfarsit: '', tipEveniment: 'General', isGratuit: false, intervaleOrare: [],
            });
            setBilete([]);
        }
        setIsModalOpen(true);
    };

    const handleAddInterval = () => {
        if (!newIntervalStart || !newIntervalEnd) return;
        if (newIntervalStart >= newIntervalEnd) {
            setErrorMsg('Ora de început trebuie să fie mai mică decât ora de sfârșit.');
            return;
        }
        const intervalString = `${newIntervalStart} - ${newIntervalEnd}`;
        if (formData.intervaleOrare.includes(intervalString)) {
            setErrorMsg('Acest interval a fost deja adăugat.');
            return;
        }
        setErrorMsg('');
        setFormData(prev => ({ ...prev, intervaleOrare: [...prev.intervaleOrare, intervalString] }));
        setNewIntervalStart('');
        setNewIntervalEnd('');
    };

    const handleRemoveInterval = (idx) => {
        setFormData(prev => ({
            ...prev,
            intervaleOrare: prev.intervaleOrare.filter((_, i) => i !== idx)
        }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest eveniment? Această acțiune este ireversibilă.')) return;
        try {
            const res = await axios.delete(`${API}/api/museum-admin/events/${id}`, { withCredentials: true });
            if (res.data.success) {
                fetchEvents();
            }
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);

        // Validate tickets if event is not free
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
                bilete: formData.isGratuit ? [] : bilete.map(b => ({ tip: b.tip, pret: parseFloat(b.pret) }))
            };
            let res;
            if (isEditing) {
                res = await axios.put(`${API}/api/museum-admin/events/${editingId}`, payload, { withCredentials: true });
            } else {
                res = await axios.post(`${API}/api/museum-admin/events`, payload, { withCredentials: true });
            }
            if (res.data.success) {
                setIsModalOpen(false);
                fetchEvents();
            }
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
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">Se încarcă evenimentele...</td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">
                                        <CalendarDays size={40} className="museum-empty-icon" />
                                        {searchTerm ? 'Niciun eveniment nu corespunde căutării.' : 'Nu există evenimente adăugate încă.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map(ev => (
                                    <tr key={ev.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{ev.titlu}</div>
                                        </td>
                                        <td>
                                            <div style={{ color: '#0ea5e9', fontWeight: 500 }}>
                                                {new Date(ev.dataStart).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                            {ev.dataSfarsit && (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    Până: {new Date(ev.dataSfarsit).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            )}
                                        </td>
                                        <td>{ev.tipEveniment || 'General'}</td>
                                        <td>
                                            <span style={{ 
                                                padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                                background: ev.isGratuit ? '#dcfce7' : '#f1f5f9',
                                                color: ev.isGratuit ? '#166534' : '#64748b'
                                            }}>
                                                {ev.isGratuit ? 'Gratuit' : 'Cu bilet'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="icon-btn edit text-blue-500" onClick={() => openModal(ev)} title="Editează">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn delete text-red-500" onClick={() => handleDelete(ev.id)} title="Șterge">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Event Form Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Editează Evenimentul' : 'Adaugă Eveniment Nou'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="form-body">
                            {errorMsg && (
                                <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                    <AlertCircle size={18} />
                                    {errorMsg}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Titlu Eveniment *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.titlu}
                                        onChange={(e) => setFormData({...formData, titlu: e.target.value})}
                                        placeholder="Ex: Noaptea Muzeelor"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Descriere</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.descriere}
                                        onChange={(e) => setFormData({...formData, descriere: e.target.value})}
                                        placeholder="Detalii despre eveniment..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Dată / Oră Începere *</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            value={formData.dataStart}
                                            onChange={(e) => setFormData({...formData, dataStart: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Dată / Oră Finalizare</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.dataSfarsit}
                                            onChange={(e) => setFormData({...formData, dataSfarsit: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Tip Eveniment</label>
                                        <select 
                                            value={formData.tipEveniment}
                                            onChange={(e) => setFormData({...formData, tipEveniment: e.target.value})}
                                        >
                                            <option value="General">General</option>
                                            <option value="Expozitie">Expoziție Temporală</option>
                                            <option value="Noaptea Muzeelor">Noaptea Muzeelor</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Concert">Concert / Performance</option>
                                        </select>
                                    </div>
                                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '0.5rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.isGratuit}
                                            onChange={(e) => setFormData({...formData, isGratuit: e.target.checked})}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        <span style={{ fontWeight: 600, color: '#334155' }}>Intrare Gratuită</span>
                                    </label>
                                </div>

                                {/* ---- INTERVALE ORARE (doar pentru evenimente gratuite) ---- */}
                                {formData.isGratuit && (
                                    <div className="ma-tickets-section" style={{ marginBottom: '1.5rem' }}>
                                        <div className="event-tickets-header">
                                            <span className="event-tickets-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                Intervale Orare
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Opțional</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <input
                                                type="time"
                                                value={newIntervalStart}
                                                onChange={e => setNewIntervalStart(e.target.value)}
                                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                            />
                                            <span style={{ color: '#64748b', fontWeight: 600 }}>–</span>
                                            <input
                                                type="time"
                                                value={newIntervalEnd}
                                                onChange={e => setNewIntervalEnd(e.target.value)}
                                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                            />
                                            <button type="button" className="event-tickets-add-btn" onClick={handleAddInterval}>
                                                + Adaugă
                                            </button>
                                        </div>
                                        {formData.intervaleOrare.length === 0 ? (
                                            <p className="event-tickets-empty">Niciun interval adăugat încă.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                                                {formData.intervaleOrare.map((intv, idx) => (
                                                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ede9fe', color: '#6d28d9', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 500 }}>
                                                        {intv}
                                                        <button type="button" onClick={() => handleRemoveInterval(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, lineHeight: 1, display: 'flex' }}>
                                                            <X size={13} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ---- TICKET SECTION (only for paid events) ---- */}
                                {!formData.isGratuit && (
                                    <div className="ma-tickets-section">
                                        <div className="event-tickets-header">
                                            <span className="event-tickets-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
                                                Tipuri de Bilete
                                            </span>
                                            <button
                                                type="button"
                                                className="event-tickets-add-btn"
                                                onClick={() => setBilete(prev => [...prev, { tip: TICKET_TYPES[0], pret: '' }])}
                                            >
                                                + Adaugă Bilet
                                            </button>
                                        </div>
                                        {bilete.length === 0 ? (
                                            <p className="event-tickets-empty">Niciun tip de bilet definit. Adaugă cel puțin unul.</p>
                                        ) : (
                                            <div className="event-tickets-list">
                                                {bilete.map((bilet, idx) => (
                                                    <div key={idx} className="event-ticket-row">
                                                        <select
                                                            className="event-ticket-select"
                                                            value={bilet.tip}
                                                            onChange={(e) => {
                                                                const updated = [...bilete];
                                                                updated[idx].tip = e.target.value;
                                                                setBilete(updated);
                                                            }}
                                                        >
                                                            {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <div className="event-ticket-price-wrap">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="Preț (LEI)"
                                                                className="event-ticket-price-input"
                                                                value={bilet.pret}
                                                                onChange={(e) => {
                                                                    const updated = [...bilete];
                                                                    updated[idx].pret = e.target.value;
                                                                    setBilete(updated);
                                                                }}
                                                            />
                                                            <span className="event-ticket-currency">LEI</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="event-ticket-remove-btn"
                                                            onClick={() => setBilete(prev => prev.filter((_, i) => i !== idx))}
                                                            title="Șterge biletul"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                                        Anulează
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Se salvează...' : 'Salvează Eveniment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
