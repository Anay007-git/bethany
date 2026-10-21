import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://xiqtayqigrmxkvanxsmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x_n8vRtkYzhN24mzv5VVKg_auI4sBtI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

export const MobileSupabaseService = {
    // -------------------------------------------------------------
    // GUEST-FACING METHODS
    // -------------------------------------------------------------

    // 1. Fetch Rooms Inventory
    async getRooms() {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .order('id');
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('Error fetching rooms for mobile:', err);
            return [];
        }
    },

    // 2. Fetch Active Bookings for Guest Availability Check (Bidirectionally Synchronized)
    async getAllBookings() {
        try {
            const [standardRes, subRes] = await Promise.all([
                supabase
                    .from('bookings')
                    .select('*')
                    .or('status.eq.confirmed,status.eq.booked,status.eq.pending'),
                supabase
                    .from('subscription_bookings')
                    .select('*')
                    .eq('status', 'confirmed')
            ]);

            if (standardRes.error) throw standardRes.error;

            const standardBookings = standardRes.data || [];
            const subBookings = (subRes.data || []).map(sb => ({
                id: `sub_${sb.id}`,
                check_in: sb.check_in,
                check_out: sb.check_out,
                room_ids: [{ id: sb.room_id, name: sb.room_id }],
                guests_count: Array.isArray(sb.attending_occupants) ? sb.attending_occupants.length : 1,
                status: 'confirmed',
                is_subscription: true
            }));

            return [...standardBookings, ...subBookings];
        } catch (err) {
            console.warn('Error fetching synchronized bookings for mobile:', err);
            return [];
        }
    },

    // 3. Fetch OTA Blocked Dates
    async getBlockedDates(roomId = null) {
        try {
            let query = supabase.from('ota_blocked_dates').select('*');
            if (roomId) {
                query = query.eq('room_id', roomId);
            }
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (err) {
            return { success: false, data: [] };
        }
    },

    // 4. Create New Booking (Guest Flow with Concurrency Check)
    async createBooking(bookingData) {
        try {
            // A. Concurrency Safety: Check if room is reserved in subscription bookings
            if (bookingData.selectedRooms && bookingData.selectedRooms.length > 0) {
                for (const room of bookingData.selectedRooms) {
                    const { data: subOverlap } = await supabase
                        .from('subscription_bookings')
                        .select('id')
                        .eq('room_id', room.id)
                        .eq('status', 'confirmed')
                        .lt('check_in', bookingData.checkOut)
                        .gt('check_out', bookingData.checkIn)
                        .limit(1);

                    if (subOverlap && subOverlap.length > 0) {
                        return {
                            success: false,
                            error: `Room "${room.name}" is already reserved by a subscription member during the selected dates.`
                        };
                    }
                }
            }

            // B. Create / Lookup Guest
            let guestId = null;
            let guestRecord = null;
            const cleanPhone = (bookingData.phone || '').toString().trim();
            const cleanEmail = (bookingData.email || '').toString().trim().toLowerCase();

            try {
                const { data: existingGuest } = await supabase
                    .from('guests')
                    .select('*')
                    .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail}`)
                    .limit(1)
                    .maybeSingle();

                if (existingGuest?.id) {
                    guestId = existingGuest.id;
                    guestRecord = existingGuest;
                }
            } catch (_) {}

            if (!guestId) {
                const { data: newGuest, error: guestError } = await supabase
                    .from('guests')
                    .insert([{
                        full_name: (bookingData.name || 'Guest').trim(),
                        email: cleanEmail,
                        phone: cleanPhone
                    }])
                    .select()
                    .single();

                if (guestError) throw guestError;
                guestId = newGuest.id;
                guestRecord = newGuest;
            }

            // C. Create Booking
            const roomIds = bookingData.selectedRooms.map(r => ({ id: r.id, name: r.name }));
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                    guest_id: guestId,
                    room_ids: roomIds,
                    check_in: bookingData.checkIn,
                    check_out: bookingData.checkOut,
                    guests_count: parseInt(bookingData.guests, 10),
                    total_price: bookingData.totalPrice,
                    meal_preferences: bookingData.meals || 'None',
                    special_requests: bookingData.message || '',
                    status: 'pending',
                    source: 'mobile_app'
                }])
                .select()
                .single();

            if (bookingError) throw bookingError;

            // D. Create Invoice Breakdown
            if (bookingData.invoiceItems && bookingData.invoiceItems.length > 0) {
                const invNum = `INV-${Date.now().toString().slice(-6)}`;
                try {
                    await supabase
                        .from('invoices')
                        .insert([{
                            booking_id: booking.id,
                            invoice_number: invNum,
                            items: bookingData.invoiceItems,
                            total_amount: bookingData.totalPrice,
                            status: 'issued'
                        }]);
                } catch (invErr) {
                    console.warn('Invoice breakdown insert non-fatal error:', invErr);
                }
            }

            return { success: true, booking, guest: guestRecord };
        } catch (error) {
            console.error('Mobile booking error:', error);
            return { success: false, error: error.message || 'Booking creation failed' };
        }
    },

    // 5. Look up bookings by phone number (Bill & Reservation Lookup)
    async getBookingsByPhone(phone) {
        try {
            const cleanDigits = phone.replace(/\D/g, '').slice(-10);
            if (cleanDigits.length < 6) return { success: true, data: [] };

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    guests (full_name, phone, email),
                    invoices (*)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const matches = (data || []).filter(b => {
                let g = b.guests;
                if (Array.isArray(g)) g = g[0];
                const dbDigits = (g?.phone || '').replace(/\D/g, '').slice(-10);
                return dbDigits.endsWith(cleanDigits) || cleanDigits.endsWith(dbDigits);
            });

            return { success: true, data: matches };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    // 6. Validate Coupon
    async validateCoupon(code) {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error) throw new Error('Invalid coupon code');
            if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
                throw new Error('Coupon has expired');
            }
            if (data.usage_limit && (data.usage_count || 0) >= data.usage_limit) {
                throw new Error('Coupon usage limit reached');
            }
            return { success: true, coupon: data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    // 7. Check Loyalty Returning Customer
    async checkReturningCustomer(phone) {
        try {
            const res = await MobileSupabaseService.getBookingsByPhone(phone);
            if (res.success && res.data && res.data.length > 0) {
                const valid = ['confirmed', 'booked', 'completed'];
                return res.data.some(b => valid.includes((b.status || '').toLowerCase()));
            }
            return false;
        } catch {
            return false;
        }
    },

    // -------------------------------------------------------------
    // ADMIN MODULE METHODS
    // -------------------------------------------------------------

    // A1. Admin: Dashboard Stats & Live Bookings
    async getAdminDashboardStats() {
        try {
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    guests (
                        full_name,
                        email,
                        phone
                    ),
                    invoices (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const safeList = bookings || [];
            const nonCancelled = safeList.filter(b => (b.status || '').toLowerCase() !== 'cancelled');
            const totalRevenue = nonCancelled.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
            const totalBookings = safeList.length;
            const pendingBookings = safeList.filter(b => (b.status || '').toLowerCase() === 'pending').length;
            const confirmedBookings = safeList.filter(b => ['confirmed', 'booked'].includes((b.status || '').toLowerCase())).length;
            const cancelledBookings = safeList.filter(b => (b.status || '').toLowerCase() === 'cancelled').length;

            return {
                success: true,
                totalRevenue,
                totalBookings,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,
                allBookings: safeList
            };
        } catch (error) {
            console.error('Admin Stats Fetch Error:', error);
            return {
                success: false,
                totalRevenue: 0,
                totalBookings: 0,
                pendingBookings: 0,
                confirmedBookings: 0,
                cancelledBookings: 0,
                allBookings: [],
                error: error.message
            };
        }
    },

    // A2. Admin: Update Booking Status (e.g. 'confirmed', 'booked', 'cancelled')
    async updateBookingStatus(bookingId, newStatus) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Admin Update Status Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A3. Admin: Update Room Price & Inventory
    async updateRoom(roomId, updates) {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .update(updates)
                .eq('id', roomId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Admin Update Room Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A3.1 Admin: Create & List New Room
    async createRoom(roomData) {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .insert([roomData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Admin Create Room Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A3.2 Admin: Delete Room
    async deleteRoom(roomId) {
        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Admin Delete Room Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A4. Admin: Block Date for Room (OTA Sync / Maintenance)
    async blockDate(roomId, dateStr, reason = 'Admin Block') {
        try {
            const { data, error } = await supabase
                .from('ota_blocked_dates')
                .insert([{
                    room_id: roomId,
                    blocked_date: dateStr,
                    source: reason
                }])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Admin Block Date Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A4.1 Admin: Block Date Range or Month for Room
    async blockDateRange(roomId, startDateStr, endDateStr, reason = 'Admin Blocked Period') {
        try {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);
            const rows = [];
            const cur = new Date(start);

            while (cur <= end) {
                const dStr = cur.toISOString().split('T')[0];
                rows.push({
                    room_id: roomId,
                    blocked_date: dStr,
                    source: reason
                });
                cur.setDate(cur.getDate() + 1);
            }

            if (rows.length === 0) return { success: false, error: 'Invalid date range' };

            // Upsert / insert rows
            const { data, error } = await supabase
                .from('ota_blocked_dates')
                .upsert(rows, { onConflict: 'room_id,blocked_date' })
                .select();

            if (error) {
                // If upsert constraint differs, fallback to insert with ignoreDuplicates
                try {
                    await supabase.from('ota_blocked_dates').insert(rows);
                } catch (_) {}
            }

            return { success: true, blockedCount: rows.length, data };
        } catch (error) {
            console.error('Admin Block Date Range Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A5. Admin: Unblock Date for Room
    async unblockDate(roomId, dateStr) {
        try {
            const { error } = await supabase
                .from('ota_blocked_dates')
                .delete()
                .eq('room_id', roomId)
                .eq('blocked_date', dateStr);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Admin Unblock Date Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A6. Admin: Get All Coupons
    async getCoupons() {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Admin Get Coupons Error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    // A7. Admin: Create Coupon
    async createCoupon(couponData) {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .insert([{
                    code: couponData.code.trim().toUpperCase(),
                    discount_type: couponData.discount_type || 'percentage',
                    discount_value: parseFloat(couponData.discount_value) || 0,
                    usage_limit: couponData.usage_limit ? parseInt(couponData.usage_limit, 10) : null,
                    expiry_date: couponData.expiry_date || null,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Admin Create Coupon Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A8. Admin: Toggle Coupon Active State
    async toggleCouponActive(couponId, isActive) {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .update({ is_active: isActive })
                .eq('id', couponId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Admin Toggle Coupon Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A9. Admin: Delete Coupon
    async deleteCoupon(couponId) {
        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', couponId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Admin Delete Coupon Error:', error);
            return { success: false, error: error.message };
        }
    },

    // A10. Admin: Create Manual / Offline Booking
    async createAdminManualBooking(bookingData) {
        try {
            // 1. Sanitize & validate dates
            const normalizeDate = (dStr) => {
                if (!dStr) return null;
                const trimmed = dStr.toString().trim();
                // If in DD/MM/YYYY format
                if (trimmed.includes('/') && trimmed.split('/').length === 3) {
                    const [d, m, y] = trimmed.split('/');
                    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                // If in YYYY-MM-DD format
                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    return trimmed;
                }
                const parsed = new Date(trimmed);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString().split('T')[0];
                }
                return null;
            };

            const cleanCheckIn = normalizeDate(bookingData.checkIn);
            const cleanCheckOut = normalizeDate(bookingData.checkOut);

            if (!cleanCheckIn || !cleanCheckOut || cleanCheckOut <= cleanCheckIn) {
                return { success: false, error: 'Invalid check-in or check-out dates. Please select valid consecutive dates.' };
            }

            // 2. Sanitize Guest Info
            const cleanName = (bookingData.name || 'Walk-In Guest').toString().trim();
            const rawPhone = (bookingData.phone || '').toString().trim();
            const cleanPhone = rawPhone.replace(/[^\d+]/g, '') || '9999999999';
            let cleanEmail = (bookingData.email || '').toString().trim().toLowerCase();
            if (!cleanEmail || !cleanEmail.includes('@')) {
                cleanEmail = `offline.${Date.now()}@bethanyhomestay.com`;
            }

            // Check if guest already exists by phone or email
            let guestId = null;
            let guestRecord = null;

            try {
                const { data: existingGuest } = await supabase
                    .from('guests')
                    .select('*')
                    .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail}`)
                    .limit(1)
                    .maybeSingle();

                if (existingGuest?.id) {
                    guestId = existingGuest.id;
                    guestRecord = existingGuest;
                }
            } catch (_) {}

            if (!guestId) {
                const { data: newGuest, error: guestError } = await supabase
                    .from('guests')
                    .insert([{
                        full_name: cleanName,
                        email: cleanEmail,
                        phone: cleanPhone
                    }])
                    .select()
                    .single();

                if (guestError) throw new Error(`Guest record error: ${guestError.message}`);
                guestId = newGuest.id;
                guestRecord = newGuest;
            }

            // 3. Room records array (guarantee at least one valid room)
            let roomIds = [];
            if (Array.isArray(bookingData.selectedRooms) && bookingData.selectedRooms.length > 0) {
                roomIds = bookingData.selectedRooms.map(r => ({
                    id: (r.id || 'carmel').toLowerCase(),
                    name: r.name || (r.id === 'jordan' ? 'Jordan' : r.id === 'sion' ? 'Sion Room' : r.id === 'zion' ? 'Zion' : 'Carmel')
                }));
            } else {
                roomIds = [{ id: 'carmel', name: 'Carmel' }];
            }

            // 4. Safe price and guest count
            const rawPrice = parseFloat(bookingData.totalPrice);
            const safeTotalPrice = isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice;
            const safeGuestsCount = Math.max(1, parseInt(bookingData.guests, 10) || 1);

            // 5. Insert booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                    guest_id: guestId,
                    room_ids: roomIds,
                    check_in: cleanCheckIn,
                    check_out: cleanCheckOut,
                    guests_count: safeGuestsCount,
                    total_price: safeTotalPrice,
                    meal_preferences: bookingData.mealSummary || 'None',
                    special_requests: bookingData.notes || 'Direct Manual Booking by Concierge',
                    status: 'confirmed',
                    source: 'admin_manual'
                }])
                .select()
                .single();

            if (bookingError) throw new Error(`Booking insert error: ${bookingError.message}`);

            // 6. Generate Invoice safely
            const invNum = `INV-ADM-${Date.now().toString().slice(-6)}`;
            try {
                await supabase
                    .from('invoices')
                    .insert([{
                        booking_id: booking.id,
                        invoice_number: invNum,
                        items: bookingData.invoiceItems && Array.isArray(bookingData.invoiceItems)
                            ? bookingData.invoiceItems
                            : [{ name: 'Homestay Stay', amount: safeTotalPrice }],
                        total_amount: safeTotalPrice,
                        status: 'paid'
                    }]);
            } catch (invErr) {
                console.warn('Admin invoice insert non-fatal error:', invErr);
            }

            return { success: true, booking, guest: guestRecord };
        } catch (error) {
            console.error('Admin Manual Booking Error:', error);
            return { success: false, error: error.message || 'Failed to record reservation in database.' };
        }
    },

    // A11. Admin: CRM Analytics & Guest Loyalty Aggregation
    async getCRMAnalytics() {
        try {
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    created_at,
                    check_in,
                    check_out,
                    total_price,
                    status,
                    source,
                    guests (
                        id,
                        full_name,
                        email,
                        phone
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const guestMap = new Map();

            (bookings || []).forEach(b => {
                let g = b.guests;
                if (Array.isArray(g)) g = g[0];
                if (!g || !g.phone) return;

                const phoneKey = g.phone.replace(/\D/g, '').slice(-10);
                if (!phoneKey) return;

                const bPrice = parseFloat(b.total_price) || 0;
                const isPaidStay = ['confirmed', 'booked', 'completed'].includes((b.status || '').toLowerCase());

                if (!guestMap.has(phoneKey)) {
                    guestMap.set(phoneKey, {
                        id: g.id || b.id,
                        name: g.full_name || 'Guest',
                        phone: g.phone,
                        email: g.email || 'N/A',
                        totalBookings: 1,
                        confirmedStays: isPaidStay ? 1 : 0,
                        totalSpend: isPaidStay ? bPrice : 0,
                        lastBookingDate: b.created_at || b.check_in,
                        bookings: [b]
                    });
                } else {
                    const existing = guestMap.get(phoneKey);
                    existing.totalBookings += 1;
                    if (isPaidStay) {
                        existing.confirmedStays += 1;
                        existing.totalSpend += bPrice;
                    }
                    existing.bookings.push(b);
                }
            });

            // Convert to array and calculate loyalty tier
            const guestsList = Array.from(guestMap.values()).map(cust => {
                let tier = '🌱 First-Time Guest';
                let tierColor = '#2A9D8F';
                if (cust.confirmedStays >= 3 || cust.totalSpend >= 20000) {
                    tier = '👑 VIP Patron';
                    tierColor = '#C5A059';
                } else if (cust.confirmedStays >= 2 || cust.totalSpend >= 8000) {
                    tier = '🌿 Returning Guest';
                    tierColor = '#23483B';
                }
                return {
                    ...cust,
                    loyaltyTier: tier,
                    tierColor
                };
            });

            // Sort by total spend descending
            guestsList.sort((a, b) => b.totalSpend - a.totalSpend);

            return { success: true, data: guestsList };
        } catch (error) {
            console.error('CRM Analytics Error:', error);
            return { success: false, data: [], error: error.message };
        }
    }
};
