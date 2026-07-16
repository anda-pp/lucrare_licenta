import { CreditCard } from 'lucide-react';

// Distribuția comenzilor pe tipul de card de fidelitate — afișat în raportul directorului
// Fiecare card are o bară de progres cu procentajul față de totalul comenzilor
export default function LoyaltyDistribution({ cards = [] }) {
    if (cards.length === 0) return null;

    return (
        <div className="mr-loyalty-section">
            <h3 className="mr-section-title"><CreditCard size={18} /> Detalii Card Fidelitate</h3>
            <div className="mr-loyalty-grid">
                {cards.map(card => (
                    <div key={card.numeCard} className="mr-loyalty-card">
                        <div className="mr-loyalty-name">{card.numeCard}</div>
                        <div className="mr-loyalty-stats">
                            <span>{card.comenzi} comenzi</span>
                            <span>{card.utilizatori} utilizatori</span>
                            <span className="mr-loyalty-venituri">{card.venituri.toFixed(0)} Lei</span>
                        </div>
                        <div className="mr-loyalty-bar-wrap">
                            <div className="mr-loyalty-bar-fill" style={{ width: `${card.pct}%` }} />
                        </div>
                        <span className="mr-loyalty-pct">{card.pct}% din comenzi</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
