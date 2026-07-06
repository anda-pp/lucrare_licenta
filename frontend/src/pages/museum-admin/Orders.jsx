import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Search, Download } from 'lucide-react';
import '../admin/Dashboard.css';
import './MyMuseum.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${API}/api/museum-admin/orders`, { withCredentials: true });
                if (res.data.success) {
                    setOrders(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o =>
        (o.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.numarComanda.toString().includes(searchTerm)
    );

    const exportCSV = () => {
        const headers = ['Nr. Comandă', 'Cumpărător', 'Email', 'Dată Achiziție', 'Total (LEI)', 'Status Plată'];

        const escape = (val) => {
            const str = val == null ? '' : String(val);
            // Wrap in quotes if contains comma, quote or newline
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };

        const rows = filteredOrders.map(order => [
            `#${order.numarComanda}`,
            order.userName || 'Vizitator Anonim',
            order.userEmail || '-',
            new Date(order.dataComanda).toLocaleDateString('ro-RO'),
            order.totalPlata.toFixed(2),
            order.statusPlata,
        ].map(escape).join(','));

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        // Add BOM for correct diacritics display in Excel
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const today = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `comenzi-bilete-${today}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="dashboard-page">
            <div className="page-header museum-page-header">
                <div>
                    <h1 className="page-title">Comenzi Bilete</h1>
                    <p className="subtitle">Vizualizează tranzacțiile de bilete pentru muzeul tău.</p>
                </div>
                <button className="museum-header-action-btn success" onClick={exportCSV} disabled={loading || filteredOrders.length === 0}>
                    <Download size={18} /> Exportă Raport
                </button>
            </div>

            <div className="museum-card">
                <div className="museum-card-header museum-search-header">
                    <div className="museum-search-bar">
                        <Search size={16} className="search-icon-muted" />
                        <input 
                            type="text" 
                            placeholder="Caută după nr. comandă sau nume..." 
                            className="museum-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {filteredOrders.length > 0 && (
                        <span className="muted" style={{ fontSize: '0.85rem' }}>
                            {filteredOrders.length} {filteredOrders.length === 1 ? 'comandă' : 'comenzi'}
                            {searchTerm && ` pentru "${searchTerm}"`}
                        </span>
                    )}
                </div>
                
                <div className="table-container museum-table-container">
                    <table className="activity-table museum-activity-table">
                        <thead>
                            <tr>
                                <th>Nr. Comandă</th>
                                <th>Cumpărător</th>
                                <th>Dată Achiziție</th>
                                <th>Total (LEI)</th>
                                <th>Status Plată</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">Se încarcă comenzile...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">
                                        <Ticket size={40} className="museum-empty-icon" />
                                        {searchTerm ? 'Nu s-au găsit comenzi conform căutării.' : 'Nu există comenzi de bilete înregistrate.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.numarComanda}>
                                        <td>#{order.numarComanda}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.userName || 'Vizitator Anonim'}</div>
                                            <div className="muted">{order.userEmail || '-'}</div>
                                        </td>
                                        <td>{new Date(order.dataComanda).toLocaleDateString('ro-RO')}</td>
                                        <td><strong>{order.totalPlata.toFixed(2)} LEI</strong></td>
                                        <td>
                                            <span className={`status-chip ${order.statusPlata === 'Plătit' ? 'chip-success' : order.statusPlata === 'În așteptare' ? 'chip-warn' : 'chip-danger'}`}>
                                                {order.statusPlata}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
