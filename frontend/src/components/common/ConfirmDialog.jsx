import { AlertTriangle } from 'lucide-react';

// Dialog de confirmare refolosibil — înlocuiește window.confirm() cu un modal stilizat
// Suportă variante danger (roșu) și normale (primary)
export default function ConfirmDialog({
    show,
    title = 'Confirmare',
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Da, șterge',
    danger = true,
}) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                </div>
                <div className="form-body" style={{ alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                    <AlertTriangle size={40} color={danger ? '#ef4444' : 'var(--color-primary)'} />
                    <p style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {message}
                    </p>
                    <div className="modal-actions" style={{ width: '100%' }}>
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            Anulează
                        </button>
                        <button
                            type="button"
                            className={danger ? 'btn-danger icon-btn' : 'btn-primary icon-btn'}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
