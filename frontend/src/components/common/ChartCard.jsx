import { ResponsiveContainer } from 'recharts';

// Wrapper card pentru graficele Recharts — afișează titlu, iconița și gestionează starea de date goale
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
