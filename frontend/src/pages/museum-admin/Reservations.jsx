import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, CheckCircle } from 'lucide-react';
import '../admin/Dashboard.css';
import './MyMuseum.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Reservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await axios.get(`${API}/api/museum-admin/reservations`, { withCredentials: true });
                if (res.data.success) {
                    setReservations(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch reservations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReservations();
    }, []);

    const filteredReservations = reservations.filter(r => 
        (r.numeRezervant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.eventTitlu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toString().includes(searchTerm)
    );
    
    return (
        <div className="dashboard-page">
            <div className="page-header museum-page-header">
                <div>
                    <h1 className="page-title">Rezervări Evenimente</h1>
                    <p className="subtitle">Urmărește lista de participanți la viitoarele expoziții.</p>
                </div>
            </div>

            <div className="museum-card">
                <div className="museum-card-header museum-search-header">
                    <div className="museum-search-bar">
                        <Search size={16} className="search-icon-muted" />
                        <input 
                            type="text" 
                            placeholder="Caută vizitator..." 
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
                                <th>Nr. Rezervare</th>
                                <th>Vizitator</th>
                                <th>Eveniment</th>
                                <th>Locuri</th>
                                <th>Dată Înregistrare</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">Se încarcă rezervările...</td>
                                </tr>
                            ) : filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="museum-empty-state">
                                        <Users size={40} className="museum-empty-icon" />
                                        {searchTerm ? 'Nu s-au găsit rezervări conform căutării.' : 'Nu există rezervări momentan.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map(rez => (
                                    <tr key={rez.id}>
                                        <td>#{rez.id.substring(0, 8)}...</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{rez.numeRezervant}</div>
                                            <div className="muted">{rez.userEmail || 'Cont Anonim'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{rez.eventTitlu}</div>
                                            <div className="muted">
                                                {rez.ziuaAleasa ? new Date(rez.ziuaAleasa).toLocaleDateString('ro-RO') : '-'}
                                                {rez.intervalOrar ? ` · ${rez.intervalOrar}` : ''}
                                            </div>
                                        </td>
                                        <td><strong>{rez.nrPersoane}</strong> persoane</td>
                                        <td>{new Date(rez.dataRezervare).toLocaleDateString('ro-RO')}</td>
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
