import { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageOpen, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useSession } from '../../lib/auth';
import './MyOrders.css';

const API = 'http://localhost:5000';

export default function MyOrders() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) fetchOrders();
    }, [session]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-orders`, { withCredentials: true });
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ro-RO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        if (status === 'Plătit') return <CheckCircle2 size={18} className="status-icon success" />;
        if (status === 'Eșuat') return <XCircle size={18} className="status-icon error" />;
        return <Clock size={18} className="status-icon pending" />;
    };

    if (loading) return <div className="my-orders-loading">Se încarcă comenzile...</div>;

    return (
        <div className="my-orders-page">
            <header className="page-header">
                <h1>Comenzile Mele</h1>
                <p>Istoricul biletelor achiziționate și statusul acestora.</p>
            </header>

            {orders.length === 0 ? (
                <div className="my-orders-empty">
                    <PackageOpen size={48} strokeWidth={1} />
                    <h3>Nicio comandă plasată</h3>
                    <p>Nu ai cumpărat încă niciun bilet. Explorează locațiile noastre!</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.numarComanda} className="order-card">
                            <div className="order-header">
                                <div>
                                    <span className="order-id">Comanda #{order.numarComanda}</span>
                                    <span className="order-date">{formatDate(order.dataComanda)}</span>
                                </div>
                                <div className={`order-status-badge ${order.statusPlata === 'Plătit' ? 'success' : order.statusPlata === 'Eșuat' ? 'error' : 'pending'}`}>
                                    {getStatusIcon(order.statusPlata)}
                                    {order.statusPlata}
                                </div>
                            </div>

                            <div className="order-body">
                                <div className="order-detail-row">
                                    <span className="order-label">Total plată:</span>
                                    <span className="order-total">{order.totalPlata.toFixed(2)} Lei</span>
                                </div>
                                <div className="order-detail-row">
                                    <span className="order-label">Status comandă:</span>
                                    <span className={`order-state ${order.statusComanda === 'Anulată' ? 'cancelled' : 'active'}`}>
                                        {order.statusComanda || 'Activă'}
                                    </span>
                                </div>
                            </div>

                            {order.statusPlata === 'Plătit' && (
                                <div className="order-footer">
                                    <button className="download-btn">🎟 Descarcă Bilete (PDF)</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
