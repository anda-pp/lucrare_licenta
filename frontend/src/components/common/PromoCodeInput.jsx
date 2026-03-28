import { Tag } from 'lucide-react';

/**
 * Promo code input with apply / remove states.
 *
 * Props:
 *  - promoCode       (string)
 *  - onCodeChange    (value)
 *  - onApply         ()
 *  - onRemove        ()
 *  - appliedPromo    (object|null) – set when a promo is active
 *  - isApplying      (bool)
 *  - error           (string)
 */
export default function PromoCodeInput({
    promoCode,
    onCodeChange,
    onApply,
    onRemove,
    appliedPromo,
    isApplying = false,
    error = '',
}) {
    return (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Ai un cod promoțional?
            </label>

            {!appliedPromo ? (
                <>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Ex: ART-X9B2"
                            value={promoCode}
                            onChange={e => onCodeChange(e.target.value.toUpperCase())}
                            style={{
                                flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--color-border)', background: 'var(--color-input-bg)',
                                color: 'var(--color-text-main)', fontSize: '0.95rem',
                            }}
                        />
                        <button
                            type="button"
                            className="checkout-apply-btn"
                            onClick={onApply}
                            disabled={isApplying || !promoCode.trim()}
                        >
                            {isApplying ? 'Validare...' : 'Aplică'}
                        </button>
                    </div>
                    {error && (
                        <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>
                    )}
                </>
            ) : (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', background: '#ecfdf5',
                    border: '1px solid #10b981', borderRadius: 'var(--radius-md)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 500 }}>
                        <Tag size={18} />
                        <span>Cod <strong style={{ letterSpacing: '1px' }}>{promoCode}</strong> aplicat!</span>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Șterge
                    </button>
                </div>
            )}
        </div>
    );
}
