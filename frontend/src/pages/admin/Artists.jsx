import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, AlertCircle, User, X, Save, Brush } from 'lucide-react';
import './Artists.css';
import './admin-shared.css';

const API = 'http://localhost:5000';

const EMPTY_FORM = { nume: '', biografie: '', interviu: '', linkOpere: '', imagineUrl: '' };

export default function Artists() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingArtist, setEditingArtist] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => { fetchArtists(); }, []);

    const fetchArtists = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/artists`, { withCredentials: true });
            if (res.data.success) setArtists(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openAdd = () => {
        setEditingArtist(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (artist) => {
        setEditingArtist(artist);
        setForm({
            nume: artist.nume || '',
            biografie: artist.biografie || '',
            interviu: artist.interviu || '',
            linkOpere: artist.linkOpere || '',
            imagineUrl: artist.imagineUrl || '',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (editingArtist) {
                await axios.put(`${API}/api/artists/${editingArtist.id}`, form, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/artists`, form, { withCredentials: true });
            }
            setShowModal(false);
            fetchArtists();
        } catch (err) {
            setFormError(err.response?.data?.error || 'A apărut o eroare.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi acest artist?')) return;
        try {
            await axios.delete(`${API}/api/artists/${id}`, { withCredentials: true });
            fetchArtists();
        } catch (err) {
            alert('Eroare: ' + (err.response?.data?.error || err.message));
        }
    };

    const filtered = artists.filter(a =>
        !searchTerm || a.nume?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="artists-admin-page">
            <div className="page-header">
                <h1>Artiști</h1>
                <button className="btn-primary icon-btn" onClick={openAdd}>
                    <Plus size={18} /> Adaugă Artist
                </button>
            </div>

            <div className="filters">
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text" placeholder="Caută după nume..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {loading && <div className="loading">Se încarcă...</div>}

            <div className="artists-grid">
                {filtered.map(artist => (
                    <div key={artist.id} className="artist-card">
                        <div className="artist-avatar">
                            {artist.imagineUrl
                                ? <img src={`${API}${artist.imagineUrl}`} alt={artist.nume} />
                                : <div className="avatar-placeholder"><User size={36} /></div>
                            }
                        </div>
                        <div className="artist-info">
                            <h3>{artist.nume}</h3>
                            {artist.biografie && (
                                <p className="artist-bio">{artist.biografie.slice(0, 120)}{artist.biografie.length > 120 ? '...' : ''}</p>
                            )}
                            <div className="artist-links">
                                {artist.interviu && <a href={artist.interviu} target="_blank" rel="noreferrer">🎥 Interviu</a>}
                                {artist.linkOpere && <a href={artist.linkOpere} target="_blank" rel="noreferrer">🎨 Opere</a>}
                            </div>
                        </div>
                        <div className="artist-actions">
                            <div className="footer-left">
                                <button className="btn-secondary icon-btn" onClick={() => openEdit(artist)}>
                                    <Edit size={15} /> Editează
                                </button>
                            </div>
                            <div className="footer-right">
                                <button className="btn-danger icon-btn" onClick={() => handleDelete(artist.id)}>
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
                    <p>Niciun artist găsit.</p>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="event-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingArtist ? 'Editează Artist' : 'Adaugă Artist'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="event-form">
                            <div className="form-group">
                                <label>Nume *</label>
                                <input type="text" required placeholder="Numele artistului"
                                    value={form.nume} onChange={e => setForm({ ...form, nume: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Biografie</label>
                                <textarea rows={4} placeholder="Scurtă biografie..."
                                    value={form.biografie} onChange={e => setForm({ ...form, biografie: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Link Interviu (YouTube etc.)</label>
                                <input type="text" placeholder="https://youtube.com/..."
                                    value={form.interviu} onChange={e => setForm({ ...form, interviu: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Link Opere</label>
                                <input type="text" placeholder="https://..."
                                    value={form.linkOpere} onChange={e => setForm({ ...form, linkOpere: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>URL Imagine (portret)</label>
                                <input type="text" placeholder="/uploads/artist.jpg"
                                    value={form.imagineUrl} onChange={e => setForm({ ...form, imagineUrl: e.target.value })} />
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
