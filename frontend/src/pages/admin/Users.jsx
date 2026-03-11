import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Trash2, ArrowUpDown, ArrowUp, ArrowDown, User, AlertCircle } from 'lucide-react';
import './Users.css';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterRole, setFilterRole] = useState('');
    const [filterCard, setFilterCard] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchCards();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                withCredentials: true,
            });
            setUsers(response.data.data);
            setError('');
        } catch (err) {
            setError('Nu s-au putut încărca utilizatorii');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCards = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/loyalty-cards');
            setAllCards(response.data.data);
        } catch (err) {
            console.error('Fetch cards error:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sigur vrei să ștergi acest utilizator?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
                withCredentials: true,
            });
            fetchUsers();
        } catch (err) {
            alert('Eroare la ștergere: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        let date;
        if (typeof timestamp === 'number') {
            if (timestamp < 10000000000) {
                date = new Date(timestamp * 1000);
            } else {
                date = new Date(timestamp);
            }
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('ro-RO');
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        if (filterRole && user.role !== filterRole) return false;
        if (filterCard && user.cardName !== filterCard) return false;
        return true;
    });

    // Sort users (only by name or date)
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
            case 'name':
                aVal = a.name?.toLowerCase() || '';
                bVal = b.name?.toLowerCase() || '';
                break;
            case 'date':
                aVal = a.createdAt || 0;
                bVal = b.createdAt || 0;
                break;
            default:
                return 0;
        }

        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return <ArrowUpDown size={14} className="sort-icon inactive" />;
        return sortOrder === 'asc' ?
            <ArrowUp size={14} className="sort-icon active" /> :
            <ArrowDown size={14} className="sort-icon active" />;
    };

    const getEmptyMessage = () => {
        if (filterRole && filterCard) {
            return `Nu există utilizatori cu rolul "${filterRole}" și cardul "${filterCard}"`;
        }
        if (filterRole) {
            return `Nu există utilizatori cu rolul "${filterRole}"`;
        }
        if (filterCard) {
            return `Nu există utilizatori cu cardul "${filterCard}"`;
        }
        return 'Nu există utilizatori înregistrați încă';
    };

    if (loading) {
        return <div className="loading">Se încarcă...</div>;
    }

    return (
        <div className="users-page">
            <div className="page-header">
                <h1>Utilizatori</h1>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Toate rolurile</option>
                        <option value="Utilizator">Utilizator</option>
                        <option value="Personal">Personal</option>
                    </select>
                </div>

                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterCard}
                        onChange={(e) => setFilterCard(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Toate cardurile</option>
                        {allCards.map(card => (
                            <option key={card.tipUnicCard} value={card.numeCard}>
                                {card.numeCard} ({card.puncteCard} puncte)
                            </option>
                        ))}
                    </select>
                </div>

                <span className="filter-count">
                    {sortedUsers.length} utilizator{sortedUsers.length !== 1 ? 'i' : ''}
                </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')} className="sortable">
                                <div className="th-content">
                                    Utilizator {getSortIcon('name')}
                                </div>
                            </th>
                            <th>Rol</th>
                            <th>Card Fidelitate</th>
                            <th onClick={() => handleSort('date')} className="sortable">
                                <div className="th-content">
                                    Înregistrat {getSortIcon('date')}
                                </div>
                            </th>
                            <th>Comenzi</th>
                            <th>Recenzii</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="user-cell">
                                    <div className="user-cell-inner">
                                        <div className="user-avatar-wrap">
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="user-avatar" />
                                            ) : (
                                                <div className="user-avatar-placeholder">
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                                        {(user.name || '?')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-text-wrap">
                                            <span className="user-name-cell">{user.name}</span>
                                            <span className="user-email-cell">{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge badge-role${user.role === 'Personal' ? ' badge-role-personal' : ''}`}>
                                        {user.role || 'Utilizator'}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge user-badge-card">{user.cardName}</span>
                                </td>
                                <td>{formatDate(user.createdAt)}</td>
                                <td>
                                    <span className="badge user-badge-info">{user.orderCount || 0}</span>
                                </td>
                                <td>
                                    <span className="badge badge-success">{user.reviewCount || 0}</span>
                                </td>
                                <td>
                                    <button
                                        className="btn-danger-small"
                                        onClick={() => handleDelete(user.id)}
                                        title="Șterge utilizator"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>


                {sortedUsers.length === 0 && !loading && (
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <AlertCircle size={48} />
                        </div>
                        <p>{getEmptyMessage()}</p>
                        {(filterRole || filterCard) && (
                            <button
                                className="btn-reset-filters"
                                onClick={() => { setFilterRole(''); setFilterCard(''); }}
                            >
                                Resetează filtrele
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
