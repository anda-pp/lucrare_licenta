import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Building, Trash2, Mail, Phone, Users, Edit } from 'lucide-react';
import axios from 'axios';
import './admin-shared.css';
import './GamificationAdmin.css';

const API = 'http://localhost:5000';

export default function StaffAccountsAdmin() {
    const [staff, setStaff] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        nume: '',
        prenume: '',
        email: '',
        password: '',
        telefon: '',
        rol: 'Admin',
        muzeuId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, locationsRes] = await Promise.all([
                axios.get(`${API}/api/users/superadmin/staff`, { withCredentials: true }),
                axios.get(`${API}/api/locations`, { withCredentials: true })
            ]);
            if (staffRes.data.success) setStaff(staffRes.data.staff);
            if (locationsRes.data.success) {
                // Filter only explicit museums/galleries (Active)
                const activeLocations = locationsRes.data.data.filter(l => l.statusLocatie === 'Activ');
                setLocations(activeLocations);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setIsEditMode(false);
        setEditingUserId(null);
        setFormData({
            nume: '',
            prenume: '',
            email: '',
            password: '',
            telefon: '',
            rol: 'Admin',
            muzeuId: ''
        });
        setErrorMsg('');
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setEditingUserId(null);
    };

    const handleEditClick = (staffMember) => {
        setIsEditMode(true);
        setEditingUserId(staffMember.codUnicUtilizator);
        setFormData({
            nume: staffMember.numeUtil,
            prenume: staffMember.prenumeUtil,
            email: staffMember.emailUtil,
            password: '', // Blank unless they want to change it
            telefon: staffMember.telefonUtil || '',
            rol: staffMember.rolUtil,
            muzeuId: staffMember.muzeuId || ''
        });
        setErrorMsg('');
        setIsAddModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);

        try {
            if (isEditMode) {
                const res = await axios.put(`${API}/api/users/superadmin/staff/${editingUserId}`, formData, { withCredentials: true });
                if (res.data.success) {
                    fetchData();
                    handleCloseModal();
                }
            } else {
                const res = await axios.post(`${API}/api/users/superadmin/staff`, formData, { withCredentials: true });
                if (res.data.success) {
                    fetchData();
                    handleCloseModal();
                }
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.error || 'A apărut o eroare la crearea contului.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ești sigur că dorești să ștergi acest cont de Staff/Admin?')) return;
        
        try {
            const res = await axios.delete(`${API}/api/users/superadmin/staff/${id}`, { withCredentials: true });
            if (res.data.success) {
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'A apărut o eroare la ștergerea contului.');
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

    if (loading) return <div className="loading">Se încarcă...</div>;

    return (
        <div className="admin-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="admin-header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={28} className="text-primary" />
                    <h1 style={{ margin: 0 }}>Gestiune Conturi Staff & Admini Muzee</h1>
                </div>
                <button className="btn-primary icon-btn" onClick={handleAddClick}>
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
                                            <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editează Cont" onClick={() => handleEditClick(s)} aria-label="Editează">
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn-danger" style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Șterge Cont" onClick={() => handleDelete(s.codUnicUtilizator)} aria-label="Sterge">
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

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{isEditMode ? 'Editează Cont Staff/Admin' : 'Creează un cont nou (Staff/Admin)'}</h2>
                        </div>
                        
                        {errorMsg && <div className="error-message" style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Nume</label>
                                    <input type="text" name="nume" value={formData.nume} onChange={handleInputChange} required className="admin-input" placeholder="Popescu" />
                                </div>
                                <div className="form-group">
                                    <label>Prenume</label>
                                    <input type="text" name="prenume" value={formData.prenume} onChange={handleInputChange} required className="admin-input" placeholder="Ion" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="admin-input" placeholder="ion.popescu@muzeuart.ro" />
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Parolă {isEditMode && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'gray' }}>(opțional)</span>}</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!isEditMode} className="admin-input" placeholder={isEditMode ? "Lasă gol pentru a o păstra..." : "Parolă temporară..."} />
                                </div>
                                <div className="form-group">
                                    <label>Telefon (Opțional)</label>
                                    <input type="tel" name="telefon" value={formData.telefon} onChange={handleInputChange} className="admin-input" placeholder="07xx xxx xxx" />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Rol în Sistem</label>
                                    <select name="rol" value={formData.rol} onChange={handleInputChange} className="admin-input" required>
                                        <option value="Admin">Administrator Muzeu</option>
                                        <option value="Personal">Personal / Staff</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Muzeu Alocat</label>
                                    <select name="muzeuId" value={formData.muzeuId} onChange={handleInputChange} className="admin-input">
                                        <option value="">- Niciunul (Acces Restrâns) -</option>
                                        {locations.map(loc => (
                                            <option key={loc.codUnicLocatie} value={loc.codUnicLocatie}>{loc.numeLoc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions mt-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <button type="button" className="btn-secondary" style={{ borderRadius: '25px', padding: '0.6rem 1.5rem' }} onClick={handleCloseModal} disabled={isSubmitting}>
                                    Anulează
                                </button>
                                <button type="submit" className="btn-primary" style={{ borderRadius: '25px', padding: '0.6rem 1.5rem' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Se salvează...' : (isEditMode ? 'Salvează' : 'Creează')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
