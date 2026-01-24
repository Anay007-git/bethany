import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { SupabaseService } from '../../services/SupabaseService';
import titleBarImg from '../../assets/title-bar.jpeg';

const BillView = () => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [invoice, setInvoice] = useState(null);
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
            // Check if invoices array exists and has data
            if (result.data.invoices && result.data.invoices.length > 0) {
                // Get the most recent invoice
                setInvoice(result.data.invoices[result.data.invoices.length - 1]);
            }
        } else {
            setError('Bill not found or error loading details.');
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Bill...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;
    if (!booking) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    // Use invoice items if available, otherwise fallback to basic items
    const lineItems = invoice ? invoice.items : [];
    const invNumber = invoice ? invoice.invoice_number : `INV-${booking.id.toString().slice(0, 8).toUpperCase()}`;
    const invDate = invoice ? invoice.issue_date : new Date().toISOString();

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
            <div className="invoice-info-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888', textTransform: 'uppercase' }}>Bill To:</h3>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{booking.guests?.full_name}</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>{booking.guests?.phone}</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>{booking.guests?.email}</div>

                    <div style={{ marginTop: '15px', fontSize: '13px', color: '#555' }}>
                        <strong>Check In:</strong> {formatDate(booking.check_in)}<br />
                        <strong>Check Out:</strong> {formatDate(booking.check_out)}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Invoice #: </span>
                        {invNumber}
                    </div>
                    <div>
                        <span style={{ fontWeight: 'bold' }}>Date: </span>
                        {formatDate(invDate)}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        Status: <span style={{
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            color: booking.status === 'confirmed' || booking.status === 'booked' ? '#166534' : '#ca8a04'
                        }}>{booking.status}</span>
                    </div>

                    {/* Barcode - Invoice Number */}
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ background: 'white' }}>
                            <Barcode
                                value={invNumber}
                                width={1.5}
                                height={40}
                                fontSize={12}
                                displayValue={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown Table */}
            <div className="table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', minWidth: '500px' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#444' }}>Description</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: '#444' }}>Qty</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#444' }}>Unit Price</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#444' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Render Line Items from Invoice Record if available */}
                        {lineItems.length > 0 ? (
                            lineItems.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#555' }}>{item.description}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>₹{item.unit_price}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontWeight: '500' }}>₹{item.total}</td>
                                </tr>
                            ))
                        ) : (
                            // Fallback logic for old bookings matching previous UI
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', color: '#555' }}>Legacy Booking (Details not itemized)</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#555' }}>1</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>-</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#333' }}>₹{booking.total_price}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
                <p style={{ fontSize: '10px', marginTop: '10px' }}>This is a computer generated invoice.</p>
            </footer>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .bill-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 20px !important; }
                    body { background: white !important; }
                }
                @media (max-width: 768px) {
                    .bill-container {
                        width: 95% !important;
                        margin: 10px auto !important;
                        padding: 15px !important;
                    }
                    header {
                        flex-direction: column;
                        text-align: center;
                        gap: 15px;
                    }
                    header > div { text-align: center !important; }
                    
                    /* Stack the Invoice Info section */
                    .invoice-info-container {
                        flex-direction: column;
                        gap: 20px;
                    }
                    .invoice-info-container > div {
                        text-align: left !important;
                    }
                    
                    /* Table Scroll */
                    .table-wrapper {
                        overflow-x: auto;
                    }
                    th, td {
                        padding: 8px !important;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default BillView;
