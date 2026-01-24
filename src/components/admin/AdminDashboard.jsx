import React, { useState, useEffect, useMemo } from 'react';
import { SupabaseService } from '../../services/SupabaseService';
import titleBarImg from '../../assets/title-bar.jpeg';
import whatsappIcon from '../../assets/whatsapp.svg';
import CRM from './CRM';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [rooms, setRooms] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Room Editing State
    const [editingRoom, setEditingRoom] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newImageUrl, setNewImageUrl] = useState('');
    const [uploadingImg, setUploadingImg] = useState(false);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const [statusFilter, setStatusFilter] = useState('all');

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

    // Coupon State
    const [coupons, setCoupons] = useState([]);
    const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: 0, usage_limit: '', expiry_date: '' });
    const [editingCoupon, setEditingCoupon] = useState(null);

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

        // Load Coupons
        const couponResult = await SupabaseService.getCoupons();
        if (couponResult.success) setCoupons(couponResult.data);

        setLoading(false);
    };

    // --- Coupon Handlers ---
    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            code: couponForm.code.toUpperCase(),
            discount_type: couponForm.discount_type,
            discount_value: parseFloat(couponForm.discount_value),
            usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
            expiry_date: couponForm.expiry_date || null,
            is_active: true
        };

        let res;
        if (editingCoupon) {
            res = await SupabaseService.updateCoupon(editingCoupon.id, payload);
        } else {
            res = await SupabaseService.createCoupon(payload);
        }

        if (res.success) {
            alert(editingCoupon ? 'Coupon Updated!' : 'Coupon Created!');
            setEditingCoupon(null);
            setCouponForm({ code: '', discount_type: 'percentage', discount_value: 0, usage_limit: '', expiry_date: '' });
            loadData();
        } else {
            alert('Error: ' + (res.error.message || 'Operation failed'));
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            await SupabaseService.deleteCoupon(id);
            loadData();
        }
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
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking && booking.status.toLowerCase() === 'cancelled') {
            alert('❌ Cannot change status of a Cancelled booking.');
            return;
        }

        if (!window.confirm(`Change status to ${newStatus.toUpperCase()}?`)) return;
        const result = await SupabaseService.updateBookingStatus(bookingId, newStatus);
        if (result.success) {
            loadData();
        } else {
            alert('Failed to update status');
        }
    };

    // --- Room Editing Handlers ---

    const handleEditClick = (room) => {
        setEditingRoom(room);
        setEditForm({
            ...room,
            features: Array.isArray(room.features) ? room.features.join(', ') : (room.features || ''),
            images: room.images || []
        });
        setNewImageUrl('');
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImg(true);
        const result = await SupabaseService.uploadRoomImage(file);
        setUploadingImg(false);

        if (result.success) {
            setEditForm(prev => ({
                ...prev,
                images: [...prev.images, result.publicUrl]
            }));
        } else {
            alert('Image upload failed. Bucket "room-images" might not exist.');
        }
    };

    const handleAddImageURL = () => {
        if (!newImageUrl) return;
        setEditForm(prev => ({
            ...prev,
            images: [...prev.images, newImageUrl]
        }));
        setNewImageUrl('');
    };

    const handleRemoveImage = (index) => {
        setEditForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSaveRoom = async () => {
        if (!editingRoom) return;

        // Prepare updates
        const updates = {
            name: editForm.name,
            price_low_season: parseInt(editForm.price_low_season) || 0,
            price_high_season: parseInt(editForm.price_high_season) || 0,
            capacity: parseInt(editForm.capacity) || 0,
            description: editForm.description,
            // Convert features string back to array
            features: editForm.features.split(',').map(f => f.trim()).filter(f => f),
            images: editForm.images,
            ical_import_url: editForm.ical_import_url
        };

        const result = await SupabaseService.updateRoom(editingRoom.id, updates);
        if (result.success) {
            alert('Room updated successfully!');
            setEditingRoom(null);
            loadData();
        } else {
            alert('Failed to update room');
        }
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
            const dateMatch = checkIn >= start && checkIn <= end;

            if (statusFilter !== 'all' && (b.status || '').toLowerCase() !== statusFilter) return false;

            return dateMatch;
        });
    }, [allBookings, dateRange, statusFilter]);

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

    // Calculate internal blocked dates from allBookings
    const internalBlockedDates = useMemo(() => {
        const blocked = {};
        allBookings.forEach(b => {
            if (['booked', 'confirmed', 'pending'].includes((b.status || '').toLowerCase())) {
                const start = new Date(b.check_in);
                const end = new Date(b.check_out);

                for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    (b.room_ids || []).forEach(room => {
                        if (!blocked[room.id]) blocked[room.id] = [];
                        if (!blocked[room.id].some(item => item.start === dateStr)) {
                            blocked[room.id].push({ start: dateStr, source: 'Internal', bookingId: b.id });
                        }
                    });
                }
            }
        });
        return blocked;
    }, [allBookings]);

    // Cancellation Trends Logic
    const cancellationData = useMemo(() => {
        const monthMap = {};
        allBookings.forEach(b => {
            const date = new Date(b.check_in);
            const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            if (!monthMap[key]) monthMap[key] = { confirmed: 0, cancelled: 0 };

            const status = b.status.toLowerCase();
            if (['booked', 'confirmed'].includes(status)) {
                monthMap[key].confirmed += 1;
            } else if (status === 'cancelled') {
                monthMap[key].cancelled += 1;
            }
        });

        return Object.entries(monthMap)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([label, data]) => ({ label, ...data }));
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
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">Bethany<span>Admin</span></div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 <span>Dashboard</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        🏨 <span>Inventory & OTA</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'offline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('offline')}
                    >
                        ➕ <span>New Booking</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'marketing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('marketing')}
                    >
                        📢 <span>Marketing</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coupons')}
                    >
                        🎟️ <span>Coupons</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                <header className="main-header">
                    <div className="page-title">
                        <h1>{activeTab === 'dashboard' ? 'Overview' : activeTab === 'inventory' ? 'Room Inventory' : activeTab === 'marketing' ? 'Customer CRM' : activeTab === 'coupons' ? 'Coupon Management' : 'Create Booking'}</h1>
                        <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {activeTab === 'dashboard' && (
                        <div className="header-actions">
                            <div className="filter-bar">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="date-input" />
                                <span style={{ color: '#cbd5e1' }}>→</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="date-input" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#475569', marginLeft: '10px' }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="booked">Booked</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button onClick={exportCSV} className="btn-primary"><span>📥</span> Export CSV</button>
                        </div>
                    )}

                    {/* Mobile Logout (visible via CSS media query if needed, or keeping it simples for now) */}
                </header>

                {activeTab === 'dashboard' && (
                    <>
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
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '400px', gap: '40px', padding: '30px 0', overflowX: 'auto', justifyContent: monthlyData.length > 8 ? 'flex-start' : 'center' }}>
                                {monthlyData.map((data, i) => {
                                    const maxVal = Math.max(...monthlyData.map(d => d.total)) || 1;
                                    const directHeight = (data.direct / maxVal) * 320;
                                    const otaHeight = (data.ota / maxVal) * 320;

                                    return (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '320px', width: '60px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                                {/* OTA Portion */}
                                                <div style={{ height: `${otaHeight}px`, background: '#0891b2', width: '100%', transition: 'height 0.3s' }} title={`OTA: ₹${data.ota}`}></div>
                                                {/* Direct Portion */}
                                                <div style={{ height: `${directHeight}px`, background: '#10b981', width: '100%', transition: 'height 0.3s' }} title={`Direct: ₹${data.direct}`}></div>
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>{data.label}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>₹{(data.total / 1000).toFixed(1)}k</span>
                                        </div>
                                    );
                                })}
                                {monthlyData.length === 0 && <div style={{ color: '#94a3b8', margin: 'auto', fontSize: '1.1rem' }}>No revenue data available</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', marginTop: '15px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#10b981', borderRadius: '4px' }}></div> Direct</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#0891b2', borderRadius: '4px' }}></div> OTA (Est.)</div>
                            </div>
                        </div>

                        {/* Cancellation Trends Chart */}
                        <div className="card-panel" style={{ marginTop: '20px' }}>
                            <h3>📉 Booking Trends (Confirmed vs Cancelled)</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '400px', gap: '40px', padding: '30px 0', overflowX: 'auto', justifyContent: cancellationData.length > 8 ? 'flex-start' : 'center' }}>
                                {cancellationData.map((data, i) => {
                                    const total = data.confirmed + data.cancelled;
                                    const maxVal = Math.max(...cancellationData.map(d => d.confirmed + d.cancelled)) || 1;
                                    const confirmedHeight = (data.confirmed / maxVal) * 320;
                                    const cancelledHeight = (data.cancelled / maxVal) * 320;

                                    return (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '320px', width: '60px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                                {/* Cancelled Portion (Top red) */}
                                                <div style={{ height: `${cancelledHeight}px`, background: '#ef4444', width: '100%', transition: 'height 0.3s' }} title={`Cancelled: ${data.cancelled}`}></div>
                                                {/* Confirmed Portion (Bottom blue) */}
                                                <div style={{ height: `${confirmedHeight}px`, background: '#3b82f6', width: '100%', transition: 'height 0.3s' }} title={`Confirmed: ${data.confirmed}`}></div>
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>{data.label}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>{total} Bookings</span>
                                        </div>
                                    );
                                })}
                                {cancellationData.length === 0 && <div style={{ color: '#94a3b8', margin: 'auto', fontSize: '1.1rem' }}>No booking data available</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', marginTop: '15px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#3b82f6', borderRadius: '4px' }}></div> Confirmed</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#ef4444', borderRadius: '4px' }}></div> Cancelled</div>
                            </div>
                        </div>

                        {/* Recent Bookings Table */}
                        <div className="card-panel" style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>Last 30 Days Bookings</h3>
                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    Showing {filteredBookings.length} bookings
                                </span>
                            </div>

                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Guest</th>
                                            <th>Email</th>
                                            <th>Room</th>
                                            <th>Dates</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                                    No bookings found for the selected range.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBookings.map(b => (
                                                <tr key={b.id}>
                                                    <td>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{b.guests?.full_name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.guests?.phone}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{b.guests?.email || '-'}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.9rem' }}>
                                                            {(b.room_ids || []).map(r => r.name).join(', ') || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            {new Date(b.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →
                                                            {new Date(b.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: '600' }}>₹{b.total_price?.toLocaleString('en-IN')}</td>
                                                    <td>
                                                        <select
                                                            value={b.status.toLowerCase()}
                                                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                                            className={`status-badge status-${b.status.toLowerCase()}`}
                                                            style={{
                                                                border: 'none',
                                                                outline: 'none',
                                                                cursor: b.status === 'cancelled' ? 'not-allowed' : 'pointer',
                                                                appearance: 'none',
                                                                paddingRight: '10px'
                                                            }}
                                                            disabled={b.status.toLowerCase() === 'cancelled'}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="confirmed">Confirmed</option>
                                                            <option value="booked">Booked</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                className="btn-secondary"
                                                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                onClick={() => window.open(`/bill/${b.id}`, '_blank')}
                                                            >
                                                                📄 Bill
                                                            </button>
                                                            {b.guests?.phone && (
                                                                <button
                                                                    className="btn-secondary"
                                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#10b981', borderColor: '#10b981' }}
                                                                    onClick={() => {
                                                                        const text = `Namaste ${b.guests.full_name}, thank you for choosing Bethany Homestay. Here is your invoice: ${window.location.origin}/bill/${b.id}`;
                                                                        window.open(`https://wa.me/${b.guests.phone}?text=${encodeURIComponent(text)}`, '_blank');
                                                                    }}
                                                                >
                                                                    <img src={whatsappIcon} alt="WhatsApp" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '5px' }} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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

                {activeTab === 'marketing' && <CRM allBookings={allBookings} />}





                {activeTab === 'coupons' && (
                    <div className="card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>🎟️ Manage Coupons</h3>
                            <button className="btn-secondary" onClick={() => loadData()}>🔄 Refresh</button>
                        </div>

                        {/* Coupon Form */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#334155' }}>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h4>
                            <form onSubmit={handleCouponSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', alignItems: 'end' }}>
                                <div>
                                    <label className="form-label">Code</label>
                                    <input type="text" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="e.g. SUMMER20" required className="form-input" style={{ textTransform: 'uppercase', fontWeight: 'bold' }} disabled={!!editingCoupon} />
                                </div>
                                <div>
                                    <label className="form-label">Discount Type</label>
                                    <select value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })} className="form-input">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Value</label>
                                    <input type="number" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required className="form-input" min="0" />
                                </div>
                                <div>
                                    <label className="form-label">Limit (Optional)</label>
                                    <input type="number" value={couponForm.usage_limit || ''} onChange={e => setCouponForm({ ...couponForm, usage_limit: e.target.value })} placeholder="Max uses" className="form-input" min="0" />
                                </div>
                                <div>
                                    <label className="form-label">Expiry (Optional)</label>
                                    <input type="date" value={couponForm.expiry_date || ''} onChange={e => setCouponForm({ ...couponForm, expiry_date: e.target.value })} className="form-input" />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {editingCoupon && <button type="button" onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', discount_type: 'percentage', discount_value: 0, usage_limit: '', expiry_date: '' }); }} className="btn-secondary">Cancel</button>}
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingCoupon ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>

                        {/* Coupons Table */}
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Code</th><th>Discount</th><th>Limit</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c.id}>
                                            <td><strong style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>{c.code}</strong></td>
                                            <td>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                                            <td>{c.usage_limit || '∞'}</td>
                                            <td>{c.usage_count}</td>
                                            <td>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No Expiry'}</td>
                                            <td>
                                                {c.is_active ?
                                                    <span style={{ color: 'green', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Active</span> :
                                                    <span style={{ color: 'red', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Inactive</span>
                                                }
                                            </td>
                                            <td>
                                                <button className="btn-secondary" style={{ marginRight: '8px', padding: '4px 8px' }} onClick={() => { setEditingCoupon(c); setCouponForm(c); }} title="Edit">✏️</button>
                                                <button className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', padding: '4px 8px' }} onClick={() => handleDeleteCoupon(c.id)} title="Delete">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {coupons.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No coupons found. Create your first one above! ☝️</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="card-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>Room Inventory & OTA Sync</h3>
                            <button onClick={loadData} className="btn-secondary">↻ Refresh</button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                            Manage room details and sync availability with external OTA platforms (Airbnb, Booking.com, Goibibo).
                        </p>
                        <div className="table-container">
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
                                                        placeholder="Paste iCal URL"
                                                        defaultValue={r.ical_import_url || ''}
                                                        className="form-input"
                                                        style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                                    />
                                                </td>
                                                <td style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        onClick={() => handleEditClick(r)}
                                                        title="Edit Room Details"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
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
                                                        title="Save iCal URL"
                                                    >
                                                        💾
                                                    </button>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        onClick={async () => {
                                                            const url = r.ical_import_url;
                                                            if (!url) return alert('No iCal URL saved for this room.');
                                                            alert('Syncing... Please wait.');
                                                            // Dynamically import to avoid load issues if unused
                                                            const { fetchIcalDates } = await import('../../utils/icalParser');
                                                            const result = await fetchIcalDates(url);

                                                            if (result.success) {
                                                                const blockedCount = result.dates.length;
                                                                const saveResult = await SupabaseService.saveBlockedDates(r.id, result.dates);

                                                                if (saveResult.success) {
                                                                    setBlockedDates(prev => ({ ...prev, [r.id]: result.dates }));
                                                                    alert(`✅ Synced! Saved ${blockedCount} blocked date(s).`);
                                                                } else {
                                                                    alert(`⚠️ Synced ${blockedCount} dates but failed to save.`);
                                                                }
                                                            } else {
                                                                alert(`❌ Sync failed: ${result.error}`);
                                                            }
                                                        }}
                                                        title="Sync with OTA"
                                                    >
                                                        🔄
                                                    </button>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#8b5cf6' }}
                                                        onClick={async () => {
                                                            const url = await SupabaseService.generateAndUploadIcal(r.id);
                                                            if (url) {
                                                                navigator.clipboard.writeText(url);
                                                                alert(`🔗 Link Copied!\n\n${url}\n\nPaste this into Airbnb/Booking.com.`);
                                                            } else {
                                                                alert('Sync Failed. Check console.');
                                                            }
                                                        }}
                                                        title="Generate & Copy OTA Link"
                                                    >
                                                        🔗 OTA Link
                                                    </button>
                                                </td>
                                            </tr>
                                            {(() => {
                                                const otaDates = (blockedDates[r.id] || []).map(d => ({ ...d, source: 'OTA' }));
                                                const internalDates = (internalBlockedDates[r.id] || []).map(d => ({ ...d, source: 'Web' }));

                                                // Combine and sort dates
                                                const allBlocked = [...otaDates, ...internalDates].sort((a, b) => new Date(a.start) - new Date(b.start));

                                                if (allBlocked.length === 0) return null;

                                                return (
                                                    <tr style={{ background: '#f8fafc' }}>
                                                        <td colSpan="6" style={{ padding: '12px 20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                                    <span style={{ color: '#ef4444' }}>🚫 Blocked: {allBlocked.length} dates</span>
                                                                    {internalDates.length > 0 && <span style={{ color: '#3b82f6' }}>(Web: {internalDates.length})</span>}
                                                                    {otaDates.length > 0 && <span style={{ color: '#f59e0b' }}>(OTA: {otaDates.length})</span>}
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginLeft: '10px' }}>
                                                                    {allBlocked.slice(0, 12).map((d, i) => (
                                                                        <span key={i} style={{
                                                                            background: d.source === 'OTA' ? '#fffbeb' : '#eff6ff',
                                                                            border: `1px solid ${d.source === 'OTA' ? '#fcd34d' : '#bfdbfe'}`,
                                                                            color: d.source === 'OTA' ? '#b45309' : '#1e40af',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.8rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}>
                                                                            {d.start}
                                                                            <span style={{ fontSize: '0.7em', opacity: 0.8 }}>{d.source === 'OTA' ? 'OTA' : 'WEB'}</span>
                                                                        </span>
                                                                    ))}
                                                                    {allBlocked.length > 12 && (
                                                                        <span style={{
                                                                            background: '#f1f5f9',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            color: '#64748b',
                                                                            fontSize: '0.8rem',
                                                                            border: '1px solid #e2e8f0'
                                                                        }}>
                                                                            +{allBlocked.length - 12} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Edit Room Modal */}
                        {editingRoom && (
                            <div className="modal-overlay" onClick={() => setEditingRoom(null)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '16px', position: 'relative' }}>

                                    {/* Header */}
                                    <div className="modal-header" style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>Edit Room: <span style={{ color: '#3b82f6' }}>{editingRoom.name}</span></h3>
                                        <button
                                            onClick={() => setEditingRoom(null)}
                                            className="close-btn"
                                            style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#64748b', transition: 'color 0.2s', padding: '0', lineHeight: 1 }}
                                            onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                            onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                        {/* Basic Info Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Room Name</label>
                                                <input type="text" name="name" value={editForm.name || ''} onChange={handleEditChange} className="form-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Capacity (Adults)</label>
                                                <input type="number" name="capacity" value={editForm.capacity || 0} onChange={handleEditChange} className="form-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Std Price (₹)</label>
                                                <input type="number" name="price_low_season" value={editForm.price_low_season || 0} onChange={handleEditChange} className="form-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>High Season Price (₹)</label>
                                                <input type="number" name="price_high_season" value={editForm.price_high_season || 0} onChange={handleEditChange} className="form-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                                            </div>
                                        </div>

                                        {/* Text Areas */}
                                        <div>
                                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Description</label>
                                            <textarea name="description" value={editForm.description || ''} onChange={handleEditChange} className="form-input" rows="4" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontFamily: 'inherit' }} />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Features <span style={{ fontWeight: '400', fontSize: '0.8rem', color: '#94a3b8' }}>(comma separated)</span></label>
                                            <textarea name="features" value={editForm.features || ''} onChange={handleEditChange} className="form-input" rows="2" placeholder="e.g. Wi-Fi, Balcony, Mountain View" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontFamily: 'inherit' }} />
                                        </div>

                                        {/* Images Section */}
                                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <label className="form-label" style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>🖼️ Gallery Images</label>

                                            {/* Image Grid */}
                                            {editForm.images && editForm.images.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
                                                    {editForm.images.map((img, idx) => (
                                                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                                                            <img src={img} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                onClick={() => handleRemoveImage(idx)}
                                                                title="Remove Image"
                                                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
                                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>No images added yet.</div>
                                            )}

                                            {/* Upload Controls */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    <label style={{
                                                        background: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                                    }}>
                                                        <span>📁 Upload New</span>
                                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImg} />
                                                    </label>
                                                    {uploadingImg && <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '500' }}>⏳ Uploading...</span>}
                                                </div>

                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>OR</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Paste direct image URL"
                                                        value={newImageUrl}
                                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                                        className="form-input"
                                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                                    />
                                                    <button
                                                        onClick={handleAddImageURL}
                                                        className="btn-secondary"
                                                        disabled={!newImageUrl}
                                                        style={{ padding: '8px 16px', background: newImageUrl ? '#3b82f6' : '#e2e8f0', color: newImageUrl ? 'white' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: newImageUrl ? 'pointer' : 'default' }}
                                                    >
                                                        Add URL
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* iCal URL */}
                                        <div style={{ marginTop: '5px' }}>
                                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>OTA iCal Sync URL</label>
                                            <input type="text" name="ical_import_url" value={editForm.ical_import_url || ''} onChange={handleEditChange} className="form-input" placeholder="https://airbnb.com/calendar/..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155' }} />
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Link your Airbnb/Booking.com calendar here for auto-sync.</div>
                                        </div>

                                        <div className="modal-footer" style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            <button onClick={() => setEditingRoom(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Cancel</button>
                                            <button onClick={handleSaveRoom} className="btn-primary" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 35px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}>Save Changes</button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'offline' && (
                    <div className="card-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3>Create New Booking</h3>
                        <form onSubmit={handleOfflineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Guest Name</label>
                                    <input type="text" value={offlineForm.name} onChange={e => setOfflineForm({ ...offlineForm, name: e.target.value })} required className="date-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Phone</label>
                                    <input type="text" value={offlineForm.phone} onChange={e => setOfflineForm({ ...offlineForm, phone: e.target.value })} required className="date-input" style={{ width: '100%' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Check In</label>
                                    <input type="date" value={offlineForm.checkIn} onChange={e => setOfflineForm({ ...offlineForm, checkIn: e.target.value })} required className="date-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Check Out</label>
                                    <input type="date" value={offlineForm.checkOut} onChange={e => setOfflineForm({ ...offlineForm, checkOut: e.target.value })} required className="date-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Guests</label>
                                    <input type="number" min="1" value={offlineForm.guests} onChange={e => setOfflineForm({ ...offlineForm, guests: parseInt(e.target.value) || 1 })} required className="date-input" style={{ width: '100%' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Room Selection</label>
                                <select value={offlineForm.room} onChange={e => setOfflineForm({ ...offlineForm, room: e.target.value })} required className="date-input" style={{ width: '100%' }}>
                                    <option value="">Select Room</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Max: {r.capacity})</option>)}
                                </select>
                                {offlineForm.room && offlineForm.checkIn && offlineForm.checkOut && (
                                    <div style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: '600', color: isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut) ? '#10b981' : '#ef4444' }}>
                                        {isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut) ? '✅ Room Available' : '❌ Room Already Booked'}
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', marginBottom: '15px', fontWeight: '600', fontSize: '0.9rem' }}>Meal Plan (Daily Count)</label>
                                {['breakfast', 'lunch', 'dinner'].map(type => (
                                    <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '15px' }}>
                                        <div style={{ width: '100px', textTransform: 'capitalize', fontWeight: '500' }}>{type}</div>
                                        <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                                            <input type="number" placeholder="Veg" min="0" value={offlineForm.mealSelection[type].veg || ''} onChange={(e) => handleMealChange(type, 'veg', e.target.value)} className="date-input" style={{ width: '100%' }} />
                                            <input type="number" placeholder="Non-Veg" min="0" value={offlineForm.mealSelection[type].nonVeg || ''} onChange={(e) => handleMealChange(type, 'nonVeg', e.target.value)} className="date-input" style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '20px', borderRadius: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Estimated Price</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>₹{offlineForm.price.toLocaleString('en-IN')}</div>
                                </div>
                                <button type="submit" disabled={!isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut)} className="btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', opacity: isRoomAvailable(offlineForm.room, offlineForm.checkIn, offlineForm.checkOut) ? 1 : 0.5 }}>
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                )
                }
            </main >
        </div >
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
