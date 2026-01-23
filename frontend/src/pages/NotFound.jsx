import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="not-found-icon">🏛️</div>
                <h1 className="not-found-code">404</h1>
                <h2 className="not-found-title">Pagină Negăsită</h2>
                <p className="not-found-message">
                    Ne pare rău, dar pagina pe care o cauți nu există sau a fost mutată.
                </p>
                <div className="not-found-actions">
                    <Link to="/" className="btn-home">
                        🏠 Acasă
                    </Link>
                    <button onClick={() => window.history.back()} className="btn-back">
                        ← Înapoi
                    </button>
                </div>
            </div>
        </div>
    );
}
