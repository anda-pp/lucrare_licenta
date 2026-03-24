import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, MapPin, CheckCircle, XCircle } from 'lucide-react';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

export default function TrailsAdmin() {
    const [trails, setTrails] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        titlu: '',
        descriere: '',
        durataEstimata: 120, // mins
        oras: '',
        imagineUrl: '',
        activ: true,
        locatiiValide: [] // array of codUnicLocatie
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch trails
            const trRes = await axios.get(`${API}/api/trails`, { withCredentials: true });
            if (trRes.data.success) {
                setTrails(trRes.data.data);
            }
            // Fetch all locations to populate the dropdown/list
            const locRes = await axios.get(`${API}/api/locations`, { withCredentials: true });
            if (locRes.data.success) {
                setLocations(locRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching trails init data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (trail = null) => {
        if (trail) {
            setEditingId(trail.id);
            setFormData({
                titlu: trail.titlu || '',
                descriere: trail.descriere || '',
                durataEstimata: trail.durataEstimata || 120,
                oras: trail.oras || '',
                imagineUrl: trail.imagineUrl || '',
                activ: trail.activ === 1 || trail.activ === true,
                locatiiValide: trail.locatii ? trail.locatii.map(l => l.codUnicLocatie) : []
            });
        } else {
            setEditingId(null);
            setFormData({
                titlu: '',
                descriere: '',
                durataEstimata: 120,
                oras: '',
                imagineUrl: '',
                activ: true,
                locatiiValide: []
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API}/api/trails/admin/${editingId}`, formData, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/trails/admin`, formData, { withCredentials: true });
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Eroare la salvarea traseului.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Ești sigur că vrei să ștergi acest traseu cultural?')) return;
        try {
            await axios.delete(`${API}/api/trails/admin/${id}`, { withCredentials: true });
            fetchData();
        } catch (err) {
            alert('Eroare la ștergerea traseului.');
        }
    };

    // Helper pt formular - adaugare locatie la traseu
    const addLocationToTrail = (codUnic) => {
        if (!codUnic || formData.locatiiValide.includes(codUnic)) return;
        setFormData(prev => ({
            ...prev,
            locatiiValide: [...prev.locatiiValide, codUnic]
        }));
    };

    // Helper pt formular - stergere locatie din traseu
    const removeLocationFromTrail = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            locatiiValide: prev.locatiiValide.filter((_, i) => i !== indexToRemove)
        }));
    };

    if (loading) return <div className="admin-loading">Se încarcă traseele...</div>;

    return (
        <div className="admin-page rewards-admin">
            <header className="admin-page-header">
                <div>
                    <h1>Trasee Culturale Personalizate</h1>
                    <p>Creează pachete și tururi personalizate grupând locațiile existente.</p>
                </div>
                <button className="btn-primary icon-btn" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Adaugă Traseu
                </button>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Cover / Titlu</th>
                            <th>Ore / Oraș</th>
                            <th>Muzee Incluse</th>
                            <th>Status</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trails.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Nu există trasee configurate.</td></tr>
                        ) : trails.map(t => (
                            <tr key={t.id} className={!t.activ ? 'row-inactive' : ''}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 8,
                                            background: t.imagineUrl ? `url(${t.imagineUrl}) center/cover` : '#e2e8f0'
                                        }} />
                                        <div>
                                            <strong>{t.titlu}</strong>
                                            <div className="text-muted text-sm" style={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descriere}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div><span className="badge-points">{Math.floor(t.durataEstimata / 60)}h {t.durataEstimata % 60}m</span></div>
                                    <div className="text-sm code mt-1" style={{ marginTop: '0.25rem' }}>{t.oras}</div>
                                </td>
                                <td>
                                    <strong>{t.locatii?.length || 0}</strong> locații
                                </td>
                                <td>
                                    {t.activ ? (
                                        <span className="status-badge success"><CheckCircle size={14} /> Activ</span>
                                    ) : (
                                        <span className="status-badge error"><XCircle size={14} /> Ascuns</span>
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon edit" onClick={() => handleOpenModal(t)} title="Editează">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(t.id)} title="Șterge">
                                            <Trash2 size={16} />
                                        </button>
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
                    <div className="modal-content" style={{ maxWidth: 700 }}>
                        <h2>{editingId ? 'Editează Traseu Cultural' : 'Creează Traseu Cultural'}</h2>
                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-row">
                                <div className="form-group flex-1" style={{ flex: 2 }}>
                                    <label>Titlu Traseu *</label>
                                    <input required type="text" value={formData.titlu} onChange={e => setFormData({ ...formData, titlu: e.target.value })} placeholder="ex: Weekend la Castele" />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Oraș (sau Regiune) *</label>
                                    <input required type="text" value={formData.oras} onChange={e => setFormData({ ...formData, oras: e.target.value })} placeholder="ex: Brașov" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Scurtă Descriere (Povestea Traseului)</label>
                                <textarea value={formData.descriere} onChange={e => setFormData({ ...formData, descriere: e.target.value })} rows="2"></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Timp Estimat (minute pt. tot traseul) *</label>
                                    <input required type="number" min="1" value={formData.durataEstimata} onChange={e => setFormData({ ...formData, durataEstimata: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group flex-1">
                                    <label>URL Imagine Cover</label>
                                    <input type="url" value={formData.imagineUrl} onChange={e => setFormData({ ...formData, imagineUrl: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                    Locații Incluse (în ordine de parcurgere)
                                </label>

                                {/* Afisare locatii alese */}
                                {formData.locatiiValide.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {formData.locatiiValide.map((cod, idx) => {
                                            const locFull = locations.find(l => l.codUnicLocatie === cod);
                                            return (
                                                <li key={`${cod}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--color-input-bg)', borderRadius: 6 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <strong style={{ color: 'var(--color-primary)' }}>{idx + 1}.</strong>
                                                        <span>{locFull ? locFull.numeLoc : cod}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeLocationFromTrail(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}>X</button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="text-muted text-sm" style={{ margin: '1rem 0' }}>Nicio locație adăugată încă.</div>
                                )}

                                {/* Selector adaugare locatie noua */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        style={{ flex: 1 }}
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addLocationToTrail(e.target.value);
                                                e.target.value = ""; // reset dupa selectie
                                            }
                                        }}
                                    >
                                        <option value="" disabled>-- Selectează un muzeu / locație --</option>
                                        {locations.map(loc => (
                                            <option key={loc.codUnicLocatie} value={loc.codUnicLocatie}>
                                                {loc.numeLoc} ({loc.orasLoc})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-checkbox">
                                <label>
                                    <input type="checkbox" checked={formData.activ} onChange={e => setFormData({ ...formData, activ: e.target.checked })} />
                                    <span>Traseul este Vizibil & Activ publicului</span>
                                </label>
                            </div>

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
