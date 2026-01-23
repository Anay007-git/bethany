import { useState, useEffect, useMemo } from 'react';
import { SupabaseService } from '../../services/SupabaseService';
import jsPDF from 'jspdf';
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

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const stats = await SupabaseService.getDashboardStats();
        if (stats && stats.recentBookings) setAllBookings(stats.recentBookings);

        const roomsData = await SupabaseService.getRooms();
        if (roomsData) setRooms(roomsData);

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

    // Check availability against allBookings
    const isRoomAvailable = (roomId, startStr, endStr) => {
        if (!roomId || !startStr || !endStr) return true; // Assume available if incomplete

        const checkIn = new Date(startStr); checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(endStr); checkOut.setHours(0, 0, 0, 0);

        return !allBookings.some(b => {
            // Only check  confirmed/booked/pending
            if (!['booked', 'confirmed', 'pending'].includes(b.status.toLowerCase())) return false;

            // Check if room matches
            const rIds = b.room_ids || []; // Array of {id, name}
            const hasRoom = rIds.some(r => r.id === roomId);
            if (!hasRoom) return false;

            // Check Overlap
            const bStart = new Date(b.check_in); bStart.setHours(0, 0, 0, 0);
            const bEnd = new Date(b.check_out); bEnd.setHours(0, 0, 0, 0);

            return checkIn < bEnd && checkOut > bStart;
        });
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
            source: 'offline'
        };

        const result = await SupabaseService.createBooking(bookingData);
        if (result.success) {

            // --- GENERATE INVOICE PDF ---
            try {
                const doc = new jsPDF();
                const invNum = `INV-${Date.now().toString().slice(-6)}`;
                const billDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

                // Load Logo
                const img = new Image();
                img.src = titleBarImg;
                await new Promise((resolve) => {
                    if (img.complete) resolve();
                    else img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails
                });

                // --- HEADER ---
                // Logo (Top Left)
                try {
                    doc.addImage(img, 'JPEG', 15, 15, 50, 25); // x, y, w, h
                } catch (e) { console.warn("Logo add failed", e); }

                // Company Details (Right aligned to logo)
                doc.setFontSize(20);
                doc.setTextColor(40, 167, 69);
                doc.setFont("helvetica", "bold");
                doc.text("NAMASTE HILLS", 195, 25, { align: "right" });

                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "normal");
                doc.text("Bethany Homestay", 195, 32, { align: "right" });
                doc.setFontSize(9);
                doc.text("Dr. Graham's Homes, Block 'B'", 195, 37, { align: "right" });
                doc.text("Kalimpong-I, Thapatar Para", 195, 41, { align: "right" });
                doc.text("P.O Topkhana, P.S Kalimpong", 195, 45, { align: "right" });
                doc.text("PIN - 734316", 195, 49, { align: "right" });

                // Invoice Meta (Below Logo)
                doc.line(15, 52, 195, 52); // Divider

                doc.setFontSize(10);
                doc.text(`Invoice #: ${invNum}`, 15, 60);
                doc.text(`Date: ${billDate}`, 195, 60, { align: "right" });

                // --- BILL TO ---
                doc.setFont("helvetica", "bold");
                doc.text("Bill To:", 15, 70);
                doc.setFont("helvetica", "normal");
                doc.text(offlineForm.name, 15, 76);
                doc.text(`Phone: ${offlineForm.phone}`, 15, 81);

                // --- BOOKING DETAILS TABLE ---
                let y = 95;

                // Table Header
                doc.setFillColor(240, 240, 240);
                doc.rect(15, y, 180, 10, 'F');
                doc.setFont("helvetica", "bold");
                doc.text("Description", 20, y + 7);
                doc.text("Details", 100, y + 7);

                y += 18;
                doc.setFont("helvetica", "normal");

                // Rows
                const row = (label, value) => {
                    doc.text(label, 20, y);
                    doc.text(String(value), 100, y);
                    y += 8;
                };

                row("Room", selectedRoomObj.name);
                row("Check In", offlineForm.checkIn);
                row("Check Out", offlineForm.checkOut);
                row("Guests", offlineForm.guests);

                if (mealString) {
                    const splitMeals = doc.splitTextToSize(mealString, 90);
                    doc.text("Meals", 20, y);
                    doc.text(splitMeals, 100, y);
                    y += (splitMeals.length * 6) + 4;
                }

                doc.line(15, y, 195, y); // Bottom divider
                y += 10;

                // --- TOTAL ---
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text(`Total Amount:`, 140, y);
                doc.setTextColor(40, 167, 69);
                doc.text(`INR ${offlineForm.price}`, 195, y, { align: "right" });
                doc.setTextColor(0, 0, 0);

                // Footer
                doc.setFontSize(9);
                doc.setFont("helvetica", "italic");
                doc.text("Thank you for choosing Namaste Hills Bethany Homestay!", 105, 280, { align: "center" });

                // Create Blob
                const pdfBlob = doc.output('blob');
                const fileName = `invoice_${invNum}.pdf`;

                // Upload
                const uploadRes = await SupabaseService.uploadInvoice(pdfBlob, fileName);

                if (uploadRes.success) {
                    const waLink = `https://wa.me/${offlineForm.phone}?text=${encodeURIComponent(`Namaste ${offlineForm.name}, \n\nCheck out your invoice from Bethany Homestay: ${uploadRes.publicUrl} \n\nThank you!`)}`;
                    window.open(waLink, '_blank');
                } else {
                    console.error("Invoice Upload Failed", uploadRes.error);
                    alert("Booking saved, but Invoice Upload failed.");
                }

            } catch (err) {
                console.error("PDF Generation Error", err);
                alert("Booking saved, but PDF generation failed.");
            }

            alert('Offline Booking Created Successfully!');
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
        return {
            revenue: confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0),
            bookings: confirmed.length,
            totalRequests: filteredBookings.length,
            pending: filteredBookings.filter(b => b.status === 'pending').length
        };
    }, [filteredBookings]);

    // Graph Logic (Same as before)
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
    }, [allBookings]);

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

    // Helper for Meal Change
    const handleMealChange = (type, diet, val) => {
        const count = Math.max(0, parseInt(val) || 0);
        setOfflineForm(prev => ({
            ...prev,
            mealSelection: {
                ...prev.mealSelection,
                [type]: {
                    ...prev.mealSelection[type],
                    [diet]: count
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
                        <StatCard title="Confirmed Bookings" value={metrics.bookings} icon="✅" color="#3b82f6" subtitle="Validated stays" />
                        <StatCard title="Pending Review" value={metrics.pending} icon="⏳" color="#f59e0b" subtitle="Action needed" />
                        <StatCard title="Total Enquiries" value={metrics.totalRequests} icon="📊" color="#8b5cf6" subtitle="All requests" />
                    </div>
                </>
            )}

            {activeTab === 'inventory' && (
                <div className="card-panel">
                    <h3>Room Inventory</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr><th>Room</th><th>Standard Price</th><th>High Season</th><th>Capacity</th><th>iCal Link</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {rooms.map(r => (
                                    <tr key={r.id}>
                                        <td><strong>{r.name}</strong></td>
                                        <td>₹{r.price_low_season}</td>
                                        <td>₹{r.price_high_season}</td>
                                        <td>{r.capacity}</td>
                                        <td>
                                            <input type="text" placeholder="Paste OTA iCal URL" defaultValue={r.ical_import_url || ''} style={{ width: '200px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                        </td>
                                        <td>
                                            <button className="btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Update</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                            <label>Number of Guests</label>
                            <input type="number" min="1" value={offlineForm.guests} onChange={e => setOfflineForm({ ...offlineForm, guests: e.target.value })} required className="form-input" />
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
