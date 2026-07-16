import { useEffect } from 'react';
import { useSession, authClient } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Palette, Hammer, Mail, LogOut, Landmark } from 'lucide-react';
import './Home.css';

export default function Home() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

    // Redirecționăm automat utilizatorul spre panoul propriu în funcție de rol
    // Ruta "/" este practic un dispatcher — nu rămâne niciodată pe această pagină
    useEffect(() => {
        if (!isPending) {
            if (session?.user) {
                if (session.user.role === 'Superadmin') {
                    navigate('/superadmin');
                } else if (session.user.role === 'Admin') {
                    navigate('/admin');
                } else if (session.user.role === 'Personal') {
                    navigate('/staff');
                } else if (session.user.role === 'Utilizator') {
                    navigate('/user');
                } else {
                    navigate('/user');
                }
            } else {
                // Utilizatorul neautentificat merge direct la Login
                navigate('/login');
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
                    // Afișăm spinner cât timp se execută redirect-ul
                    <div className="user-dashboard">
                        <div className="loading-spinner"></div>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Te redirecționăm către panoul tău...</p>
                    </div>
                ) : (
                    // Landing page minimal pentru utilizatorii neautentificați
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
