import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Star, Ticket, MapPin, Zap, BookOpen, CheckCircle, Tag } from 'lucide-react';
import './Rewards.css';

const TIP_ICON = {
    bilet_gratuit: Ticket,
    reducere: Tag,
    tur_ghidat: MapPin,
    workshop: Zap,
    catalog: BookOpen,
    voucher: Gift,
};

export default function Rewards() {
    const [rewards, setRewards] = useState([]);
    const [myRewards, setMyRewards] = useState([]);
    const [puncte, setPuncte] = useState(0);
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState(null);
    const [tab, setTab] = useState('catalog');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, myRes] = await Promise.all([
                axios.get('http://localhost:5000/api/rewards', { withCredentials: true }),
                axios.get('http://localhost:5000/api/rewards/my', { withCredentials: true }),
            ]);
            if (catRes.data.success) {
                setRewards(catRes.data.data);
                setPuncte(catRes.data.puncteCurente);
                setCard(catRes.data.card);
            }
            if (myRes.data.success) setMyRewards(myRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const claimReward = async (id) => {
        setClaimingId(id);
        try {
            const res = await axios.post(`http://localhost:5000/api/rewards/${id}/claim`, {}, { withCredentials: true });
            if (res.data.success) {
                alert(`✅ Recompensă revendicată!\nCod voucher: ${res.data.data.codVoucher}`);
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Eroare la revendicare');
        } finally {
            setClaimingId(null);
        }
    };

    if (loading) return <div className="rewards-loading">Se încarcă recompensele...</div>;

    return (
        <div className="rewards-page">
            {/* Header */}
            <div className="rewards-header">
                <div>
                    <h1><Gift size={28} /> Schimb Puncte</h1>
                    <p className="rewards-subtitle">Transformă punctele de fidelitate în experiențe culturale</p>
                </div>
                {card && (
                    <div className="points-display">
                        <Star size={20} />
                        <div>
                            <span className="points-value">{puncte}</span>
                            <span className="points-label">puncte disponibile</span>
                        </div>
                    </div>
                )}
            </div>

            {!card && (
                <div className="no-card-banner">
                    <Gift size={24} />
                    <span>Nu ai un card de fidelitate activ. Cumpără bilete pentru a acumula puncte!</span>
                </div>
            )}

            {/* Tabs */}
            <div className="rewards-tabs">
                <button className={`rewards-tab ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>
                    <Gift size={16} /> Catalog Recompense
                </button>
                <button className={`rewards-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
                    <CheckCircle size={16} /> Recompensele Mele ({myRewards.length})
                </button>
            </div>

            {/* Catalog */}
            {tab === 'catalog' && (
                <div className="rewards-grid">
                    {rewards.map(r => {
                        const IconComp = TIP_ICON[r.tip] || Gift;
                        const canClaim = puncte >= r.puncte_necesare;
                        const pct = Math.min(100, Math.round((puncte / r.puncte_necesare) * 100));
                        return (
                            <div key={r.id} className={`reward-card ${canClaim ? 'affordable' : ''}`}>
                                <div className="reward-icon-wrap">
                                    <IconComp size={28} />
                                </div>
                                <div className="reward-info">
                                    <h3>{r.nume}</h3>
                                    <p>{r.descriere}</p>
                                    <div className="reward-value-badge">{r.valoare}</div>
                                    <div className="reward-cost">
                                        <Star size={14} />
                                        <span>{r.puncte_necesare} puncte</span>
                                    </div>
                                    {!canClaim && (
                                        <div className="reward-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="progress-label">
                                                {puncte} / {r.puncte_necesare} puncte
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className={`claim-btn ${canClaim ? 'active' : 'disabled'}`}
                                    onClick={() => canClaim && claimReward(r.id)}
                                    disabled={!canClaim || claimingId === r.id}
                                >
                                    {claimingId === r.id ? 'Se procesează...' : canClaim ? '🎁 Revendică' : 'Puncte insuficiente'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* My rewards */}
            {tab === 'my' && (
                <div className="my-rewards-list">
                    {myRewards.length === 0 ? (
                        <div className="no-rewards">
                            <Gift size={48} strokeWidth={1} />
                            <h3>Nu ai revendicat nicio recompensă încă</h3>
                            <p>Explorează catalogul și schimbă punctele în experiențe culturale!</p>
                        </div>
                    ) : (
                        myRewards.map(r => (
                            <div key={r.id} className={`claimed-card ${r.status}`}>
                                <div className="claimed-info">
                                    <h4>{r.nume}</h4>
                                    <p>{r.descriere}</p>
                                    <span className="claimed-date">
                                        {new Date(r.data_revendicarii * 1000).toLocaleDateString('ro-RO')}
                                        {' · '}{r.puncte_cheltuite} puncte cheltuite
                                    </span>
                                </div>
                                <div className="voucher-box">
                                    <span className="voucher-label">Cod voucher</span>
                                    <span className="voucher-code">{r.cod_voucher}</span>
                                    <span className={`voucher-status ${r.status}`}>{r.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
