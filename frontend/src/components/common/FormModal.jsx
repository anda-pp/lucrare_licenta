import { X, Save } from 'lucide-react';

/**
 * Generic modal wrapper for create/edit forms.
 *
 * Props:
 *  - show        (bool)     – mount guard; renders nothing when false
 *  - title       (string)   – modal heading
 *  - onClose     ()         – called when overlay / X / Anulează is clicked
 *  - onSubmit    (e)        – form submit handler
 *  - saving      (bool)     – disables submit, shows spinner text
 *  - error       (string)   – validation / API error shown above actions
 *  - children    (ReactNode)– form fields
 *  - submitLabel (string)   – custom submit label (default "Salvează")
 *  - wide        (bool)     – wider modal (max-width 720px)
 */
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
