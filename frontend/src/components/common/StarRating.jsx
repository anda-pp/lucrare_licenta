import { Star } from 'lucide-react';

/**
 * Star rating display / interactive picker.
 *
 * Props:
 *  - value     (number 0-5)  – current rating
 *  - onChange   (n)          – if provided, stars become clickable
 *  - size       (number)     – icon size in px (default 16)
 *  - max        (number)     – total stars (default 5)
 *  - filledColor (string)    – filled star color (default '#f59e0b')
 *  - emptyColor  (string)    – empty star stroke (default '#94a3b8')
 */
export default function StarRating({
    value = 0,
    onChange,
    size = 16,
    max = 5,
    filledColor = '#f59e0b',
    emptyColor = '#94a3b8',
}) {
    const interactive = typeof onChange === 'function';

    return (
        <span
            style={{ display: 'inline-flex', gap: '1px', cursor: interactive ? 'pointer' : 'default' }}
        >
            {Array.from({ length: max }, (_, i) => (
                <Star
                    key={i}
                    size={size}
                    fill={i < value ? filledColor : 'none'}
                    stroke={i < value ? filledColor : emptyColor}
                    onClick={interactive ? () => onChange(i + 1) : undefined}
                    style={interactive ? { transition: 'transform 0.15s', transform: i < value ? 'scale(1.1)' : 'scale(1)' } : undefined}
                />
            ))}
        </span>
    );
}
