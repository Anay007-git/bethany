import React, { useState, useEffect, useMemo } from 'react';
import { SupabaseService } from '../../services/SupabaseService';
import titleBarImg from '../../assets/title-bar.jpeg';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [rooms, setRooms] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    // Offline Booking Form State
    const [offlineForm, setOfflineForm] = useState({
        name: '', phone: '', email: 'offline@bethany.com',
        checkIn: '', checkOut: '', room: '', guests: 1, price: 0,
        mealSelection: {
            breakfast: { veg: 0, nonVeg: 0 },
            lunch: { veg: 0, nonVeg: 0 },
            dinner: { veg: 0, nonVeg: 0 }
        }
    });

    const MEAL_PRICES = { breakfast: 120, lunch: 200, dinner: 200 };

    // State for OTA blocked dates per room
    const [blockedDates, setBlockedDates] = useState({});

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const stats = await SupabaseService.getDashboardStats();
        if (stats && stats.recentBookings) setAllBookings(stats.recentBookings);

        const roomsData = await SupabaseService.getRooms();
        if (roomsData) {
            setRooms(roomsData);

            // Load blocked dates from Supabase
            const blockedResult = await SupabaseService.getBlockedDates();
            if (blockedResult.success && blockedResult.data) {
                const blocked = {};
                blockedResult.data.forEach(row => {
                    if (!blocked[row.room_id]) blocked[row.room_id] = [];
                    blocked[row.room_id].push({ start: row.blocked_date });
                });
                setBlockedDates(blocked);
            }
        }

        setLoading(false);
    };

    // --- Helpers for Offline Booking Logic ---

    const isHighSeason = (date) => {
        const month = date.getMonth();
        const day = date.getDate();
        if (month === 11 || month === 0) return true; // Dec, Jan
        if (month === 2) return true; // Mar
        if (month === 3 && day <= 15) return true; // Apr 1-15
        if (month === 9) return true; // Oct
        if (month === 10 && day <= 7) return true; // Nov 1-7
        return false;
    };

    const getSeasonalRoomPrice = (date, roomId) => {
        const highSeason = isHighSeason(date);
        const room = rooms.find(r => r.id === roomId);
        if (!room) return 0;
        return highSeason ? room.price_high_season : room.price_low_season;
    };

    // Check availability against allBookings AND external iCal blocked dates
    const isRoomAvailable = (roomId, startStr, endStr) => {
        if (!roomId || !startStr || !endStr) return true;

        const checkIn = new Date(startStr); checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(endStr); checkOut.setHours(0, 0, 0, 0);

        // Check internal bookings
        const hasInternalConflict = allBookings.some(b => {
            if (!['booked', 'confirmed', 'pending'].includes(b.status.toLowerCase())) return false;
            const rIds = b.room_ids || [];
            const hasRoom = rIds.some(r => r.id === roomId);
            if (!hasRoom) return false;
            const bStart = new Date(b.check_in); bStart.setHours(0, 0, 0, 0);
            const bEnd = new Date(b.check_out); bEnd.setHours(0, 0, 0, 0);
            return checkIn < bEnd && checkOut > bStart;
        });

        if (hasInternalConflict) return false;

        // Check external iCal blocked dates (from Supabase state)
        const roomBlockedDates = blockedDates[roomId] || [];
        for (const block of roomBlockedDates) {
            const blockStart = new Date(block.start); blockStart.setHours(0, 0, 0, 0);
            const blockEnd = new Date(block.start);
            blockEnd.setDate(blockEnd.getDate() + 1);
            blockEnd.setHours(0, 0, 0, 0);
            if (checkIn < blockEnd && checkOut > blockStart) {
                return false; // Conflict with OTA booking
            }
        }

        return true;
    };

    // Auto-Calculate Price Effect
    useEffect(() => {
        if (offlineForm.checkIn && offlineForm.checkOut && offlineForm.room) {
            const start = new Date(offlineForm.checkIn);
            const end = new Date(offlineForm.checkOut);

            if (end <= start) return;

            const diffTime = end - start;
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let total = 0;
            const ms = offlineForm.mealSelection;

            // Helper to safely get number or 0
            const getCount = (val) => {
                const num = parseInt(val, 10);
                return isNaN(num) ? 0 : num;
            };

            const prices = MEAL_PRICES || { breakfast: 0, lunch: 0, dinner: 0 };

            const dailyMealCost =
                (getCount(ms.breakfast?.veg) + getCount(ms.breakfast?.nonVeg)) * prices.breakfast +
                (getCount(ms.lunch?.veg) + getCount(ms.lunch?.nonVeg)) * prices.lunch +
                (getCount(ms.dinner?.veg) + getCount(ms.dinner?.nonVeg)) * prices.dinner;

            for (let i = 0; i < nights; i++) {
                let d = new Date(start);
                d.setDate(start.getDate() + i);

                const roomPrice = Number(getSeasonalRoomPrice(d, offlineForm.room)) || 0;
                total += roomPrice;
                total += dailyMealCost;
            }

            setOfflineForm(prev => ({ ...prev, price: total }));
        }
    }, [offlineForm.checkIn, offlineForm.checkOut, offlineForm.room, offlineForm.mealSelection, rooms]);

    const handleStatusChange = async (bookingId, newStatus) => {
        if (!window.confirm(`Change status to ${newStatus.toUpperCase()}?`)) return;
        const result = await SupabaseService.updateBookingStatus(bookingId, newStatus);
        if (result.success) loadData();
        else alert('Update failed');
    };

    const handleOfflineSubmit = async (e) => {
        e.preventDefault();
        if (!offlineForm.room) return alert('Select a room');

        const selectedRoomObj = rooms.find(r => r.id === offlineForm.room);

        // Format Meals String
        const ms = offlineForm.mealSelection;
        const formatMeal = (name, data) => {
            const parts = [];
            if (data.veg > 0) parts.push(`${data.veg} Veg`);
            if (data.nonVeg > 0) parts.push(`${data.nonVeg} Non-Veg`);
            return parts.length > 0 ? `${name}: ${parts.join(', ')}` : null;
        };
        const selectedMeals = [
            formatMeal('Breakfast', ms.breakfast),
            formatMeal('Lunch', ms.lunch),
            formatMeal('Dinner', ms.dinner)
        ].filter(Boolean);

        const mealString = selectedMeals.length > 0 ? selectedMeals.join(' | ') : 'No Meals Selected';

        // --- INVOICE ITEMS CALCULATION ---
        const invoiceItems = [];
        const start = new Date(offlineForm.checkIn);
        const end = new Date(offlineForm.checkOut);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // Room line item
        if (selectedRoomObj && nights > 0) {
            let roomTotal = 0;
            for (let i = 0; i < nights; i++) {
                let d = new Date(start);
                d.setDate(start.getDate() + i);
                roomTotal += getSeasonalRoomPrice(d, selectedRoomObj.id);
            }
            invoiceItems.push({
                description: `${selectedRoomObj.name} (${nights} Nights)`,
                quantity: 1,
                unit_price: roomTotal,
                total: roomTotal
            });
        }

        // Meal line items
        const mealTypes = [
            { id: 'breakfast', label: 'Breakfast', price: MEAL_PRICES.breakfast },
            { id: 'lunch', label: 'Lunch', price: MEAL_PRICES.lunch },
            { id: 'dinner', label: 'Dinner', price: MEAL_PRICES.dinner }
        ];
        mealTypes.forEach(mt => {
            const count = (parseInt(ms[mt.id]?.veg) || 0) + (parseInt(ms[mt.id]?.nonVeg) || 0);
            if (count > 0) {
                const totalPlates = count * nights;
                const totalCost = totalPlates * mt.price;
                invoiceItems.push({
                    description: `${mt.label} Charges (${count} plates/day)`,
                    quantity: totalPlates,
                    unit_price: mt.price,
                    total: totalCost
                });
            }
        });

        const bookingData = {
            name: offlineForm.name,
            phone: offlineForm.phone,
            email: offlineForm.email,
            checkIn: offlineForm.checkIn,
            checkOut: offlineForm.checkOut,
            guests: offlineForm.guests,
            totalPrice: offlineForm.price,
            selectedRooms: [selectedRoomObj],
            meals: mealString,
            message: 'Manual Booking by Admin',
            source: 'offline',
            invoiceItems: invoiceItems // <--- Pass invoice breakdown
        };

        const result = await SupabaseService.createBooking(bookingData);
        if (result.success) {
            alert('Offline Booking Created Successfully!');

            // --- GENERATE HTML BILL LINK ---
            // Construct Link
            const baseUrl = window.location.origin;
            const billUrl = `${baseUrl}/bill/${result.booking.id}`;

            // Create WhatsApp Link
            const waLink = `https://wa.me/${offlineForm.phone}?text=${encodeURIComponent(`Namaste ${offlineForm.name}, \n\nCheck out your invoice from Bethany Homestay: ${billUrl} \n\nThank you!`)}`;

            // Open WhatsApp
            window.open(waLink, '_blank');

            setOfflineForm({
                name: '', phone: '', email: 'offline@bethany.com',
                checkIn: '', checkOut: '', room: '', guests: 1, price: 0,
                mealSelection: { breakfast: { veg: 0, nonVeg: 0 }, lunch: { veg: 0, nonVeg: 0 }, dinner: { veg: 0, nonVeg: 0 } }
            });
            loadData();
            setActiveTab('dashboard');
        } else {
            alert('Failed to create booking');
        }
    };

    // Filter Logic
    const filteredBookings = useMemo(() => {
        return allBookings.filter(b => {
            const checkIn = b.check_in.split('T')[0];
            // Simple null check
            const start = dateRange.start || '2000-01-01';
            const end = dateRange.end || '2099-12-31';
            return checkIn >= start && checkIn <= end;
        });
    }, [allBookings, dateRange]);

    // Metrics Logic
    const metrics = useMemo(() => {
        const confirmed = filteredBookings.filter(b => ['booked', 'confirmed'].includes(b.status.toLowerCase()));

        // Calculate OTA revenue based on blocked dates and room prices
        let otaRevenue = 0;
        let otaNights = 0;
        Object.entries(blockedDates).forEach(([roomId, dates]) => {
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                // Use average of low/high season price
                const avgPrice = (room.price_low_season + room.price_high_season) / 2;
                otaNights += dates.length;
                otaRevenue += dates.length * avgPrice;
            }
        });

        return {
            revenue: confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0),
            bookings: confirmed.length,
            totalRequests: filteredBookings.length,
            pending: filteredBookings.filter(b => b.status === 'pending').length,
            otaRevenue: Math.round(otaRevenue),
            otaNights: otaNights
        };
    }, [filteredBookings, blockedDates, rooms]);

    // Graph Logic - includes both direct and OTA revenue
    const monthlyData = useMemo(() => {
        const monthMap = {};

        // Direct bookings revenue
        allBookings.forEach(b => {
            if (['booked', 'confirmed'].includes(b.status.toLowerCase())) {
                const date = new Date(b.check_in);
                const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                if (!monthMap[key]) monthMap[key] = { direct: 0, ota: 0 };
                monthMap[key].direct += (b.total_price || 0);
            }
        });

        // OTA revenue by month
        Object.entries(blockedDates).forEach(([roomId, dates]) => {
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                const avgPrice = (room.price_low_season + room.price_high_season) / 2;
                dates.forEach(d => {
                    const date = new Date(d.start);
                    const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                    if (!monthMap[key]) monthMap[key] = { direct: 0, ota: 0 };
                    monthMap[key].ota += avgPrice;
                });
            }
        });

        return Object.entries(monthMap)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([label, data]) => ({
                label,
                direct: Math.round(data.direct),
                ota: Math.round(data.ota),
                total: Math.round(data.direct + data.ota)
            }));
    }, [allBookings, blockedDates, rooms]);

    const exportCSV = () => {
        // ... (Same CSV Logic)
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

    // Helper for Meal Change - with capacity validation
    const handleMealChange = (type, diet, val) => {
        const newCount = Math.max(0, parseInt(val) || 0);
        const guestCount = parseInt(offlineForm.guests) || 1;

        // Calculate total meals for this meal type after the change
        const currentMeal = offlineForm.mealSelection[type];
        const otherDietCount = diet === 'veg'
            ? (parseInt(currentMeal.nonVeg) || 0)
            : (parseInt(currentMeal.veg) || 0);
        const totalForThisMeal = newCount + otherDietCount;

        // Validate: total plates for this meal type cannot exceed guest count
        if (totalForThisMeal > guestCount) {
            alert(`Total ${type} plates (Veg + Non-Veg) cannot exceed ${guestCount} guests.`);
            return;
        }

        setOfflineForm(prev => ({
            ...prev,
            mealSelection: {
                ...prev.mealSelection,
                [type]: {
                    ...prev.mealSelection[type],
                    [diet]: newCount
                }
            }
        }));
    };

    if (loading) return <div className="loading-state">Loading Analytics...</div>;

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-title">
                    <h1>Bethany Admin</h1>
                </div>

                <div className="admin-tabs" style={{ display: 'flex', gap: '20px' }}>
                    <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                    <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory & Rooms</button>
                    <button className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`} onClick={() => setActiveTab('offline')}>+ New Booking</button>
                </div>

                <div className="admin-controls">
                    <button onClick={onLogout} className="btn-logout">Logout</button>
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <>
                    <div className="admin-controls" style={{ justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Filter:</span>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="date-input" />
                        <span style={{ color: '#cbd5e1' }}>—</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="date-input" />
                        <button onClick={exportCSV} className="btn-primary"><span>📥</span> Export CSV</button>
                    </div>

                    {/* KPI Cards */}
                    <div className="stats-grid">
                        <StatCard title="Confirmed Revenue" value={`₹${metrics.revenue.toLocaleString('en-IN')}`} icon="💰" color="#10b981" subtitle="In selected range" />
                        <StatCard title="OTA Revenue" value={`₹${metrics.otaRevenue.toLocaleString('en-IN')}`} icon="🔗" color="#0891b2" subtitle={`${metrics.otaNights} nights synced`} />
                        <StatCard title="Confirmed Bookings" value={metrics.bookings} icon="✅" color="#3b82f6" subtitle="Validated stays" />
                        <StatCard title="Pending Review" value={metrics.pending} icon="⏳" color="#f59e0b" subtitle="Action needed" />
                        <StatCard title="Total Enquiries" value={metrics.totalRequests} icon="📊" color="#8b5cf6" subtitle="All requests" />
                    </div>

                    {/* Revenue Trends Chart */}
                    <div className="card-panel" style={{ marginTop: '20px' }}>
                        <h3>📈 Revenue Trends (Direct vs OTA)</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '250px', gap: '20px', padding: '20px 0', overflowX: 'auto' }}>
                            {monthlyData.map((data, i) => {
                                const maxVal = Math.max(...monthlyData.map(d => d.total)) || 1;
                                const directHeight = (data.direct / maxVal) * 200;
                                const otaHeight = (data.ota / maxVal) * 200;

                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '200px', width: '40px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                            {/* OTA Portion */}
                                            <div style={{ height: `${otaHeight}px`, background: '#0891b2', width: '100%', transition: 'height 0.3s' }} title={`OTA: ₹${data.ota}`}></div>
                                            {/* Direct Portion */}
                                            <div style={{ height: `${directHeight}px`, background: '#10b981', width: '100%', transition: 'height 0.3s' }} title={`Direct: ₹${data.direct}`}></div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px' }}>{data.label}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>₹{(data.total / 1000).toFixed(1)}k</span>
                                    </div>
                                );
                            })}
                            {monthlyData.length === 0 && <div style={{ color: '#94a3b8', margin: 'auto' }}>No revenue data available</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></div> Direct</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#0891b2', borderRadius: '2px' }}></div> OTA (Est.)</div>
                        </div>
                    </div>

                    {/* OTA Synced Bookings Section */}
                    {Object.keys(blockedDates).length > 0 && (
                        <div className="card-panel" style={{ marginTop: '20px' }}>
                            <h3>🔗 OTA Synced Bookings</h3>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                                Blocked dates imported from external platforms (Goibibo, Booking.com, Airbnb)
                            </p>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Room</th><th>Blocked Date</th><th>Source</th></tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(blockedDates).flatMap(([roomId, dates]) => {
                                            const room = rooms.find(r => r.id === roomId);
                                            const roomName = room?.name || roomId;
                                            return dates.slice(0, 20).map((d, i) => (
                                                <tr key={`${roomId}-${i}`}>
                                                    <td><strong>{roomName}</strong></td>
                                                    <td>{d.start}</td>
                                                    <td><span style={{
                                                        background: '#dbeafe',
                                                        color: '#1e40af',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem'
                                                    }}>OTA Import</span></td>
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {Object.values(blockedDates).flat().length > 20 && (
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                                    Showing first 20 entries. View all in Inventory tab.
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'inventory' && (
                <div className="card-panel">
                    <h3>Room Inventory & OTA Sync</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                        Paste iCal URLs from Goibibo, Booking.com, or Airbnb to sync external bookings.
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr><th>Room</th><th>Std Price</th><th>High Season</th><th>Capacity</th><th>OTA Calendar URL</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {rooms.map(r => (
                                    <React.Fragment key={r.id}>
                                        <tr>
                                            <td><strong>{r.name}</strong></td>
                                            <td>₹{r.price_low_season}</td>
                                            <td>₹{r.price_high_season}</td>
                                            <td>{r.capacity}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    id={`ical-${r.id}`}
                                                    placeholder="Paste OTA iCal URL"
                                                    defaultValue={r.ical_import_url || ''}
                                                    style={{ width: '250px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                />
                                            </td>
                                            <td style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                                    onClick={async () => {
                                                        const input = document.getElementById(`ical-${r.id}`);
                                                        const url = input?.value || '';
                                                        const result = await SupabaseService.updateRoom(r.id, { ical_import_url: url });
                                                        if (result.success) {
                                                            alert('iCal URL saved!');
                                                            loadData();
                                                        } else {
                                                            alert('Save failed');
                                                        }
                                                    }}
                                                >
                                                    💾 Save
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#10b981' }}
                                                    onClick={async () => {
                                                        const url = r.ical_import_url;
                                                        if (!url) {
                                                            alert('No iCal URL saved for this room. Save one first.');
                                                            return;
                                                        }
                                                        alert('Syncing... Please wait.');
                                                        const { fetchIcalDates } = await import('../../utils/icalParser');
                                                        const result = await fetchIcalDates(url);
                                                        if (result.success) {
                                                            const blockedCount = result.dates.length;
                                                            // Save to Supabase
                                                            const saveResult = await SupabaseService.saveBlockedDates(r.id, result.dates);
                                                            if (saveResult.success) {
                                                                setBlockedDates(prev => ({ ...prev, [r.id]: result.dates }));
                                                                alert(`✅ Synced! Saved ${blockedCount} blocked date(s) to database.`);
                                                            } else {
                                                                alert(`⚠️ Synced ${blockedCount} dates but failed to save to database.`);
                                                            }
                                                        } else {
                                                            alert(`❌ Sync failed: ${result.error}`);
                                                        }
                                                    }}
                                                >
                                                    🔄 Sync
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#6366f1' }}
                                                    onClick={() => {
                                                        window.open(`/ical/${r.id}`, '_blank');
                                                    }}
                                                >
                                                    📥 Export
                                                </button>
                                            </td>
                                        </tr>
                                        {blockedDates[r.id] && blockedDates[r.id].length > 0 && (
                                            <tr style={{ background: '#fef2f2' }}>
                                                <td colSpan="6" style={{ padding: '8px 15px' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                                                        <strong>🚫 OTA Blocked ({blockedDates[r.id].length}):</strong>{' '}
                                                        {blockedDates[r.id].slice(0, 10).map((d, i) => (
                                                            <span key={i} style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', marginRight: '5px', fontSize: '0.8rem' }}>
                                                                {d.start}
                                                            </span>
                                                        ))}
                                                        {blockedDates[r.id].length > 10 && <span>+{blockedDates[r.id].length - 10} more</span>}
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '15px', padding: '10px', background: '#fef3c7', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <strong>💡 Tip:</strong> After syncing, external bookings will be checked when creating new bookings.
                    </div>
                </div>
            )}

            {activeTab === 'offline' && (
                <div className="card-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h3>Create Offline Booking</h3>
                    <form onSubmit={handleOfflineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        {/* Guest Details */}
                        <div className="form-group">
                            <label>Guest Name</label>
                            <input type="text" value={offlineForm.name} onChange={e => setOfflineForm({ ...offlineForm, name: e.target.value })} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input type="text" value={offlineForm.phone} onChange={e => setOfflineForm({ ...offlineForm, phone: e.target.value })} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>
                                Number of Guests
                                {offlineForm.room && (() => {
                                    const selectedRoom = rooms.find(r => r.id === offlineForm.room);
                                    return selectedRoom ? <span style={{ fontSize: '0.85rem', color: '#64748b' }}> (Max: {selectedRoom.capacity})</span> : null;
                                })()}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={offlineForm.room ? (rooms.find(r => r.id === offlineForm.room)?.capacity || 10) : 10}
                                value={offlineForm.guests}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 1;
                                    const selectedRoom = rooms.find(r => r.id === offlineForm.room);
                                    const maxCapacity = selectedRoom?.capacity || 10;
                                    if (val > maxCapacity) {
                                        alert(`This room can accommodate maximum ${maxCapacity} guests.`);
                                        setOfflineForm({ ...offlineForm, guests: maxCapacity });
                                    } else {
                                        setOfflineForm({ ...offlineForm, guests: val });
                                    }
                                }}
                                required
                                className="form-input"
                            />
                        </div>

                        {/* Dates */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Check In</label>
                                <input type="date" value={offlineForm.checkIn} onChange={e => setOfflineForm({ ...offlineForm, checkIn: e.target.value })} required className="form-input" />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Check Out</label>
                                <input type="date" value={offlineForm.checkOut} onChange={e => setOfflineForm({ ...offlineForm, checkOut: e.target.value })} required className="form-input" />
                            </div>
                        </div>

                        {/* Room Selection & Availability Status */}
                        <div className="form-group">
                            <label>Room</label>
                            <select value={offlineForm.room} onChange={e => setOfflineForm({ ...offlineForm, room: e.target.value })} required className="form-input">
                                <option value="">Select Room</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            {/* Availability Feedback */}
                            {offlineForm.room && offlineForm.checkIn && offlineForm.checkOut && (
                                <div style={{
                                    marginTop: '5px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    color: isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut) ? '#10b981' : '#ef4444'
                                }}>
                                    {isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut) ? '✅ Available' : '❌ Already Booked'}
                                </div>
                            )}
                        </div>

                        {/* MEAL SELECTION */}
                        <div className="form-group" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                            <label style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>Daily Meals (Per person count)</label>

                            {/* Breakfast */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>Breakfast (₹{MEAL_PRICES.breakfast})</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="number" min="0" placeholder="Veg Qty" value={offlineForm.mealSelection.breakfast.veg || ''} onChange={(e) => handleMealChange('breakfast', 'veg', e.target.value)} style={{ flex: 1, padding: '5px' }} />
                                    <input type="number" min="0" placeholder="Non-Veg Qty" value={offlineForm.mealSelection.breakfast.nonVeg || ''} onChange={(e) => handleMealChange('breakfast', 'nonVeg', e.target.value)} style={{ flex: 1, padding: '5px' }} />
                                </div>
                            </div>

                            {/* Lunch */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>Lunch (₹{MEAL_PRICES.lunch})</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="number" min="0" placeholder="Veg Qty" value={offlineForm.mealSelection.lunch.veg || ''} onChange={(e) => handleMealChange('lunch', 'veg', e.target.value)} style={{ flex: 1, padding: '5px' }} />
                                    <input type="number" min="0" placeholder="Non-Veg Qty" value={offlineForm.mealSelection.lunch.nonVeg || ''} onChange={(e) => handleMealChange('lunch', 'nonVeg', e.target.value)} style={{ flex: 1, padding: '5px' }} />
                                </div>
                            </div>

                            {/* Dinner */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>Dinner (₹{MEAL_PRICES.dinner})</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="number" min="0" placeholder="Veg Qty" value={offlineForm.mealSelection.dinner.veg || ''} onChange={(e) => handleMealChange('dinner', 'veg', e.target.value)} style={{ flex: 1, padding: '5px' }} />
                                    <input type="number" min="0" placeholder="Non-Veg Qty" value={offlineForm.mealSelection.dinner.nonVeg || ''} onChange={(e) => handleMealChange('dinner', 'nonVeg', e.target.value)} style={{ flex: 1, padding: '5px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Auto-Calculated Price */}
                        <div className="form-group">
                            <label>Total Price (Rooms + Meals) (₹) - <small>Auto-calculated</small></label>
                            <input type="number" value={offlineForm.price} onChange={e => setOfflineForm({ ...offlineForm, price: e.target.value })} required className="form-input" />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ marginTop: '10px', opacity: isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut) ? 1 : 0.5 }}
                            disabled={!isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut)}
                        >
                            Confirm Booking
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'dashboard' && (
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
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{booking.guests?.email}</div>
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
            )}
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
