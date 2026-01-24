import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService } from '../../services/SupabaseService';
import '../admin/AdminDashboard.css'; // Reuse existing styles for consistency

const BillSearch = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookings, setBookings] = useState([]);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setBookings([]);

        if (!phone || phone.length < 10) {
            setError('Please enter a valid phone number');
            setLoading(false);
            return;
        }

        const result = await SupabaseService.getBookingsByPhone(phone);
        setLoading(false);

        if (result.success) {
            if (result.data.length === 0) {
                setError('No bookings found for this number.');
            } else if (result.data.length === 1) {
                // Direct redirect if only one booking
                navigate(`/bill/${result.data[0].id}`);
            } else {
                // Show list if multiple
                setBookings(result.data);
            }
        } else {
            setError('Failed to fetch bookings. Please try again.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '1.5rem' }}>View Your Bill</h2>

                <form onSubmit={handleSearch}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                            Registered Mobile Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="form-input"
                            style={{ width: '100%' }}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Find Bill'}
                    </button>
                </form>

                {bookings.length > 0 && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', color: '#334155', marginBottom: '1rem' }}>Select Booking</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {bookings.map(book => (
                                <button
                                    key={book.id}
                                    onClick={() => navigate(`/bill/${book.id}`)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '10px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                        {new Date(book.check_in).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        Amount: ₹{book.total_price}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillSearch;
