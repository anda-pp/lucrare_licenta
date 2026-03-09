import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertCircle, CalendarCheck, Users, Clock, User, Download, Plus } from 'lucide-react';
import './Reservations.css';
import './admin-shared.css';

const API = 'http://localhost:5000';

export default function Reservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchReservations(); }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/admin/reservations`, { withCredentials: true });
            if (res.data.success) setReservations(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = reservations.filter(r => {
        const term = searchTerm.toLowerCase();
        return !term ||
            r.userName?.toLowerCase().includes(term) ||
            r.eventTitle?.toLowerCase().includes(term) ||
            r.userEmail?.toLowerCase().includes(term);
    });

    const exportCSV = () => {
        const header = ['Eveniment', 'Tip', 'Utilizator', 'Email', 'Persoane', 'Zi Aleasă', 'Interval', 'Data Rezervare'];
        const rows = filtered.map(r => [
            r.eventTitle || '-',
            r.eventType || '-',
            r.userName || '-',
            r.userEmail || '-',
            r.nrPersoane ?? '-',
            r.ziuaAleasa || '-',
            r.intervalOrar || '-',
            r.dataRezervare ? new Date(r.dataRezervare * 1000).toLocaleString('ro-RO') : '-',
        ]);
        const csvContent = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rezervari_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (ts) => {
        if (!ts) return '—';
        // ts might be unix seconds (from SQLite) or miliseconds
        const ms = ts > 1e10 ? ts : ts * 1000;
        return new Date(ms).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="reservations-admin-page">
            <div className="page-header">
                <h1>Rezervări Evenimente</h1>
                <button className="btn-primary icon-btn" onClick={exportCSV}>
                    <Plus size={16} /> Export CSV
                </button>
            </div>

            <div className="filters">
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Caută după utilizator sau eveniment..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="res-total-badge">
                    {filtered.length} rezervări
                </div>
            </div>

            {loading && <div className="loading">Se încarcă...</div>}

            {!loading && filtered.length === 0 && (
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <p>Nicio rezervare găsită.</p>
                </div>
            )}

            <div className="res-table-wrapper">
                {filtered.length > 0 && (
                    <table className="res-table">
                        <thead>
                            <tr>
                                <th><CalendarCheck size={14} /> Eveniment</th>
                                <th><User size={14} /> Utilizator</th>
                                <th><Users size={14} /> Persoane</th>
                                <th><CalendarCheck size={14} /> Zi Aleasă</th>
                                <th><Clock size={14} /> Interval</th>
                                <th>Rezervat la</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <strong>{r.eventTitle || '—'}</strong>
                                        {r.eventType && <span className="ev-type-chip">{r.eventType}</span>}
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <span className="user-name">{r.userName || '—'}</span>
                                            <span className="user-email">{r.userEmail || ''}</span>
                                        </div>
                                    </td>
                                    <td className="text-center"><strong>{r.nrPersoane ?? '—'}</strong></td>
                                    <td>{r.ziuaAleasa || '—'}</td>
                                    <td>{r.intervalOrar || '—'}</td>
                                    <td className="date-cell">{formatDate(r.dataRezervare)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
