import React, { useState, useMemo } from 'react';
import whatsappIcon from '../../assets/whatsapp.svg';
import './AdminDashboard.css';

const CRM = ({ allBookings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'vip' | 'returning' | 'new'

    // --- AGGREGATE GUEST DATA ---
    const guestData = useMemo(() => {
        const guests = {};

        allBookings.forEach(booking => {
            const phone = booking.guests?.phone;
            if (!phone) return;

            const key = phone.trim();

            if (!guests[key]) {
                guests[key] = {
                    name: booking.guests?.full_name || 'Guest',
                    phone: key,
                    email: booking.guests?.email || '-',
                    visits: 0,
                    totalSpend: 0,
                    lastVisit: booking.check_in,
                    bookings: []
                };
            }

            const g = guests[key];
            g.visits += 1;
            g.totalSpend += (booking.total_price || 0);
            g.bookings.push(booking);

            if (new Date(booking.check_in) > new Date(g.lastVisit)) {
                g.lastVisit = booking.check_in;
            }
        });

        return Object.values(guests).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    }, [allBookings]);

    // --- METRICS ---
    const metrics = useMemo(() => {
        const totalGuests = guestData.length;
        const vipGuests = guestData.filter(g => g.visits >= 3).length;
        const repeatGuests = guestData.filter(g => g.visits >= 2).length;
        const newGuests = guestData.filter(g => g.visits === 1).length;
        const repeatRate = totalGuests ? Math.round((repeatGuests / totalGuests) * 100) : 0;
        const totalRevenue = guestData.reduce((sum, g) => sum + g.totalSpend, 0);
        const avgSpend = totalGuests ? Math.round(totalRevenue / totalGuests) : 0;
        const maxSpend = Math.max(...guestData.map(g => g.totalSpend), 1);

        return { totalGuests, vipGuests, repeatGuests, newGuests, repeatRate, avgSpend, totalRevenue, maxSpend };
    }, [guestData]);

    // --- FILTER BY SEARCH & TIER ---
    const filteredGuests = useMemo(() => {
        return guestData.filter(g => {
            // Tier match
            if (tierFilter === 'vip' && g.visits < 3) return false;
            if (tierFilter === 'returning' && g.visits !== 2) return false;
            if (tierFilter === 'new' && g.visits !== 1) return false;

            // Search match
            if (!searchTerm) return true;
            const lower = searchTerm.toLowerCase();
            return (
                g.name.toLowerCase().includes(lower) ||
                g.phone.includes(lower) ||
                g.email.toLowerCase().includes(lower)
            );
        });
    }, [guestData, searchTerm, tierFilter]);

    const handleSendOffer = (guest) => {
        const isVip = guest.visits >= 3;
        const isReturning = guest.visits >= 2;
        const salutation = isVip ? 'Our Esteemed VIP Patron' : isReturning ? 'Valued Returning Guest' : 'Dear Guest';
        const message = `Namaste ${guest.name} (${salutation}),\n\nGreetings from Bethany Homestay, Kalimpong! 🏡\n\nWe would love to welcome you back to the mountains. As a valued guest with ${guest.visits} prior stay${guest.visits > 1 ? 's' : ''}, we're delighted to extend an exclusive direct-booking privilege of 10% off on your next Himalayan retreat.\n\nExplore our suites & reserve directly here: ${window.location.origin}\n\nWarm regards,\nConcierge Desk, Bethany Homestay`;
        const url = `https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleBulkCampaign = () => {
        if (filteredGuests.length === 0) return alert('No guests match the current filter.');
        alert(`Launching campaign broadcast view for ${filteredGuests.length} ${tierFilter.toUpperCase()} guests.\n\nYou can message each guest directly using the 1-click WhatsApp buttons below!`);
    };

    const getDaysSince = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Upcoming';
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 30) return `${diff} days ago`;
        if (diff < 365) return `${Math.floor(diff / 30)} mo ago`;
        return `${Math.floor(diff / 365)} yr ago`;
    };

    return (
        <div className="crm-container">
            {/* Salesforce SLDS Highlights & Metric Cards Banner */}
            <div className="crm-metrics-header">
                <div className="stats-grid" style={{ padding: 0 }}>
                    <div className="stat-card" style={{ borderTopColor: '#23483B' }}>
                        <div className="stat-icon" style={{ background: '#EAE3D5', color: '#162E25' }}>👥</div>
                        <div className="stat-content">
                            <h3>Total Customer Reach</h3>
                            <div className="value">{metrics.totalGuests}</div>
                            <div className="subtitle">Verified guest contacts in CRM</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderTopColor: '#C5A059' }}>
                        <div className="stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>🔁</div>
                        <div className="stat-content">
                            <h3>Guest Loyalty Ratio</h3>
                            <div className="value">{metrics.repeatRate}%</div>
                            <div className="subtitle">{metrics.repeatGuests} repeat & VIP patrons</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderTopColor: '#15803D' }}>
                        <div className="stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>💎</div>
                        <div className="stat-content">
                            <h3>Avg. Lifetime Value (LTV)</h3>
                            <div className="value">₹{metrics.avgSpend.toLocaleString('en-IN')}</div>
                            <div className="subtitle">Average revenue per guest folio</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderTopColor: '#B86B42' }}>
                        <div className="stat-icon" style={{ background: '#F4EFE6', color: '#B86B42' }}>📈</div>
                        <div className="stat-content">
                            <h3>Total CRM Portfolio Spend</h3>
                            <div className="value">₹{metrics.totalRevenue.toLocaleString('en-IN')}</div>
                            <div className="subtitle">Cumulative direct booking GMV</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Salesforce Customer Database Console Panel */}
            <div className="card-panel" style={{ marginTop: '24px' }}>
                {/* Panel Header & Controls */}
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--slds-border-color)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>📇</span>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--himalaya-forest-dark)' }}>
                                Guest Portfolio & Relationship Records
                            </h3>
                            <span className="badge badge-booked" style={{ fontSize: '11px' }}>
                                {filteredGuests.length} Records
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--slds-text-secondary)' }}>
                            Salesforce Customer 360 · Track guest stays, lifetime value spend, and dispatch VIP WhatsApp privileges
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div className="slds-global-search" style={{ width: '280px', background: '#FFFFFF' }}>
                            <span>🔍</span>
                            <input
                                type="text"
                                placeholder="Search by name, phone, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8779', fontSize: '12px' }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Broadcast CTA */}
                        <button
                            onClick={handleBulkCampaign}
                            className="btn-primary"
                            title="Broadcast WhatsApp campaign to filtered guests"
                            style={{ background: 'var(--himalaya-forest)', border: 'none' }}
                        >
                            <span>📢</span> Campaign
                        </button>
                    </div>
                </div>

                {/* Salesforce List View Loyalty Segment Pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    <button
                        className={`slds-tier-pill ${tierFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTierFilter('all')}
                    >
                        <span>All Contacts</span>
                        <span className="count-chip">{metrics.totalGuests}</span>
                    </button>
                    <button
                        className={`slds-tier-pill ${tierFilter === 'vip' ? 'active' : ''}`}
                        onClick={() => setTierFilter('vip')}
                    >
                        <span>👑 VIP Patrons (3+ Stays)</span>
                        <span className="count-chip">{metrics.vipGuests}</span>
                    </button>
                    <button
                        className={`slds-tier-pill ${tierFilter === 'returning' ? 'active' : ''}`}
                        onClick={() => setTierFilter('returning')}
                    >
                        <span>🌿 Returning Guests (2 Stays)</span>
                        <span className="count-chip">{metrics.repeatGuests - metrics.vipGuests}</span>
                    </button>
                    <button
                        className={`slds-tier-pill ${tierFilter === 'new' ? 'active' : ''}`}
                        onClick={() => setTierFilter('new')}
                    >
                        <span>🌱 First-Time Guests (1 Stay)</span>
                        <span className="count-chip">{metrics.newGuests}</span>
                    </button>
                </div>

                {/* SLDS Customer Table */}
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '28%' }}>Guest Profile</th>
                                <th style={{ width: '22%' }}>Contact Channels</th>
                                <th style={{ width: '14%' }}>Frequency & Tier</th>
                                <th style={{ width: '16%' }}>Lifetime Spend</th>
                                <th style={{ width: '12%' }}>Last Stay Recency</th>
                                <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--slds-text-weak)' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--slds-text-primary)' }}>No customer profiles match criteria</div>
                                        <div style={{ fontSize: '12px' }}>Try adjusting your search query or switching segment filters above.</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredGuests.map((guest, index) => {
                                    const spendPercent = Math.min(100, Math.round((guest.totalSpend / metrics.maxSpend) * 100));
                                    const isVip = guest.visits >= 3;
                                    const isReturning = guest.visits === 2;

                                    return (
                                        <tr key={index} className="slds-customer-row">
                                            {/* Column 1: Guest Profile */}
                                            <td>
                                                <div className="guest-avatar-wrap">
                                                    <div
                                                        className="guest-avatar"
                                                        style={{
                                                            background: isVip ? 'var(--himalaya-forest-dark)' : isReturning ? 'var(--himalaya-forest-light)' : 'var(--himalaya-ivory-warm)',
                                                            color: (isVip || isReturning) ? 'var(--himalaya-ivory)' : 'var(--himalaya-forest)',
                                                            border: isVip ? '2px solid var(--himalaya-gold)' : '1px solid var(--slds-border-medium)',
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        {(guest.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--himalaya-forest-dark)' }}>
                                                            {guest.name}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: '800',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                                background: isVip ? '#FEF3C7' : isReturning ? '#DCFCE7' : '#F3F4F6',
                                                                color: isVip ? '#B45309' : isReturning ? '#15803D' : '#6B7280',
                                                                border: isVip ? '1px solid #FCD34D' : isReturning ? '1px solid #86EFAC' : '1px solid #E5E7EB'
                                                            }}>
                                                                {isVip ? '👑 VIP Patron' : isReturning ? '🌿 Returning Guest' : '🌱 New Contact'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Contact Info */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                    <a
                                                        href={`tel:${guest.phone}`}
                                                        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--himalaya-forest)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        title="Click to call guest"
                                                    >
                                                        <span>📞</span> {guest.phone}
                                                    </a>
                                                    <span style={{ fontSize: '11px', color: 'var(--slds-text-weak)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <span>✉️</span> {guest.email}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 3: Frequency & Tier */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{
                                                        fontWeight: '700',
                                                        fontSize: '12px',
                                                        color: isVip ? '#B45309' : isReturning ? '#15803D' : '#475569',
                                                        background: isVip ? '#FEF3C7' : isReturning ? '#DCFCE7' : '#F1F5F9',
                                                        padding: '3px 10px',
                                                        borderRadius: '12px',
                                                        display: 'inline-block',
                                                        width: 'fit-content'
                                                    }}>
                                                        {guest.visits} {guest.visits === 1 ? 'Stay' : 'Stays'}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                                                        {Array.from({ length: Math.min(5, guest.visits) }).map((_, i) => (
                                                            <span key={i} style={{ color: isVip ? '#F59E0B' : '#10B981', fontSize: '11px' }}>★</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 4: Total Spend & Meter */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: '700', color: 'var(--himalaya-forest-dark)' }}>
                                                        ₹{guest.totalSpend.toLocaleString('en-IN')}
                                                    </div>
                                                    <div style={{ width: '100px', height: '5px', background: 'var(--slds-border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                width: `${Math.max(10, spendPercent)}%`,
                                                                height: '100%',
                                                                background: isVip ? 'var(--himalaya-gold)' : 'var(--himalaya-forest)',
                                                                borderRadius: '3px'
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ fontSize: '10px', color: 'var(--slds-text-weak)' }}>
                                                        Portfolio LTV
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 5: Last Stay Recency */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slds-text-primary)' }}>
                                                        {new Date(guest.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--slds-text-weak)' }}>
                                                        {getDaysSince(guest.lastVisit)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 6: Direct WhatsApp Action */}
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleSendOffer(guest)}
                                                    title={`Send personalized 10% privilege offer to ${guest.name} via WhatsApp`}
                                                    className="action-btn wa"
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: 'var(--slds-radius-sm)',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <img src={whatsappIcon} alt="WhatsApp" style={{ width: '14px', height: '14px' }} />
                                                    <span>Offer</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CRM;
