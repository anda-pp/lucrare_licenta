import { Search } from 'lucide-react';

// Bara de căutare și filtrare refolosibilă din paginile de admin
// Acceptă un array de filtre (dropdown-uri) care se randează dinamic lângă câmpul de search
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

            {/* Randăm fiecare filtru ca un dropdown cu iconița sa */}
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
