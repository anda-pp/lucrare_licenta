import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus, Calendar, Edit, Trash2, AlertCircle,
    CalendarCheck, Tag, MapPin, Gift
} from 'lucide-react';
import FormModal from '../../components/common/FormModal';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TimeIntervalsInput from '../../components/common/TimeIntervalsInput';
import './Events.css';
import './admin-shared.css';

const API = 'http://localhost:5000';
const EVENT_TYPES = ['General', 'Expozitie', 'Noaptea Muzeelor', 'Workshop'];

// Formularul gol — folosit la resetare pentru adăugare de eveniment nou
const EMPTY_FORM = {
    titlu: '', descriere: '', dataStart: '', dataSfarsit: '',
    tipEveniment: 'General', codUnicLocatie: '', imagineUrl: '',
    isGratuit: false, intervaleOrare: [],
};

// Convertim timestamp ISO la formatul cerut de input type="datetime-local"
function toInputDate(ts) {
    if (!ts) return '';
    return new Date(ts).toISOString().slice(0, 16);
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
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => { fetchEvents(); fetchLocations(); }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/events`, { withCredentials: true });
            if (res.data.success) setEvents(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`${API}/api/locations`, { withCredentials: true });
            if (res.data.success) setLocations(res.data.data);
        } catch (e) { console.error(e); }
    };

    const openAdd = () => {
        setEditingEvent(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (ev) => {
        setEditingEvent(ev);
        setForm({
            titlu: ev.titlu || '', descriere: ev.descriere || '',
            dataStart: toInputDate(ev.dataStart), dataSfarsit: toInputDate(ev.dataSfarsit),
            tipEveniment: ev.tipEveniment || 'General',
            codUnicLocatie: ev.codUnicLocatie || '', imagineUrl: ev.imagineUrl || '',
            isGratuit: !!ev.isGratuit, intervaleOrare: ev.intervaleOrare || [],
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        // Intervalele orare sunt obligatorii — fără ele nu putem face rezervări
        if (!form.intervaleOrare || form.intervaleOrare.length === 0) {
            setFormError('Te rugăm să adaugi cel puțin un interval orar!');
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
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirmId) return;
        try {
            await axios.delete(`${API}/api/events/${confirmId}`, { withCredentials: true });
            fetchEvents();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        } finally { setConfirmId(null); }
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

            <SearchFilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Caută după titlu..."
                filters={[
                    {
                        icon: Tag, value: filterType, onChange: setFilterType,
                        placeholder: 'Toate tipurile',
                        options: EVENT_TYPES.map(t => ({ value: t, label: t })),
                    },
                    {
                        icon: Gift, value: filterGratuit, onChange: setFilterGratuit,
                        placeholder: 'Toate',
                        options: [
                            { value: 'gratuit', label: 'Gratuite' },
                            { value: 'platit', label: 'Cu plată' },
                        ],
                    },
                ]}
            />

            {loading && <div className="loading">Se încarcă...</div>}

            <div className="events-grid">
                {filtered.map(ev => (
                    <div key={ev.id} className="event-card">
                        <div className="event-card-image">
                            {ev.imagineUrl
                                ? <img src={`${API}${ev.imagineUrl}`} alt={ev.titlu} />
                                : <div className="img-placeholder"><Calendar size={36} /></div>}
                            <span className={`ev-type-badge ev-type-${ev.tipEveniment?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {ev.tipEveniment}
                            </span>
                            {ev.isGratuit && <span className="ev-free-badge">Gratuit</span>}
                        </div>
                        <div className="event-card-body">
                            <h3>{ev.titlu}</h3>
                            {ev.numeLocatie && <p className="ev-location"><MapPin size={14} /> {ev.numeLocatie}</p>}
                            <div className="ev-dates">
                                <CalendarCheck size={14} />
                                <span>{formatDate(ev.dataStart)}</span>
                                {ev.dataSfarsit && <> — <span>{formatDate(ev.dataSfarsit)}</span></>}
                            </div>
                            {/* Descrierea e trunchiată la 100 de caractere în card */}
                            {ev.descriere && <p className="ev-desc">{ev.descriere.slice(0, 100)}{ev.descriere.length > 100 ? '...' : ''}</p>}
                        </div>
                        <div className="event-card-footer">
                            <div className="footer-left">
                                <button className="btn-secondary icon-btn" onClick={() => openEdit(ev)}>
                                    <Edit size={15} /> Editează
                                </button>
                            </div>
                            <div className="footer-right">
                                <button className="btn-danger icon-btn" onClick={() => setConfirmId(ev.id)}>
                                    <Trash2 size={15} /> Șterge
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && filtered.length === 0 && (
                <EmptyState icon={AlertCircle} title="Niciun eveniment găsit." />
            )}

            <FormModal
                show={showModal}
                title={editingEvent ? 'Editează Eveniment' : 'Adaugă Eveniment'}
                onClose={() => setShowModal(false)}
                onSubmit={handleSave}
                saving={saving}
                error={formError}
                wide
            >
                <div className="form-group">
                    <label>Titlu *</label>
                    <input type="text" required placeholder="Ex: Noaptea Galactic..."
                        value={form.titlu} onChange={e => setForm({ ...form, titlu: e.target.value })} />
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
                            {locations.map(l => <option key={l.codUnicLocatie} value={l.codUnicLocatie}>{l.numeLoc}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Data Început *</label>
                        <input type="datetime-local" required value={form.dataStart}
                            onChange={e => setForm({ ...form, dataStart: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Data Sfârșit</label>
                        <input type="datetime-local" value={form.dataSfarsit}
                            onChange={e => setForm({ ...form, dataSfarsit: e.target.value })} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Descriere</label>
                    <textarea rows={3} placeholder="Descrie evenimentul..."
                        value={form.descriere} onChange={e => setForm({ ...form, descriere: e.target.value })} />
                </div>

                {/* Componenta pentru intervalele orare — afișare dinamică cu adăugare/ștergere */}
                <TimeIntervalsInput
                    intervals={form.intervaleOrare || []}
                    onChange={intervaleOrare => setForm(prev => ({ ...prev, intervaleOrare }))}
                    onError={setFormError}
                    required
                />

                <div className="form-group">
                    <label>URL Imagine</label>
                    <input type="text" placeholder="/uploads/imagine.jpg"
                        value={form.imagineUrl} onChange={e => setForm({ ...form, imagineUrl: e.target.value })} />
                </div>
                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={form.isGratuit}
                            onChange={e => setForm({ ...form, isGratuit: e.target.checked })} />
                        <span>Eveniment gratuit (cu rezervare)</span>
                    </label>
                </div>
            </FormModal>

            {/* Dialog de confirmare ștergere — separat pentru a evita ștergerea accidentală */}
            <ConfirmDialog
                show={!!confirmId}
                title="Șterge Eveniment"
                message="Sigur vrei să ștergi acest eveniment?"
                onConfirm={handleDelete}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
}
