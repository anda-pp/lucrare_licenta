import { Inbox } from 'lucide-react';

/**
 * Empty state placeholder for lists / grids with no data.
 *
 * Props:
 *  - icon        (LucideComponent) – default Inbox
 *  - title       (string)          – main message
 *  - description (string)          – secondary text (optional)
 *  - action      (ReactNode)       – optional CTA button
 */
export default function EmptyState({
    icon: Icon = Inbox,
    title = 'Niciun rezultat găsit.',
    description,
    action,
}) {
    return (
        <div className="empty-state">
            <Icon size={48} />
            <p>{title}</p>
            {description && (
                <p style={{ fontSize: '0.88rem', marginTop: '-0.5rem' }}>{description}</p>
            )}
            {action}
        </div>
    );
}
