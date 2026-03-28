import { Search } from 'lucide-react';

/**
 * Reusable search + filters bar.
 *
 * Props:
 *  - searchValue     (string)
 *  - onSearchChange  (value)
 *  - searchPlaceholder (string)
 *  - filters         (array)  – [{ icon: LucideComponent, value, onChange, options: [{value,label}], placeholder }]
 *  - children        (ReactNode) – extra elements rendered at the end
 */
export default function SearchFilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Caută...',
    filters = [],
    children,
}) {
    return (
        <div className="filters">
            <div className="search-wrapper">
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={e => onSearchChange(e.target.value)}
                    className="search-input"
                />
            </div>

            {filters.map((f, i) => {
                const Icon = f.icon;
                return (
                    <div className="filter-group" key={i}>
                        {Icon && <Icon className="filter-icon" size={18} />}
                        <select
                            value={f.value}
                            onChange={e => f.onChange(e.target.value)}
                            className="filter-select"
                        >
                            {f.placeholder && <option value="">{f.placeholder}</option>}
                            {f.options.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                );
            })}

            {children}
        </div>
    );
}
