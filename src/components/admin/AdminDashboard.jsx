import { useState, useEffect, useMemo } from 'react';
import { SupabaseService } from '../../services/SupabaseService';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const stats = await SupabaseService.getDashboardStats();
        if (stats && stats.recentBookings) setAllBookings(stats.recentBookings);
        setLoading(false);
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        if (!window.confirm(`Change status to ${newStatus.toUpperCase()}?`)) return;
        const result = await SupabaseService.updateBookingStatus(bookingId, newStatus);
        if (result.success) loadData();
        else alert('Update failed');
    };

    // Filter Logic
    const filteredBookings = useMemo(() => {
        return allBookings.filter(b => {
            const checkIn = b.check_in.split('T')[0];
            return checkIn >= dateRange.start && checkIn <= dateRange.end;
        });
    }, [allBookings, dateRange]);

    // Metrics Logic
    const metrics = useMemo(() => {
        const confirmed = filteredBookings.filter(b => ['booked', 'confirmed'].includes(b.status.toLowerCase()));
        return {
            revenue: confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0),
            bookings: confirmed.length,
            totalRequests: filteredBookings.length,
            pending: filteredBookings.filter(b => b.status === 'pending').length
        };
    }, [filteredBookings]);

    // Graph Logic
    const monthlyData = useMemo(() => {
        const monthMap = {};
        allBookings.forEach(b => {
            if (['booked', 'confirmed'].includes(b.status.toLowerCase())) {
                const date = new Date(b.check_in);
                const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                monthMap[key] = (monthMap[key] || 0) + (b.total_price || 0);
            }
        });
        return Object.entries(monthMap).map(([label, value]) => ({ label, value }));
        // Note: Real sorting would require date objects, for now simple object order is usually chaotic but sufficient for MVP or can be improved later
    }, [allBookings]);

    const exportCSV = () => {
        const headers = ["Booking Date", "Check In", "Check Out", "Guest Name", "Phone", "Rooms", "Amount", "Status"];
        const rows = filteredBookings.map(b => [
            b.created_at.split('T')[0],
            b.check_in,
            b.check_out,
            `"${b.guests?.full_name || 'N/A'}"`,
            `"${b.guests?.phone || 'N/A'}"`,
            `"${(b.room_ids || []).map(r => r.name).join(', ')}"`,
            b.total_price,
            b.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `bethany_bookings_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="loading-state">Loading Analytics...</div>;

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-title">
                    <h1>Dashboard & Analytics</h1>
                    <p>Welcome back, Admin</p>
                </div>
                <div className="admin-controls">
                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Filter:</span>
                    <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="date-input" />
                    <span style={{ color: '#cbd5e1' }}>—</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="date-input" />

                    <button onClick={exportCSV} className="btn-primary">
                        <span>📥</span> Export CSV
                    </button>
                    <button onClick={onLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
                <StatCard title="Confirmed Revenue" value={`₹${metrics.revenue.toLocaleString('en-IN')}`} icon="💰" color="#10b981" subtitle="In selected range" />
                <StatCard title="Confirmed Bookings" value={metrics.bookings} icon="✅" color="#3b82f6" subtitle="Validated stays" />
                <StatCard title="Pending Review" value={metrics.pending} icon="⏳" color="#f59e0b" subtitle="Action needed" />
                <StatCard title="Total Enquiries" value={metrics.totalRequests} icon="📊" color="#8b5cf6" subtitle="All requests" />
            </div>

            <div className="dashboard-layout">
                {/* Graph */}
                <div className="card-panel">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#1e293b' }}>Revenue Trends</h3>
                    <div className="chart-container">
                        {monthlyData.length === 0 && <p style={{ color: '#94a3b8', width: '100%', textAlign: 'center' }}>No revenue data available.</p>}
                        {monthlyData.map((d, i) => {
                            const maxVal = Math.max(...monthlyData.map(md => md.value)) || 1;
                            const heightPct = (d.value / maxVal) * 100;
                            return (
                                <div key={i} className="chart-bar-group">
                                    <span className="chart-tooltip">₹{d.value.toLocaleString()}</span>
                                    <div className="chart-bar" style={{ height: `${Math.max(heightPct, 5)}%` }}></div>
                                    <span className="chart-label">{d.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="card-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>Recent Bookings</h3>
                        <button onClick={loadData} className="btn-refresh">↻ Refresh</button>
                    </div>
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Guest</th>
                                    <th>Details</th>
                                    <th>Rooms & Meals</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No bookings found.</td></tr>
                                ) : (
                                    filteredBookings.map(booking => (
                                        <tr key={booking.id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(booking.check_in).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to {new Date(booking.check_out).toLocaleDateString()}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{booking.guests?.full_name || 'N/A'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{booking.guests?.phone}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Booked: {new Date(booking.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500', color: '#334155' }}>{(booking.room_ids || []).map(r => r.name).join(', ')}</div>
                                                {booking.meal_preferences && <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '4px' }}>🍽️ {booking.meal_preferences}</div>}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700', color: '#059669' }}>₹{booking.total_price.toLocaleString('en-IN')}</div>
                                            </td>
                                            <td>
                                                <select
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                    className="status-select"
                                                    style={getStatusStyle(booking.status)}
                                                >
                                                    <option value="pending">PENDING</option>
                                                    <option value="booked">BOOKED</option>
                                                    <option value="confirmed">CONFIRMED</option>
                                                    <option value="cancelled">CANCELLED</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Utilities
const getStatusStyle = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'booked':
        case 'confirmed': return { background: '#d1fae5', color: '#059669' }; // Green
        case 'cancelled': return { background: '#fee2e2', color: '#dc2626' }; // Red
        case 'pending': return { background: '#ffedd5', color: '#ea580c' }; // Orange
        default: return { background: '#f1f5f9', color: '#64748b' }; // Gray
    }
};

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ background: `${color}15`, color: color }}>
            {icon}
        </div>
        <div className="stat-content">
            <h3>{title}</h3>
            <div className="value">{value}</div>
            <div className="subtitle">{subtitle}</div>
        </div>
    </div>
);

export default AdminDashboard;
