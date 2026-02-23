import { useEffect } from 'react';
import { useSession, authClient } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Palette, Hammer, Mail, LogOut, Landmark } from 'lucide-react';
import './Home.css';

export default function Home() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

    // Redirect users to their respective dashboards
    useEffect(() => {
        if (!isPending && session?.user) {
            if (session.user.role === 'Admin') {
                navigate('/admin');
            } else if (session.user.role === 'Personal') {
                navigate('/staff');
            } else if (session.user.role === 'Utilizator') {
                navigate('/user');
            }
        }
    }, [session, isPending, navigate]);

    const handleLogout = async () => {
        await authClient.signOut();
        navigate('/login');
    };

    if (isPending) {
        return (
            <div className="home-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-content">
                {session ? (
                    <div className="user-dashboard">
                        <div className="welcome-header">
                            <h1>Salut, {session.user.prenumeUtil}!</h1>
                            <p className="welcome-subtitle">Bine ai revenit pe platformă</p>
                        </div>

                        <div className="construction-area">
                            <div className="icon-wrapper">
                                <Hammer size={48} strokeWidth={1.5} />
                            </div>
                            <h2>Aplicație în Lucru</h2>
                            <p>
                                Platforma pentru utilizatori este momentan în curs de dezvoltare.
                                Revenim curând cu noutăți culturale!
                            </p>

                            <div className="progress-container">
                                <div className="progress-bar">
                                    <div className="progress-fill"></div>
                                </div>
                                <span className="progress-text">Progres: 30%</span>
                            </div>
                        </div>

                        <div className="notify-card">
                            <Mail className="notify-icon" size={20} strokeWidth={1.5} />
                            <p>Te vom anunța pe <strong>{session.user.email}</strong> la lansare.</p>
                        </div>

                        <div className="actions">
                            <button onClick={handleLogout} className="logout-button">
                                <LogOut size={18} />
                                Deconectare
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="guest-info">
                        <div className="logo-icon">
                            <Landmark size={64} strokeWidth={1} />
                        </div>
                        <h1>Ticketing Muzee</h1>
                        <p>Descoperă cultura și arta din orașul tău. Bilete online, recenzii și experiențe unice.</p>
                        <div className="actions">
                            <button onClick={() => navigate('/login')} className="primary-button">
                                Conectare
                            </button>
                            <button onClick={() => navigate('/register')} className="secondary-button">
                                Înregistrare
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
