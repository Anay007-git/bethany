import React, { useState, useMemo } from 'react';
import whatsappIcon from '../../assets/whatsapp.svg';
import './AdminDashboard.css';

const CRM = ({ allBookings }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // --- AGGREGATE GUEST DATA ---
    const guestData = useMemo(() => {
        const guests = {};

        allBookings.forEach(booking => {
            const phone = booking.guests?.phone;
            if (!phone) return;

            // Normalize phone (remove spaces, etc. if needed, but assuming simple str for now)
            const key = phone.trim();

            if (!guests[key]) {
                guests[key] = {
                    name: booking.guests?.full_name || 'Unknown',
                    phone: key,
                    email: booking.guests?.email || '-',
                    visits: 0,
                    totalSpend: 0,
                    lastVisit: booking.check_in, // ISO string
                    bookings: []
                };
            }

            const g = guests[key];
            g.visits += 1;
            g.totalSpend += (booking.total_price || 0);
            g.bookings.push(booking);

            // Update last visit if this booking is more recent
            if (new Date(booking.check_in) > new Date(g.lastVisit)) {
                g.lastVisit = booking.check_in;
            }
        });

        // Convert object to array and sort by most recent visit
        return Object.values(guests).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    }, [allBookings]);

    // --- FILTER ---
    const filteredGuests = useMemo(() => {
        if (!searchTerm) return guestData;
        const lowerTerm = searchTerm.toLowerCase();
        return guestData.filter(g =>
            g.name.toLowerCase().includes(lowerTerm) ||
            g.phone.includes(lowerTerm) ||
            g.email.toLowerCase().includes(lowerTerm)
        );
    }, [guestData, searchTerm]);

    // --- METRICS ---
    const metrics = useMemo(() => {
        const totalGuests = guestData.length;
        const repeatGuests = guestData.filter(g => g.visits > 1).length;
        const repeatRate = totalGuests ? Math.round((repeatGuests / totalGuests) * 100) : 0;

        const totalRevenue = guestData.reduce((sum, g) => sum + g.totalSpend, 0);
        const avgSpend = totalGuests ? Math.round(totalRevenue / totalGuests) : 0;

        return { totalGuests, repeatGuests, repeatRate, avgSpend, totalRevenue };
    }, [guestData]);

    const handleSendOffer = (guest) => {
        const message = `Namaste ${guest.name}, \n\nWe sort of haven't seen you in a while! 🏡 \nWe have some special offers for you at Bethany Homestay. \n\nCheck them out here: ${window.location.origin} \n\nHope to host you again soon!`;
        const url = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="crm-container">
            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>👥</div>
                    <div className="stat-content">
                        <h3>Total Customers</h3>
                        <div className="value">{metrics.totalGuests}</div>
                        <div className="subtitle">Unique phone numbers</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>🔁</div>
                    <div className="stat-content">
                        <h3>Repeat Guests</h3>
                        <div className="value">{metrics.repeatRate}%</div>
                        <div className="subtitle">{metrics.repeatGuests} returning customers</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>💎</div>
                    <div className="stat-content">
                        <h3>Avg. Lifetime Value</h3>
                        <div className="value">₹{metrics.avgSpend.toLocaleString('en-IN')}</div>
                        <div className="subtitle">Per customer average</div>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="card-panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Customer Database</h3>
                    <div className="filter-bar" style={{ padding: '8px 16px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search name, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.9rem', width: '200px' }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Contact Info</th>
                                <th>Total Visits</th>
                                <th>Total Spend</th>
                                <th>Last Visit</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredGuests.map((guest, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{guest.name}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.85rem' }}>📞 {guest.phone}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>📧 {guest.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: '600',
                                                color: guest.visits > 1 ? '#166534' : '#64748b',
                                                background: guest.visits > 1 ? '#dcfce7' : 'transparent',
                                                padding: '2px 8px',
                                                borderRadius: '12px'
                                            }}>
                                                {guest.visits} stays
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '600' }}>₹{guest.totalSpend.toLocaleString('en-IN')}</td>
                                        <td style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            {new Date(guest.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleSendOffer(guest)}
                                                title="Send Marketing Offer via WhatsApp"
                                                style={{ color: '#10b981', borderColor: '#10b981' }}
                                            >
                                                <img src={whatsappIcon} alt="WhatsApp" style={{ width: '16px', height: '16px', marginRight: '5px' }} />
                                                Offer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CRM;
