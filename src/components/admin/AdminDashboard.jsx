import { useState, useEffect } from 'react';
import { SupabaseService } from '../../services/SupabaseService';

const AdminDashboard = ({ onLogout }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const data = await SupabaseService.getDashboardStats();
        setStats(data);
        setLoading(false);
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus.toUpperCase()}?`)) return;

        const result = await SupabaseService.updateBookingStatus(bookingId, newStatus);
        if (result.success) {
            // Optimistic update or reload
            loadStats();
        } else {
            alert('Failed to update status. Check console.');
        }
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Dashboard...</div>;
    if (!stats) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>Failed to load stats. Check Supabase connection.</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#2c3e50' }}>Admin Dashboard</h1>
                    <p style={{ margin: '5px 0 0', color: '#7f8c8d' }}>Namaste Hills Admin Panel</p>
                </div>
                <button
                    onClick={onLogout}
                    style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Logout
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon="💰" color="#2ecc71" />
                <StatCard title="Total Bookings" value={stats.totalBookings} icon="📅" color="#3498db" />
                <StatCard title="Pending Requests" value={stats.pendingBookings} icon="⏳" color="#f39c12" />
            </div>

            {/* Recent Bookings Table */}
            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Recent Bookings</h3>
                    <button onClick={loadStats} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>↻ Refresh</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f1f2f6', color: '#2c3e50', textAlign: 'left' }}>
                                <th style={{ padding: '12px 15px' }}>Booking Date</th>
                                <th style={{ padding: '12px 15px' }}>Check In</th>
                                <th style={{ padding: '12px 15px' }}>Check Out</th>
                                <th style={{ padding: '12px 15px' }}>Guest Details</th>
                                <th style={{ padding: '12px 15px' }}>Rooms & Meals</th>
                                <th style={{ padding: '12px 15px' }}>Price</th>
                                <th style={{ padding: '12px 15px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentBookings.map(booking => (
                                <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px 15px', fontSize: '0.85rem', color: '#7f8c8d' }}>
                                        {new Date(booking.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#2980b9' }}>
                                        {new Date(booking.check_in).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#c0392b' }}>
                                        {new Date(booking.check_out).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{booking.guests?.full_name || 'Guest Details Missing'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{booking.guests?.email}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{booking.guests?.phone}</div>
                                    </td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <div><strong>Rooms:</strong> {(booking.room_ids || []).map(r => r.name).join(', ')}</div>
                                        {booking.meal_preferences && (
                                            <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#e67e22' }}>
                                                <strong>🍽️ Meals:</strong> {booking.meal_preferences}
                                            </div>
                                        )}
                                        {booking.special_requests && (
                                            <div style={{ marginTop: '5px', fontSize: '0.8rem', fontStyle: 'italic', color: '#7f8c8d' }}>
                                                "{booking.special_requests}"
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>₹{booking.total_price.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <select
                                            value={booking.status}
                                            onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.8rem',
                                                background: booking.status === 'confirmed' || booking.status === 'booked' ? '#d5f5e3' : (booking.status === 'pending' ? '#fdebd0' : '#fadbd8'),
                                                color: booking.status === 'confirmed' || booking.status === 'booked' ? '#27ae60' : (booking.status === 'pending' ? '#e67e22' : '#c0392b'),
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="pending">PENDING</option>
                                            <option value="booked">BOOKED</option>
                                            <option value="confirmed">CONFIRMED</option>
                                            <option value="cancelled">CANCELLED</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: `4px solid ${color}` }}>
        <div style={{ fontSize: '2rem', background: '#f8f9fa', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            {icon}
        </div>
        <div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '5px' }}>{title}</div>
            <div style={{ color: '#2c3e50', fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

export default AdminDashboard;
