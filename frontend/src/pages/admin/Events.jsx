import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, Plus, Calendar, Edit, Trash2, AlertCircle,
    CalendarCheck, Tag, MapPin, X, Save, Gift
} from 'lucide-react';
import './Events.css';
import './admin-shared.css';

const API = 'http://localhost:5000';

const EVENT_TYPES = ['General', 'Expozitie', 'Noaptea Muzeelor', 'Workshop'];

const EMPTY_FORM = {
    titlu: '',
    descriere: '',
    dataStart: '',
    dataSfarsit: '',
    tipEveniment: 'General',
    codUnicLocatie: '',
    imagineUrl: '',
    isGratuit: false,
    intervaleOrare: [],
};

function toInputDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    // format YYYY-MM-DDTHH:MM for datetime-local
    return d.toISOString().slice(0, 16);
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterGratuit, setFilterGratuit] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [newIntervalStart, setNewIntervalStart] = useState('');
    const [newIntervalEnd, setNewIntervalEnd] = useState('');

    useEffect(() => { fetchEvents(); fetchLocations(); }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/events`, { withCredentials: true });
            if (res.data.success) setEvents(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`${API}/api/locations`, { withCredentials: true });
            if (res.data.success) setLocations(res.data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const openAdd = () => {
        setEditingEvent(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setNewIntervalStart('');
        setNewIntervalEnd('');
        setShowModal(true);
    };

    const openEdit = (ev) => {
        setEditingEvent(ev);
        setForm({
            titlu: ev.titlu || '',
            descriere: ev.descriere || '',
            dataStart: toInputDate(ev.dataStart),
            dataSfarsit: toInputDate(ev.dataSfarsit),
            tipEveniment: ev.tipEveniment || 'General',
            codUnicLocatie: ev.codUnicLocatie || '',
            imagineUrl: ev.imagineUrl || '',
            isGratuit: !!ev.isGratuit,
            intervaleOrare: ev.intervaleOrare || [],
        });
        setFormError('');
        setNewIntervalStart('');
        setNewIntervalEnd('');
        setShowModal(true);
    };

    const handleAddInterval = () => {
        if (!newIntervalStart || !newIntervalEnd) return;
        if (newIntervalStart >= newIntervalEnd) {
            setFormError('Ora de început trebuie să fie mai mică decât ora de sfârșit.');
            return;
        }

        const intervalString = `${newIntervalStart} - ${newIntervalEnd}`;

        if ((form.intervaleOrare || []).includes(intervalString)) {
            setFormError('Acest interval a fost deja adăugat.');
            return;
        }

        setFormError('');
        setForm({
            ...form,
            intervaleOrare: [...(form.intervaleOrare || []), intervalString]
        });
        setNewIntervalStart('');
        setNewIntervalEnd('');
    };

    const handleRemoveInterval = (index) => {
        const updated = [...(form.intervaleOrare || [])];
        updated.splice(index, 1);
        setForm({ ...form, intervaleOrare: updated });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        // Asigurăm obligativitatea intervalelor
        if (!form.intervaleOrare || form.intervaleOrare.length === 0) {
            setFormError('Te rugăm să adaugi cel puțin un interval orar folosind selectorul de mai jos!');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                ...form,
                dataStart: form.dataStart ? new Date(form.dataStart).toISOString() : undefined,
                dataSfarsit: form.dataSfarsit ? new Date(form.dataSfarsit).toISOString() : null,
                isGratuit: form.isGratuit ? 1 : 0,
                codUnicLocatie: form.codUnicLocatie || null,
            };
            if (editingEvent) {
                await axios.put(`${API}/api/events/${editingEvent.id}`, payload, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/events`, payload, { withCredentials: true });
            }
            setShowModal(false);
            fetchEvents();
        } catch (err) {
            setFormError(err.response?.data?.error || 'A apărut o eroare. Încearcă din nou.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi acest eveniment?')) return;
        try {
            await axios.delete(`${API}/api/events/${id}`, { withCredentials: true });
            fetchEvents();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    const filtered = events.filter(ev => {
        const matchSearch = !searchTerm || ev.titlu?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = !filterType || ev.tipEveniment === filterType;
        const matchGratuit = filterGratuit === '' ? true :
            filterGratuit === 'gratuit' ? !!ev.isGratuit : !ev.isGratuit;
        return matchSearch && matchType && matchGratuit;
    });

    const formatDate = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="events-admin-page">
            <div className="page-header">
                <h1>Evenimente</h1>
                <button className="btn-primary icon-btn" onClick={openAdd}>
                    <Plus size={18} /> Adaugă Eveniment
                </button>
            </div>

            <div className="filters">
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Caută după titlu..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <Tag className="filter-icon" size={18} />
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
                        <option value="">Toate tipurile</option>
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <Gift className="filter-icon" size={18} />
                    <select value={filterGratuit} onChange={e => setFilterGratuit(e.target.value)} className="filter-select">
                        <option value="">Toate</option>
                        <option value="gratuit">Gratuite</option>
                        <option value="platit">Cu plată</option>
                    </select>
                </div>
            </div>

            {loading && <div className="loading">Se încarcă...</div>}

            <div className="events-grid">
                {filtered.map(ev => (
                    <div key={ev.id} className="event-card">
                        <div className="event-card-image">
                            {ev.imagineUrl
                                ? <img src={`${API}${ev.imagineUrl}`} alt={ev.titlu} />
                                : <div className="img-placeholder"><Calendar size={36} /></div>
                            }
                            <span className={`ev-type-badge ev-type-${ev.tipEveniment?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {ev.tipEveniment}
                            </span>
                            {ev.isGratuit && <span className="ev-free-badge">Gratuit</span>}
                        </div>
                        <div className="event-card-body">
                            <h3>{ev.titlu}</h3>
                            {ev.numeLocatie && (
                                <p className="ev-location"><MapPin size={14} /> {ev.numeLocatie}</p>
                            )}
                            <div className="ev-dates">
                                <CalendarCheck size={14} />
                                <span>{formatDate(ev.dataStart)}</span>
                                {ev.dataSfarsit && <> — <span>{formatDate(ev.dataSfarsit)}</span></>}
                            </div>
                            {ev.descriere && <p className="ev-desc">{ev.descriere.slice(0, 100)}{ev.descriere.length > 100 ? '...' : ''}</p>}
                        </div>
                        <div className="event-card-footer">
                            <div className="footer-left">
                                <button className="btn-secondary icon-btn" onClick={() => openEdit(ev)}>
                                    <Edit size={15} /> Editează
                                </button>
                            </div>
                            <div className="footer-right">
                                <button className="btn-danger icon-btn" onClick={() => handleDelete(ev.id)}>
                                    <Trash2 size={15} /> Șterge
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && filtered.length === 0 && (
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <p>Niciun eveniment găsit.</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="event-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingEvent ? 'Editează Eveniment' : 'Adaugă Eveniment'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="event-form">
                            <div className="form-group">
                                <label>Titlu *</label>
                                <input
                                    type="text" required placeholder="Ex: Noaptea Galactic..."
                                    value={form.titlu}
                                    onChange={e => setForm({ ...form, titlu: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tip Eveniment</label>
                                    <select value={form.tipEveniment} onChange={e => setForm({ ...form, tipEveniment: e.target.value })}>
                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Locație</label>
                                    <select value={form.codUnicLocatie} onChange={e => setForm({ ...form, codUnicLocatie: e.target.value })}>
                                        <option value="">Fără locație</option>
                                        {locations.map(l => (
                                            <option key={l.codUnicLocatie} value={l.codUnicLocatie}>{l.numeLoc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Data Început *</label>
                                    <input
                                        type="datetime-local" required
                                        value={form.dataStart}
                                        onChange={e => setForm({ ...form, dataStart: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Data Sfârșit</label>
                                    <input
                                        type="datetime-local"
                                        value={form.dataSfarsit}
                                        onChange={e => setForm({ ...form, dataSfarsit: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Descriere</label>
                                <textarea
                                    rows={3} placeholder="Descrie evenimentul..."
                                    value={form.descriere}
                                    onChange={e => setForm({ ...form, descriere: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Intervale Orare Predefinite</label>
                                <div className="intervals-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {(form.intervaleOrare || []).map((intv, idx) => (
                                        <div key={idx} className="interval-tag" style={{ background: 'var(--color-primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            {intv}
                                            <button type="button" onClick={() => handleRemoveInterval(idx)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="interval-input-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="time"
                                        value={newIntervalStart}
                                        onChange={e => setNewIntervalStart(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <span>–</span>
                                    <input
                                        type="time"
                                        value={newIntervalEnd}
                                        onChange={e => setNewIntervalEnd(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" className="btn-secondary" onClick={handleAddInterval}>Adaugă</button>
                                </div>
                                <small style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', fontWeight: 'bold' }}>Adăugarea a cel puțin un interval este obligatorie.</small>
                            </div>
                            <div className="form-group">
                                <label>URL Imagine</label>
                                <input
                                    type="text" placeholder="/uploads/imagine.jpg"
                                    value={form.imagineUrl}
                                    onChange={e => setForm({ ...form, imagineUrl: e.target.value })}
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={form.isGratuit}
                                        onChange={e => setForm({ ...form, isGratuit: e.target.checked })}
                                    />
                                    <span>Eveniment gratuit (cu rezervare)</span>
                                </label>
                            </div>
                            {formError && <div className="form-error">{formError}</div>}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Anulează</button>
                                <button type="submit" className="btn-primary icon-btn" disabled={saving}>
                                    <Save size={16} /> {saving ? 'Se salvează...' : 'Salvează'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
