
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AdminDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, occupancy: 0, totalBookings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setBookings(data);
            calculateStats(data);
        } catch (error) {
            console.error('Admin fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalRevenue = data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        const totalBookings = data.length;

        // Simple Occupancy (Bookings this month / 30) - Very rough approx for demo
        const thisMonthBookings = data.filter(b => new Date(b.check_in).getMonth() === new Date().getMonth());
        const occupancy = (thisMonthBookings.length / 30) * 100; // Mock calculation

        setStats({
            revenue: totalRevenue,
            occupancy: Math.min(occupancy, 100).toFixed(1),
            totalBookings
        });
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Dashboard...</div>;

    return (
        <div className="admin-dashboard" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>📊 Host Dashboard</h1>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={cardStyle}>
                    <h3>Total Revenue</h3>
                    <p style={statStyle}>₹{stats.revenue.toLocaleString()}</p>
                </div>
                <div style={cardStyle}>
                    <h3>Occupancy Rate (Month)</h3>
                    <p style={statStyle}>{stats.occupancy}%</p>
                </div>
                <div style={cardStyle}>
                    <h3>Total Bookings</h3>
                    <p style={statStyle}>{stats.totalBookings}</p>
                </div>
            </div>

            {/* Booking List */}
            <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Recent Bookings</h2>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={thStyle}>Guest</th>
                            <th style={thStyle}>Room</th>
                            <th style={thStyle}>Dates</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(booking => (
                            <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}>{booking.guest_count} Guests</td>
                                <td style={tdStyle}>{booking.room_id}</td>
                                <td style={tdStyle}>{booking.check_in} - {booking.check_out}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        background: booking.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                                        color: booking.status === 'confirmed' ? '#155724' : '#856404'
                                    }}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td style={tdStyle}>₹{booking.total_amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const cardStyle = {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #eee'
};

const statStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: '10px'
};

const thStyle = { padding: '15px', textAlign: 'left', fontSize: '0.9rem', color: '#7f8c8d' };
const tdStyle = { padding: '15px', fontSize: '0.9rem', color: '#2c3e50' };

export default AdminDashboard;
