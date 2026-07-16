import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import {
    BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, Star, MessageSquare, CalendarDays,
    Ticket, Users, CreditCard, BarChart2, PieChartIcon,
    RefreshCw, AlertCircle, CreditCard as CardIcon
} from 'lucide-react';
import ChartCard from '../../components/common/ChartCard';
import SentimentCards from '../../components/common/SentimentCards';
import NegativeReviewsList from '../../components/common/NegativeReviewsList';
import LoyaltyDistribution from '../../components/common/LoyaltyDistribution';
import './MuseumReports.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Palette culori pentru graficele Pie — două variante, una pentru dark mode și una pentru light
const PURPLE_PALETTE_DARK  = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
const PURPLE_PALETTE_LIGHT = ['#3b0764', '#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6'];
// Culori semantice pentru statusurile comenzilor
const STATUS_COLORS = { 'Plătit': '#10b981', 'Eșuat': '#ef4444', 'În așteptare': '#f59e0b' };

const LUNI_RO = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Formatăm luna din format "2024-03" la "Mar '24" pentru axele graficelor
const formatLuna = (value) => {
    if (!value) return '';
    const [year, month] = value.split('-');
    return `${LUNI_RO[parseInt(month, 10) - 1]} '${year.slice(2)}`;
};

// Card KPI reutilizabil — culoarea accentului se injectează ca CSS custom property
function KpiCard({ icon, label, value, sub, color }) {
    return (
        <div className="mr-kpi-card" style={{ '--kpi-color': color }}>
            <div className="mr-kpi-icon" style={{ background: `${color}18`, color }}>
                {icon}
            </div>
            <div className="mr-kpi-body">
                <p className="mr-kpi-value">{value}</p>
                <p className="mr-kpi-label">{label}</p>
                {sub && <p className="mr-kpi-sub">{sub}</p>}
            </div>
        </div>
    );
}

// Tooltip personalizat pentru graficele Bar și Line din Recharts
function CustomTooltip({ active, payload, label, unit = '', formatLabel }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="mr-tooltip">
            <p className="mr-tooltip-label">{formatLabel ? formatLabel(label) : label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{p.value}{unit}</strong>
                </p>
            ))}
        </div>
    );
}

// Tooltip pentru graficele Pie — afișează doar primul entry din payload
function PieTooltip({ active, payload, unit = '' }) {
    if (!active || !payload?.length) return null;
    const { name, value, payload: entry } = payload[0];
    return (
        <div className="mr-tooltip">
            <p className="mr-tooltip-label">{name}</p>
            <p style={{ color: entry.fill || '#fff' }}>
                <strong>{value}{unit}</strong>
            </p>
        </div>
    );
}

// Tooltip dedicat graficului de venituri — formatăm luna și afișăm Lei sau număr în funcție de dataKey
function RevenueTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="mr-tooltip">
            <p className="mr-tooltip-label">{formatLuna(label)}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{p.dataKey === 'venituri' ? `${p.value} Lei` : p.value}</strong>
                </p>
            ))}
        </div>
    );
}

// Raport Marketing — recenzii, sentiment, tipuri vizitatori și rezervări pe evenimente
function MarketingReport() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { theme } = useTheme();
    // Cursorul graficului se adaptează la tema curentă pentru contrast optim
    const cursorFill = theme === 'dark' ? 'rgba(196, 181, 253, 0.07)' : 'rgba(88, 28, 135, 0.1)';
    const piePalette = theme === 'dark' ? PURPLE_PALETTE_DARK : PURPLE_PALETTE_LIGHT;

    useEffect(() => {
        axios.get(`${API}/api/staff/museum-reports/marketing`, { withCredentials: true })
            .then(res => { if (res.data.success) setData(res.data.data); })
            .catch(err => setError(err.response?.data?.error || 'Eroare la încărcare.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="mr-loading"><RefreshCw size={24} className="mr-spin" /> Se generează raportul...</div>;
    if (error) return <div className="mr-error"><AlertCircle size={20} /> {error}</div>;
    if (!data) return null;

    return (
        <div className="mr-report-body">
            <div className="mr-kpi-grid">
                <KpiCard icon={<Star size={22} />} label="Rating Mediu" value={data.ratingStats.medie.toFixed(1) + ' ★'} sub="din 5 stele" color="#f59e0b" />
                <KpiCard icon={<MessageSquare size={22} />} label="Total Recenzii" value={data.ratingStats.total} sub="pentru acest muzeu" color="#8b5cf6" />
                <KpiCard icon={<CalendarDays size={22} />} label="Evenimente Active" value={data.topEvenimente.length} sub="cu rezervări" color="#3b82f6" />
                <KpiCard icon={<Users size={22} />} label="Total Vizitatori" value={data.topEvenimente.reduce((s, e) => s + e.persoane, 0)} sub="din rezervări" color="#10b981" />
            </div>

            {/* Analiza sentimentului recenziilor — pozitiv / neutru / negativ */}
            <SentimentCards data={data.sentimentBreakdown} />

            <div className="mr-charts-grid">
                <ChartCard title="Distribuție Rating Recenzii" icon={<Star size={18} />} isEmpty={!data.ratingDistributie.length} height={240}>
                    <BarChart data={data.ratingDistributie} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="stele" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip unit=" recenzii" />} cursor={{ fill: cursorFill }} />
                        <Bar dataKey="count" name="Recenzii" radius={[4, 4, 0, 0]}>
                            {/* Culori progresive: roșu (1 stea) → verde (5 stele) */}
                            {data.ratingDistributie.map((_, i) => (
                                <Cell key={i} fill={['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'][i]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartCard>

                <ChartCard title="Evoluție Recenzii (6 luni)" icon={<TrendingUp size={18} />} isEmpty={!data.evolutieRecenzii.length} height={240}>
                    <LineChart data={data.evolutieRecenzii} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="luna" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={formatLuna} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip formatLabel={formatLuna} unit=" recenzii" />} />
                        <Line type="monotone" dataKey="count" name="Recenzii" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
                    </LineChart>
                </ChartCard>

                <ChartCard title="Tipuri Vizitatori (Bilete)" icon={<Ticket size={18} />} isEmpty={!data.tipuriVizitatori.length} emptyMsg="Nu există bilete vândute." height={240}>
                    <PieChart>
                        <Pie data={data.tipuriVizitatori} dataKey="count" nameKey="tip" cx="50%" cy="50%" outerRadius={85} label={({ tip, percent }) => `${tip} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {data.tipuriVizitatori.map((_, i) => (
                                <Cell key={i} fill={piePalette[i % piePalette.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieTooltip unit=" bilete" />} />
                    </PieChart>
                </ChartCard>

                <ChartCard title="Top Evenimente după Rezervări" icon={<CalendarDays size={18} />} isEmpty={!data.topEvenimente.length} emptyMsg="Nu există rezervări." height={240}>
                    <BarChart data={data.topEvenimente} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                        <YAxis dataKey="titlu" type="category" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={120} />
                        <Tooltip content={<CustomTooltip unit=" rezervări" />} cursor={{ fill: cursorFill }} />
                        <Bar dataKey="rezervari" name="Rezervări" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartCard>
            </div>

            {/* Lista recenziilor negative — ajută staff-ul să identifice rapid problemele */}
            <NegativeReviewsList reviews={data.recenziiNegative} />
        </div>
    );
}

// Raport Management (Director) — financiar: venituri lunare, status comenzi, top evenimente după venituri
function DirectorReport() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { theme } = useTheme();
    const cursorFill = theme === 'dark' ? 'rgba(196, 181, 253, 0.07)' : 'rgba(88, 28, 135, 0.1)';

    useEffect(() => {
        axios.get(`${API}/api/staff/museum-reports/director`, { withCredentials: true })
            .then(res => { if (res.data.success) setData(res.data.data); })
            .catch(err => setError(err.response?.data?.error || 'Eroare la încărcare.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="mr-loading"><RefreshCw size={24} className="mr-spin" /> Se generează raportul...</div>;
    if (error) return <div className="mr-error"><AlertCircle size={20} /> {error}</div>;
    if (!data) return null;

    // Transformăm datele pentru graficul Pie de status comenzi
    const pieStatusData = data.statusComenzi.map(s => ({ name: s.status, value: s.count }));

    return (
        <div className="mr-report-body">
            <div className="mr-kpi-grid">
                <KpiCard icon={<CreditCard size={22} />} label="Venituri Totale" value={`${data.kpi.totalVenituri.toFixed(0)} Lei`} sub="comenzi plătite" color="#10b981" />
                <KpiCard icon={<Ticket size={22} />} label="Bilete Vândute" value={data.kpi.totalBilete} sub="total bucăți" color="#3b82f6" />
                <KpiCard icon={<BarChart2 size={22} />} label="Total Comenzi" value={data.kpi.totalComenzi} sub="finalizate" color="#8b5cf6" />
                <KpiCard icon={<Star size={22} />} label="Rating Mediu" value={data.kpi.ratingMediu.toFixed(1) + ' ★'} sub={`din ${data.kpi.totalRecenzii} recenzii`} color="#f59e0b" />
            </div>

            <div className="mr-charts-grid">
                {/* Grafic dublu axă: venituri (stânga, Lei) și număr comenzi (dreapta) pe 12 luni */}
                <ChartCard title="Venituri & Comenzi Lunare (12 luni)" icon={<TrendingUp size={18} />} isEmpty={!data.venituriLunare.length} emptyMsg="Nu există date financiare." height={280} className="mr-chart-card--wide">
                    <BarChart data={data.venituriLunare} margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="luna" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={formatLuna} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v} Lei`} width={65} />
                        <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                        <Tooltip content={<RevenueTooltip />} cursor={{ fill: cursorFill }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="venituri" name="Venituri (Lei)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar yAxisId="right" dataKey="comenzi" name="Comenzi" fill="#c4b5fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ChartCard>

                <ChartCard title="Status Comenzi" icon={<PieChartIcon size={18} />} isEmpty={!pieStatusData.length} height={240}>
                    <PieChart>
                        <Pie data={pieStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {pieStatusData.map((entry, i) => (
                                <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieTooltip unit=" comenzi" />} />
                    </PieChart>
                </ChartCard>

                <ChartCard title="Top Evenimente după Venituri" icon={<CreditCard size={18} />} isEmpty={!data.topEvenimenteVenituri.length} height={240}>
                    <BarChart data={data.topEvenimenteVenituri} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                        <YAxis dataKey="titlu" type="category" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={120} />
                        <Tooltip content={<CustomTooltip unit=" Lei" />} cursor={{ fill: cursorFill }} />
                        <Bar dataKey="venituri" name="Venituri" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartCard>

                {/* Distribuție vizitatori după tipul cardului de fidelitate — comenzi + utilizatori unici */}
                <ChartCard title="Vizitatori după Tip Card" icon={<CardIcon size={18} />} isEmpty={!data.loyaltyDistributie.length} emptyMsg="Nu există date despre carduri." height={240}>
                    <BarChart data={data.loyaltyDistributie} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="numeCard" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="comenzi" name="Comenzi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="utilizatori" name="Utilizatori unici" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartCard>
            </div>

            <LoyaltyDistribution cards={data.loyaltyDistributie} />
        </div>
    );
}

// Pagina principală — gestionează tab-urile între Raport Marketing și Raport Management
export default function MuseumReports() {
    const [activeTab, setActiveTab] = useState('marketing');

    return (
        <div className="mr-page">
            <div className="mr-page-header">
                <div>
                    <h1 className="mr-page-title">Rapoarte Muzeu</h1>
                    <p className="mr-page-sub">Analiză detaliată pentru muzeul tău alocat</p>
                </div>
            </div>

            <div className="mr-tabs">
                <button className={`mr-tab ${activeTab === 'marketing' ? 'active' : ''}`} onClick={() => setActiveTab('marketing')}>
                    <BarChart2 size={18} /> Raport Marketing
                </button>
                <button className={`mr-tab ${activeTab === 'director' ? 'active' : ''}`} onClick={() => setActiveTab('director')}>
                    <TrendingUp size={18} /> Raport Management
                </button>
            </div>

            {activeTab === 'marketing' && <MarketingReport />}
            {activeTab === 'director' && <DirectorReport />}
        </div>
    );
}
