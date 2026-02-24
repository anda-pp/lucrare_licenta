/**
 * StatCard — reusable KPI card used in the user dashboard.
 * Props:
 *   icon        — Lucide icon element
 *   iconClass   — CSS class for the icon wrapper (e.g. 'blue', 'yellow')
 *   iconStyle   — optional inline style object for the icon wrapper
 *   title       — card title
 *   value       — primary value (string or number)
 *   valueStyle  — optional inline style for the value
 *   subLabel    — optional subtitle under the value
 *   btnLabel    — CTA button text
 *   onBtnClick  — CTA button click handler
 */
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
