import { supabase } from './supabase';

export const SupabaseService = {

    // 1. Create a New Booking (Dual Write Support)
    createBooking: async (bookingData) => {
        try {
            // A. Create Guest Record (or find existing - simplistic for now, just create)
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

            // B. Create Booking Record
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                    guest_id: guest.id,
                    room_ids: bookingData.selectedRooms.map(r => ({ id: r.id, name: r.name })),
                    check_in: bookingData.checkIn,
                    check_out: bookingData.checkOut,
                    guests_count: parseInt(bookingData.guests),
                    total_price: bookingData.totalPrice,
                    meal_preferences: bookingData.meals, // Map 'meals' from bookingData
                    special_requests: bookingData.message, // Map 'message' from bookingData
                    status: 'pending',
                    source: 'website'
                }])
                .select()
                .single();

            if (bookingError) throw bookingError;

            return { success: true, booking, guest };

        } catch (error) {
            console.error('Supabase Booking Error:', error);
            // We do NOT block the UI if Supabase fails, as GSheets is primary for now.
            return { success: false, error };
        }
    },

    // 2. Admin: Get Dashboard Stats
    getDashboardStats: async () => {
        try {
            // Fetch recent bookings (last 30 days)
            const { data: recentBookings, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    guests (
                        full_name,
                        email,
                        phone
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Calculate Metrics
            const totalRevenue = recentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
            const totalBookings = recentBookings.length;
            const pendingBookings = recentBookings.filter(b => b.status === 'pending').length;

            return {
                totalRevenue,
                totalBookings,
                pendingBookings,
                recentBookings
            };

        } catch (error) {
            console.error('Stats Fetch Error:', error);
            return null;
        }
    },

    // 3. Get All Bookings for Availability Check
    getAllBookings: async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .or('status.eq.confirmed,status.eq.booked,status.eq.pending'); // Fetch all relevant statues

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase Availability Fetch Error:', error);
            return [];
        }
    },

    // 4. Admin: Update Booking Status
    updateBookingStatus: async (bookingId, newStatus) => {
        try {
            // 1. Fetch booking details FIRST to get Email + CheckIn for matching
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*, guests(email)')
                .eq('id', bookingId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Update Supabase
            const { data, error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId)
                .select();

            if (error) throw error;

            // 3. Update Google Sheet (Fire and Forget)
            if (booking && booking.guests && booking.guests.email) {
                const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwCh7e84B44r49_S84abs7DfNyu6V8IV6umuQUNYH6qRmtGDIVKzXWR4EXD8yFrLFNksw/exec';

                // Format date as YYYY-MM-DD
                const dateStr = booking.check_in;

                const sheetParams = new URLSearchParams({
                    action: 'updateStatus',
                    bookingId: bookingId, // <--- CRITICAL FIX: Send ID for matching
                    email: booking.guests.email,
                    checkIn: dateStr,
                    status: newStatus
                });

                // Use no-cors to avoid browser blocking the request (opaque response is fine)
                fetch(`${GOOGLE_SHEETS_URL}?${sheetParams.toString()}`, { method: 'POST', mode: 'no-cors' })
                    .catch(err => console.error('Sheet Sync Error:', err));
            }

            return { success: true, data };
        } catch (error) {
            console.error('Update Status Error:', error);
            return { success: false, error };
        }
    }
};
