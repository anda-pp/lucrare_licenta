// Card KPI refolosibil din dashboard-ul utilizatorului
// Afișează un icon colorat, un titlu, valoarea principală și opțional un subtitlu + buton CTA
export default function StatCard({ icon, iconClass, iconStyle, title, value, valueStyle, subLabel, btnLabel, onBtnClick }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon-wrapper ${iconClass || ''}`} style={iconStyle}>
                {icon}
            </div>
            <div className="stat-info">
                <h3>{title}</h3>
                <p className="stat-value" style={valueStyle}>{value}</p>
                {subLabel && <span className="points-label">{subLabel}</span>}
                {btnLabel && (
                    <button className="show-all-btn" onClick={onBtnClick}>
                        {btnLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
