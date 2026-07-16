import { Inbox } from 'lucide-react';

// Placeholder pentru liste sau grile fără date — afișează un icon, mesaj și opțional un CTA
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
