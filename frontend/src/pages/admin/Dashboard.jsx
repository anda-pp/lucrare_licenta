import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Users, Receipt, MessageSquare } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        locations: 0,
        users: 0,
        orders: 0,
        reviews: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
                withCredentials: true,
            });
            setStats(response.data.data);
        } catch (err) {
            console.error('Fetch stats error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <h1 className="page-title">Dashboard</h1>
            <p className="subtitle">Bine ai venit în panoul de administrare!</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper">
                        <Building2 size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>Locații</h3>
                        <p className="stat-number">{loading ? '...' : stats.locations}</p>
                        <p className="stat-label">Muzee & Galerii</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper">
                        <Users size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>Utilizatori</h3>
                        <p className="stat-number">{loading ? '...' : stats.users}</p>
                        <p className="stat-label">Înregistrați</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper">
                        <Receipt size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>Comenzi</h3>
                        <p className="stat-number">{loading ? '...' : stats.orders}</p>
                        <p className="stat-label">Total</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper">
                        <MessageSquare size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>Recenzii</h3>
                        <p className="stat-number">{loading ? '...' : stats.reviews}</p>
                        <p className="stat-label">Total</p>
                    </div>
                </div>
            </div>

            <div className="info-section">
                <h2>Următorii pași</h2>
                <ul className="todo-list">
                    <li>Vizualizează și gestionează muzee și galerii</li>
                    <li>Monitorizează utilizatorii și comenzile</li>
                    <li>Analizează recenziile și feedback-ul</li>
                    <li>Gestionează cardurile de fidelitate</li>
                </ul>
            </div>
        </div>
    );
}

