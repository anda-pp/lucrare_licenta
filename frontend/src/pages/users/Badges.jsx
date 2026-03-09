import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    MessageSquare, Star, Ticket, Map, Calendar, Crown, Heart,
    Trophy, Lock, CheckCircle, ChevronRight
} from 'lucide-react';
import './Badges.css';

const ICON_MAP = {
    MessageSquare, Star, Ticket, Map, Calendar, Crown, Heart, Trophy
};

export default function Badges() {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [newlyEarned, setNewlyEarned] = useState([]);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/badges/my', { withCredentials: true });
            if (res.data.success) setBadges(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkBadges = async () => {
        setChecking(true);
        try {
            const res = await axios.post('http://localhost:5000/api/badges/check', {}, { withCredentials: true });
            if (res.data.success && res.data.count > 0) {
                setNewlyEarned(res.data.data);
                fetchBadges();
            } else {
                alert('Nicio insignă nouă de acordat momentan.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setChecking(false);
        }
    };

    const earned = badges.filter(b => b.earned);
    const locked = badges.filter(b => !b.earned);

    if (loading) return <div className="badges-loading">Se încarcă insignele...</div>;

    return (
        <div className="badges-page">
            {/* Header */}
            <div className="badges-header">
                <div>
                    <h1><Trophy size={28} /> Insignele Mele</h1>
                    <p className="badges-subtitle">
                        Câștigă trofee digitale explorând cultura României
                    </p>
                </div>
                <button className="check-btn" onClick={checkBadges} disabled={checking}>
                    {checking ? 'Se verifică...' : '✨ Verifică realizările'}
                </button>
            </div>

            {/* Newly earned toast */}
            {newlyEarned.length > 0 && (
                <div className="newly-earned-banner">
                    <CheckCircle size={20} />
                    <span>🎉 Felicitări! Ai câștigat {newlyEarned.length} insignă nouă: <strong>{newlyEarned.map(b => b.nume).join(', ')}</strong></span>
                    <button onClick={() => setNewlyEarned([])}>✕</button>
                </div>
            )}

            {/* Stats strip */}
            <div className="badges-stats">
                <div className="badge-stat-item">
                    <span className="stat-num">{earned.length}</span>
                    <span className="stat-lbl">Câștigate</span>
                </div>
                <div className="badge-stat-divider" />
                <div className="badge-stat-item">
                    <span className="stat-num">{locked.length}</span>
                    <span className="stat-lbl">Rămase</span>
                </div>
                <div className="badge-stat-divider" />
                <div className="badge-stat-item">
                    <span className="stat-num">{badges.length > 0 ? Math.round((earned.length / badges.length) * 100) : 0}%</span>
                    <span className="stat-lbl">Progres total</span>
                </div>
            </div>

            {/* Earned badges */}
            {earned.length > 0 && (
                <section className="badges-section">
                    <h2 className="section-title">
                        <CheckCircle size={20} /> Obținute ({earned.length})
                    </h2>
                    <div className="badges-grid">
                        {earned.map(badge => {
                            const IconComp = ICON_MAP[badge.iconita] || Trophy;
                            return (
                                <div key={badge.id} className="badge-card earned" style={{ '--badge-color': badge.culoare }}>
                                    <div className="badge-icon-wrap">
                                        <IconComp size={32} />
                                    </div>
                                    <div className="badge-info">
                                        <h3>{badge.nume}</h3>
                                        <p>{badge.descriere}</p>
                                        {badge.dataObtinerii && (
                                            <span className="badge-date">
                                                Obținută: {new Date(badge.dataObtinerii * 1000).toLocaleDateString('ro-RO')}
                                            </span>
                                        )}
                                    </div>
                                    <CheckCircle size={18} className="earned-check" />
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Locked badges */}
            {locked.length > 0 && (
                <section className="badges-section">
                    <h2 className="section-title">
                        <Lock size={20} /> Disponibile ({locked.length})
                    </h2>
                    <div className="badges-grid">
                        {locked.map(badge => {
                            const IconComp = ICON_MAP[badge.iconita] || Trophy;
                            const pct = badge.valoare_conditie > 0
                                ? Math.min(100, Math.round((badge.progres / badge.valoare_conditie) * 100))
                                : 0;
                            return (
                                <div key={badge.id} className="badge-card locked" style={{ '--badge-color': badge.culoare }}>
                                    <div className="badge-icon-wrap">
                                        <IconComp size={32} />
                                        <Lock size={14} className="lock-overlay" />
                                    </div>
                                    <div className="badge-info">
                                        <h3>{badge.nume}</h3>
                                        <p>{badge.descriere}</p>
                                        <div className="badge-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="progress-label">
                                                {badge.progres} / {badge.valoare_conditie}
                                            </span>
                                        </div>
                                        {badge.mesaj_motivatie && (
                                            <span className="badge-tip">
                                                <ChevronRight size={12} /> {badge.mesaj_motivatie}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
