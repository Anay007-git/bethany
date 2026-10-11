import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xiqtayqigrmxkvanxsmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x_n8vRtkYzhN24mzv5VVKg_auI4sBtI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export const MobileSupabaseService = {
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

    // 2. Fetch Active Bookings for Availability Check
    async getAllBookings() {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .or('status.eq.confirmed,status.eq.booked,status.eq.pending');
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('Error fetching bookings for mobile:', err);
            return [];
        }
    },

    // 3. Fetch OTA Blocked Dates
    async getBlockedDates() {
        try {
            const { data, error } = await supabase
                .from('ota_blocked_dates')
                .select('*');
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (err) {
            return { success: false, data: [] };
        }
    },

    // 4. Create New Booking
    async createBooking(bookingData) {
        try {
            // A. Create Guest
            const { data: guest, error: guestError } = await supabase
                .from('guests')
                .insert([{
                    full_name: bookingData.name,
                    email: bookingData.email,
                    phone: bookingData.phone
                }])
                .select()
                .single();

            if (guestError) throw guestError;

            // B. Create Booking
            const roomIds = bookingData.selectedRooms.map(r => ({ id: r.id, name: r.name }));
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                    guest_id: guest.id,
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

            // C. Create Invoice Breakdown
            if (bookingData.invoiceItems && bookingData.invoiceItems.length > 0) {
                const invNum = `INV-${Date.now().toString().slice(-6)}`;
                await supabase
                    .from('invoices')
                    .insert([{
                        booking_id: booking.id,
                        invoice_number: invNum,
                        items: bookingData.invoiceItems,
                        total_amount: bookingData.totalPrice,
                        status: 'issued'
                    }]).catch(() => {});
            }

            return { success: true, booking, guest };
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
    }
};
