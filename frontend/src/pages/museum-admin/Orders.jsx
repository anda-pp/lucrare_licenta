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
    
    return (
        <div className="dashboard-page">
            <div className="page-header museum-page-header">
                <div>
                    <h1 className="page-title">Comenzi Bilete</h1>
                    <p className="subtitle">Vizualizează tranzacțiile de bilete pentru muzeul tău.</p>
                </div>
                <button className="museum-header-action-btn success">
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
