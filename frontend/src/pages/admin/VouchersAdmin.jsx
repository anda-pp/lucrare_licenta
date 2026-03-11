import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Search, Filter, RefreshCcw, AlertCircle } from 'lucide-react';
import './admin-shared.css';

const API = 'http://localhost:5000';

export default function VouchersAdmin() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const res = await axios.get(`${API}/api/rewards/admin/claims`, { withCredentials: true });
            if (res.data.success) {
                setClaims(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClaims = claims.filter(c => {
        const matchesSearch = c.cod_voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.nume_complet?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (unixOrString) => {
        if (!unixOrString) return '-';
        // Dacă e timestamp în secunde
        if (typeof unixOrString === 'number' && unixOrString < 10000000000) {
            return new Date(unixOrString * 1000).toLocaleString('ro-RO');
        }
        return new Date(unixOrString).toLocaleString('ro-RO');
    };

    return (
        <div className="vouchers-page">
            <div className="page-header">
                <div>
                    <h1>Monitorizare Vouchere Promo</h1>
                    <p>Istoricul recompenselor revendicate și codurilor generate pentru clienți.</p>
                </div>
                <button className="btn-secondary icon-btn" onClick={fetchClaims}>
                    <RefreshCcw size={16} /> Reîncarcă
                </button>
            </div>

            <div className="filters">
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Caută cod voucher sau adresă email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <Filter className="filter-icon" size={18} />
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Toate statusurile</option>
                        <option value="activ">Active (Nefolosite)</option>
                        <option value="folosit">Folosite</option>
                    </select>
                </div>
            </div>

            <div className="table-wrapper">
                {loading ? (
                    <div className="loading">Se încarcă istoricul...</div>
                ) : filteredClaims.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48} className="text-muted mb-4" />
                        <p>Nu s-a găsit niciun cod promoțional conform filtrelor selectate.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Cod Promoțional</th>
                                <th>Client (Email)</th>
                                <th>Tip Recompensă</th>
                                <th>Valoare / Tip</th>
                                <th>Data Generării</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.map((claim) => (
                                <tr key={claim.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                            <Ticket size={16} color="var(--color-primary)" />
                                            {claim.cod_voucher}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{claim.nume_complet || 'Anonim'}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{claim.email}</div>
                                    </td>
                                    <td>{claim.nume || 'Necunoscut'}</td>
                                    <td>
                                        <span className={`badge ${claim.tip === 'Procentaj' || claim.tip === 'reducere_%' ? 'badge-blue' : 'badge-green'}`}>
                                            {claim.tip === 'Gratuitate' ? 'Abonament' : claim.valoare + (claim.tip?.includes('%') ? '%' : ' Lei')}
                                        </span>
                                    </td>
                                    <td>{formatDate(claim.data_revendicarii)}</td>
                                    <td>
                                        <span className={`status-badge ${claim.status === 'folosit' ? 'status-used' : 'status-active'}`} style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: claim.status === 'folosit' ? '#f1f5f9' : '#dcfce7',
                                            color: claim.status === 'folosit' ? '#64748b' : '#166534'
                                        }}>
                                            {claim.status === 'folosit' ? 'Folosit la Checkout' : 'Activ'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
