import { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageOpen, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useSession } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import './MyOrders.css';

const API = 'http://localhost:5000';

export default function MyOrders() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const toast = useToast();
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

    const downloadTickets = async (orderId) => {
        try {
            const response = await axios.get(`${API}/api/users/my-orders/${orderId}/ticket`, {
                withCredentials: true,
                responseType: 'blob' // Important for file download
            });

            // Creates a URL for the downloaded blob and auto-clicks a hidden anchor tag
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bilete_Comanda_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Eroare descărcare bilete:', error);
            toast.error('A apărut o eroare la descărcarea biletelor. Te rugăm să încerci din nou.');
        }
    };

    if (loading) return <div className="my-orders-loading">Se încarcă comenzile...</div>;

    return (
        <div className="my-orders-page">
            <button className="profile-back-btn" onClick={() => navigate('/user')}>
                <ArrowLeft size={18} /> Înapoi la cont
            </button>
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
                                    <button className="download-btn" onClick={() => downloadTickets(order.numarComanda)}>
                                        🎟 Descarcă Bilete (PDF)
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
