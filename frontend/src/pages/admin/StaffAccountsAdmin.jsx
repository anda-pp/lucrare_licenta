import { useState, useEffect } from 'react';
import { Plus, Search, Building, Trash2, Mail, Phone, Users, Edit } from 'lucide-react';
import axios from 'axios';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './admin-shared.css';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

const EMPTY_FORM = { nume: '', prenume: '', email: '', password: '', telefon: '', rol: 'Admin', muzeuId: '' };

export default function StaffAccountsAdmin() {
    const [staff, setStaff] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [confirmTarget, setConfirmTarget] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, locationsRes] = await Promise.all([
                axios.get(`${API}/api/users/superadmin/staff`, { withCredentials: true }),
                axios.get(`${API}/api/locations`, { withCredentials: true })
            ]);
            if (staffRes.data.success) setStaff(staffRes.data.staff);
            if (locationsRes.data.success) {
                setLocations(locationsRes.data.data.filter(l => l.statusLocatie === 'Activ'));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (staffMember = null) => {
        if (staffMember) {
            setEditingId(staffMember.codUnicUtilizator);
            setFormData({
                nume: staffMember.numeUtil, prenume: staffMember.prenumeUtil,
                email: staffMember.emailUtil, password: '',
                telefon: staffMember.telefonUtil || '', rol: staffMember.rolUtil,
                muzeuId: staffMember.muzeuId || ''
            });
        } else {
            setEditingId(null);
            setFormData(EMPTY_FORM);
        }
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (editingId) {
                const res = await axios.put(`${API}/api/users/superadmin/staff/${editingId}`, formData, { withCredentials: true });
                if (res.data.success) { fetchData(); setShowModal(false); }
            } else {
                const res = await axios.post(`${API}/api/users/superadmin/staff`, formData, { withCredentials: true });
                if (res.data.success) { fetchData(); setShowModal(false); }
            }
        } catch (error) {
            setFormError(error.response?.data?.error || 'A apărut o eroare la crearea contului.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmTarget) return;
        try {
            const res = await axios.delete(`${API}/api/users/superadmin/staff/${confirmTarget}`, { withCredentials: true });
            if (res.data.success) fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'A apărut o eroare la ștergerea contului.');
        } finally {
            setConfirmTarget(null);
        }
    };

    const filteredStaff = staff.filter(s =>
        s.numeUtil.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.prenumeUtil.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.emailUtil.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLocationName = (id) => {
        if (!id) return '- Universal (Neatribuit) -';
        const loc = locations.find(l => l.codUnicLocatie === id);
        return loc ? loc.numeLoc : 'Locație Ștearsă';
    };

    const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    if (loading) return <div className="loading">Se încarcă...</div>;

    return (
        <div className="admin-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="admin-header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={28} className="text-primary" />
                    <h1 style={{ margin: 0 }}>Gestiune Conturi Staff & Admini Muzee</h1>
                </div>
                <button className="btn-primary icon-btn" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Adaugă Cont
                </button>
            </div>

            <div className="admin-filters" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', width: '300px' }}>
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Caută după nume sau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-input"
                    />
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nume Complet</th>
                            <th>Contact</th>
                            <th>Rol</th>
                            <th>Muzeu Alocat</th>
                            <th>Data Înregistrării</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8">
                                    <p className="text-muted">Nu există conturi de staff adăugate.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((s) => (
                                <tr key={s.codUnicUtilizator}>
                                    <td>
                                        <div className="font-medium">{s.prenumeUtil} {s.numeUtil}</div>
                                        <div className="text-sm text-muted">@{s.usernameUtil}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm flex items-center gap-1"><Mail size={14}/> {s.emailUtil}</div>
                                        {s.telefonUtil && <div className="text-sm text-muted flex items-center gap-1 mt-1"><Phone size={14}/> {s.telefonUtil}</div>}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${s.rolUtil === 'Admin' ? 'success' : 'info'}`}>
                                            {s.rolUtil === 'Admin' ? 'Admin Muzeu' : 'Personal Staff'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Building size={16} className="text-muted" />
                                            {getLocationName(s.muzeuId)}
                                        </div>
                                    </td>
                                    <td>{new Date(s.dataInregistrare).toLocaleDateString()}</td>
                                    <td>
                                        <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editează Cont" onClick={() => handleOpenModal(s)} aria-label="Editează">
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn-danger" style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Șterge Cont" onClick={() => setConfirmTarget(s.codUnicUtilizator)} aria-label="Sterge">
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

            <FormModal
                show={showModal}
                title={editingId ? 'Editează Cont Staff/Admin' : 'Creează un cont nou (Staff/Admin)'}
                onClose={() => setShowModal(false)}
                onSubmit={handleSave}
                saving={saving}
                error={formError}
                submitLabel={editingId ? 'Salvează' : 'Creează'}
            >
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Nume</label>
                        <input type="text" value={formData.nume} onChange={e => set('nume', e.target.value)} required placeholder="Popescu" />
                    </div>
                    <div className="form-group">
                        <label>Prenume</label>
                        <input type="text" value={formData.prenume} onChange={e => set('prenume', e.target.value)} required placeholder="Ion" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} required placeholder="ion.popescu@muzeuart.ro" />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Parolă {editingId && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'gray' }}>(opțional)</span>}</label>
                        <input type="password" value={formData.password} onChange={e => set('password', e.target.value)} required={!editingId} placeholder={editingId ? "Lasă gol pentru a o păstra..." : "Parolă temporară..."} />
                    </div>
                    <div className="form-group">
                        <label>Telefon (Opțional)</label>
                        <input type="tel" value={formData.telefon} onChange={e => set('telefon', e.target.value)} placeholder="07xx xxx xxx" />
                    </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Rol în Sistem</label>
                        <select value={formData.rol} onChange={e => set('rol', e.target.value)} required>
                            <option value="Admin">Administrator Muzeu</option>
                            <option value="Personal">Personal / Staff</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Muzeu Alocat</label>
                        <select value={formData.muzeuId} onChange={e => set('muzeuId', e.target.value)}>
                            <option value="">- Niciunul (Acces Restrâns) -</option>
                            {locations.map(loc => (
                                <option key={loc.codUnicLocatie} value={loc.codUnicLocatie}>{loc.numeLoc}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FormModal>

            <ConfirmDialog
                show={!!confirmTarget}
                title="Ștergere Cont"
                message="Ești sigur că dorești să ștergi acest cont de Staff/Admin?"
                onConfirm={handleDelete}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
