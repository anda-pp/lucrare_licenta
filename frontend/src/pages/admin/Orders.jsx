import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar, Check, X, AlertCircle, ShoppingBag } from 'lucide-react';
import './Orders.css';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPayment, setFilterPayment] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/orders', {
                withCredentials: true,
            });
            setOrders(response.data.data);
            setError('');
        } catch (err) {
            setError('Nu s-au putut încărca comenzile');
            console.error('Fetch orders error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Toggle între Activă ↔ Anulată — singura acțiune disponibilă din panou admin
    const handleToggleStatus = async (orderId, currentStatus) => {
        const newStatus = currentStatus === 'Activă' ? 'Anulată' : 'Activă';

        try {
            await axios.put(
                `http://localhost:5000/api/orders/${orderId}/status`,
                { statusComanda: newStatus },
                { withCredentials: true }
            );
            fetchOrders();
        } catch (err) {
            alert('Eroare la actualizare: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredOrders = orders.filter(o => {
        if (filterStatus && o.statusComanda !== filterStatus) return false;
        if (filterPayment && o.statusPlata !== filterPayment) return false;
        return true;
    });

    // Clase CSS distincte pentru fiecare stare de plată
    const getPaymentStatusClass = (status) => {
        switch (status) {
            case 'Plătit': return 'status-paid';
            case 'În așteptare': return 'status-pending';
            case 'Eșuat': return 'status-failed';
            default: return '';
        }
    };

    const getOrderStatusClass = (status) => {
        return status === 'Activă' ? 'status-active' : 'status-cancelled';
    };

    if (loading) {
        return <div className="loading">Se încarcă...</div>;
    }

    return (
        <div className="orders-page">
            <div className="page-header">
                <h1>Comenzi</h1>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Toate comenzile</option>
                        <option value="Activă">Active</option>
                        <option value="Anulată">Anulate</option>
                    </select>
                </div>

                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Toate plățile</option>
                        <option value="Plătit">Plătit</option>
                        <option value="În așteptare">În așteptare</option>
                        <option value="Eșuat">Eșuat</option>
                    </select>
                </div>

                <span className="filter-count">
                    {filteredOrders.length} comenzi
                </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Client</th>
                            <th>Total</th>
                            <th>Data</th>
                            <th>Plată</th>
                            <th>Status</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.numarComanda} className={order.statusComanda === 'Anulată' ? 'row-cancelled' : ''}>
                                <td className="order-id">#{order.numarComanda}</td>
                                <td>
                                    <div className="customer-info">
                                        <span className="customer-name">{order.userName}</span>
                                        <span className="customer-email">{order.userEmail}</span>
                                    </div>
                                </td>
                                <td className="order-total">{order.totalPlata?.toFixed(2)} lei</td>
                                <td className="order-date">
                                    <div className="date-wrapper">
                                        <Calendar size={14} />
                                        {formatDate(order.dataComanda)}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${getPaymentStatusClass(order.statusPlata)}`}>
                                        {order.statusPlata}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${getOrderStatusClass(order.statusComanda)}`}>
                                        {order.statusComanda || 'Activă'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`btn-action ${order.statusComanda === 'Anulată' ? 'btn-activate' : 'btn-cancel'}`}
                                        onClick={() => handleToggleStatus(order.numarComanda, order.statusComanda || 'Activă')}
                                        title={order.statusComanda === 'Anulată' ? 'Reactivează comanda' : 'Anulează comanda'}
                                    >
                                        {order.statusComanda === 'Anulată' ? <Check size={16} /> : <X size={16} />}
                                        {order.statusComanda === 'Anulată' ? 'Reactivează' : 'Anulează'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && !loading && (
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <ShoppingBag size={48} />
                        </div>
                        <p>Nu există comenzi care să corespundă filtrelor</p>
                        {(filterStatus || filterPayment) && (
                            <button className="btn-reset-filters" onClick={() => { setFilterStatus(''); setFilterPayment(''); }}>
                                Resetează filtrele
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
