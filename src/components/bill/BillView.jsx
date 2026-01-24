import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SupabaseService } from '../../services/SupabaseService';
import titleBarImg from '../../assets/title-bar.jpeg';

const BillView = () => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadBill();
    }, [bookingId]);

    const loadBill = async () => {
        if (!bookingId) return;
        setLoading(true);
        const result = await SupabaseService.getBookingById(bookingId);
        if (result.success) {
            setBooking(result.data);
        } else {
            setError('Bill not found or error loading details.');
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Bill...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;
    if (!booking) return null;

    // --- Helpers ---
    const getSeasonalRoomPrice = (roomPrice) => {
        // Since we don't have historical price data, we rely on the total price.
        // However, for itemization, we might need to approximate or display the aggregate if unavailable.
        // For simplicity in this version, we will list the room types and the total amount.
        return roomPrice;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    // Calculate nights
    const start = new Date(booking.check_in);
    const end = new Date(booking.check_out);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    return (
        <div className="bill-container" style={{
            maxWidth: '800px',
            margin: '2rem auto',
            background: 'white',
            padding: '40px',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
            minHeight: '100vh',
            color: '#333',
            fontFamily: 'Helvetica, Arial, sans-serif'
        }}>
            {/* Print Button - Hidden when printing */}
            <div className="no-print" style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🖨️ Print Bill
                </button>
            </div>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <img src={titleBarImg} alt="Bethany Homestay" style={{ height: '80px', objectFit: 'contain' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h1 style={{ margin: '0 0 5px 0', color: '#166534', fontSize: '24px' }}>NAMASTE HILLS</h1>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'normal' }}>Bethany Homestay</h2>
                    <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
                        Dr. Graham's Homes, Block 'B'<br />
                        Kalimpong-I, Thapatar Para<br />
                        P.O Topkhana, P.S Kalimpong<br />
                        PIN - 734316
                    </div>
                </div>
            </header>

            {/* Invoice Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888', textTransform: 'uppercase' }}>Bill To:</h3>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{booking.guests?.full_name}</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>{booking.guests?.phone}</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>{booking.guests?.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Invoice #: </span>
                        INV-{booking.id.toString().slice(0, 8).toUpperCase()}
                    </div>
                    <div>
                        <span style={{ fontWeight: 'bold' }}>Date: </span>
                        {formatDate(new Date())}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        Status: <span style={{
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            color: booking.status === 'confirmed' || booking.status === 'booked' ? '#166534' : '#ca8a04'
                        }}>{booking.status}</span>
                    </div>
                </div>
            </div>

            {/* Booking Details Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#444' }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: '#444' }}>Details / Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#555' }}>
                            <strong>Room(s)</strong><br />
                            <span style={{ fontSize: '12px', color: '#777' }}>
                                {(booking.room_ids || []).map(r => r.name).join(', ')}
                            </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>
                            {/* We don't have individual room prices saved in history, so we show aggregate in total */}
                            -
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#555' }}>
                            <strong>Stay Duration</strong><br />
                            <span style={{ fontSize: '12px', color: '#777' }}>
                                Check In: {formatDate(booking.check_in)}<br />
                                Check Out: {formatDate(booking.check_out)}
                            </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>
                            {nights} Night{nights > 1 ? 's' : ''}
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#555' }}>
                            <strong>Guests</strong>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>
                            {booking.guests_count} Person{booking.guests_count > 1 ? 's' : ''}
                        </td>
                    </tr>
                    {booking.meal_preferences && (
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', color: '#555' }}>
                                <strong>Meals</strong><br />
                                <span style={{ fontSize: '12px', color: '#777' }}>
                                    {booking.meal_preferences.split('|').map((m, i) => <div key={i}>{m.trim()}</div>)}
                                </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>
                                {/* Included in total */}
                                -
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Total Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <div style={{ width: '250px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '15px 0',
                        borderTop: '2px solid #333',
                        borderBottom: '2px solid #333',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        <span>Total Amount</span>
                        <span style={{ color: '#166534' }}>₹{booking.total_price.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={{ marginTop: '60px', textAlign: 'center', color: '#888', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '10px' }}>Thank you for choosing Namaste Hills Bethany Homestay!</p>
                <p>For any queries, please contact us at +91 97759 69371</p>
            </footer>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .bill-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
};

export default BillView;
