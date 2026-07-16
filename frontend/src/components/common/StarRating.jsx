import { Star } from 'lucide-react';

// Componentă pentru afișarea sau selectarea unui rating din 1-5 stele
// Dacă onChange e furnizat, stelele devin interactive (picker); altfel sunt read-only
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
                    // Scala ușoară la stelele active pentru feedback vizual
                    style={interactive ? { transition: 'transform 0.15s', transform: i < value ? 'scale(1.1)' : 'scale(1)' } : undefined}
                />
            ))}
        </span>
    );
}
