import { ResponsiveContainer } from 'recharts';

/**
 * Wrapper card for a Recharts chart with title, optional icon, and empty/loading states.
 *
 * Props:
 *  - title     (string)      – card heading
 *  - icon      (ReactNode)   – optional icon next to the title
 *  - isEmpty   (bool)        – shows empty message instead of chart
 *  - emptyMsg  (string)      – empty state text (default "Nu există date")
 *  - height    (number)      – ResponsiveContainer height in px (default 260)
 *  - children  (ReactNode)   – the Recharts chart component(s)
 *  - className (string)      – extra class names on the outer div
 */
export default function ChartCard({
    title,
    icon,
    isEmpty = false,
    emptyMsg = 'Nu există date.',
    height = 260,
    children,
    className = '',
}) {
    return (
        <div className={`mr-chart-card ${className}`}>
            <h4 className="mr-chart-title">
                {icon} {title}
            </h4>
            {isEmpty ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
                    {emptyMsg}
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    {children}
                </ResponsiveContainer>
            )}
        </div>
    );
}
