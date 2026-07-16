import { X, Save } from 'lucide-react';

// Modal generic pentru formularele de creare și editare
// Afișează un overlay cu form, mesaj de eroare și butoanele Anulează/Salvează
export default function FormModal({
    show,
    title,
    onClose,
    onSubmit,
    saving = false,
    error = '',
    children,
    submitLabel = 'Salvează',
    wide = false,
}) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-box"
                // Prop-ul wide permite un modal mai lat pentru formulare complexe (ex. creare eveniment)
                style={wide ? { maxWidth: '720px' } : undefined}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="form-body">
                    {children}

                    {error && <div className="form-error">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Anulează
                        </button>
                        <button type="submit" className="btn-primary icon-btn" disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Se salvează...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
