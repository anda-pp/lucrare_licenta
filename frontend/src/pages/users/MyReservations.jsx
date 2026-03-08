import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarCheck, Download, Calendar, Users, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { useSession } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import './MyReservations.css';

const API = 'http://localhost:5000';

export default function MyReservations() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) fetchReservations();
    }, [session]);

    const fetchReservations = async () => {
        try {
            const res = await axios.get(`${API}/api/users/my-reservations`, { withCredentials: true });
            if (res.data.success) {
                setReservations(res.data.data);
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
            year: 'numeric'
        });
    };

    const downloadTicket = async (reservationId) => {
        try {
            const response = await axios.get(`${API}/api/users/my-reservations/${reservationId}/ticket`, {
                withCredentials: true,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bilet_Rezervare_${reservationId.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Eroare descărcare bilet rezervare:', error);
            alert('A apărut o eroare la descărcarea biletului. Te rugăm să încerci din nou.');
        }
    };

    if (loading) return <div className="my-res-loading">Se încarcă rezervările...</div>;

    return (
        <div className="my-res-page">
            <button className="profile-back-btn" onClick={() => navigate('/user')}>
                <ArrowLeft size={18} /> Înapoi la cont
            </button>
            <header className="page-header">
                <h1>Rezervările Mele</h1>
                <p>Istoricul biletelor gratuite și participărilor la evenimente.</p>
            </header>

            {reservations.length === 0 ? (
                <div className="my-res-empty">
                    <CalendarCheck size={48} strokeWidth={1} />
                    <h3>Nu ai nicio rezervare</h3>
                    <p>Nu ai rezervat încă locul la niciun eveniment gratuit.</p>
                </div>
            ) : (
                <div className="res-list">
                    {reservations.map(res => (
                        <div key={res.id} className="res-card">
                            <div className="res-header">
                                <div>
                                    <span className="res-id">Rezervare #{res.id.slice(0, 8)}</span>
                                    <span className="res-date">{formatDate(res.dataRezervare)}</span>
                                </div>
                                <div className="res-status-badge success">
                                    <CalendarCheck size={18} className="status-icon" />
                                    Confirmată
                                </div>
                            </div>

                            <div className="res-body">
                                <h3>{res.titluEveniment}</h3>

                                {res.numeLocatie && (
                                    <div className="res-detail-row">
                                        <span className="res-label">Locație:</span>
                                        <span className="res-val">{res.numeLocatie} {res.orasLocatie ? `(${res.orasLocatie})` : ''}</span>
                                    </div>
                                )}
                                <div className="res-detail-row">
                                    <span className="res-label">Zi aleasă:</span>
                                    <span className="res-val">{res.ziuaAleasa ? formatDate(res.ziuaAleasa) : formatDate(res.dataStart)}</span>
                                </div>
                                {res.intervalOrar && (
                                    <div className="res-detail-row">
                                        <span className="res-label">Interval:</span>
                                        <span className="res-val">{res.intervalOrar}</span>
                                    </div>
                                )}
                                <div className="res-detail-row">
                                    <span className="res-label">Participanți:</span>
                                    <span className="res-val">{res.nrPersoane} {res.nrPersoane === 1 ? 'persoană' : 'persoane'}</span>
                                </div>
                            </div>

                            <div className="res-footer">
                                <button className="res-download-btn" onClick={() => downloadTicket(res.id)}>
                                    <Download size={16} /> Descarcă Bilet PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
