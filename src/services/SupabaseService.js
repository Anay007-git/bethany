import { supabase } from './supabase';

export const SupabaseService = {

    // 1. Create a New Booking (Dual Write Support)
    // 1. Create a New Booking (Dual Write Support)
    async createBooking(bookingData) {
        try {
            // A. Create Guest Record
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
            const roomIds = bookingData.selectedRooms.map(r => ({ id: r.id, name: r.name }));

            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert([{
                    guest_id: guest.id,
                    room_ids: roomIds,
                    check_in: bookingData.checkIn,
                    check_out: bookingData.checkOut,
                    guests_count: parseInt(bookingData.guests),
                    total_price: bookingData.totalPrice,
                    meal_preferences: bookingData.meals,
                    special_requests: bookingData.message,
                    status: bookingData.source === 'offline' ? 'confirmed' : 'pending',
                    source: bookingData.source || 'website'
                }])
                .select()
                .single();

            if (bookingError) throw bookingError;

            // C. Create Invoice Record (Immutable Breakdown)
            if (bookingData.invoiceItems && bookingData.invoiceItems.length > 0) {
                try {
                    const invNum = `INV-${Date.now().toString().slice(-6)}`;
                    const invoicePayload = {
                        booking_id: booking.id,
                        invoice_number: invNum,
                        items: bookingData.invoiceItems,
                        total_amount: bookingData.totalPrice,
                        status: 'issued'
                    };

                    await supabase
                        .from('invoices')
                        .insert([invoicePayload]);
                } catch (invErr) {
                    // Silent fail for invoice creation
                }
            }

            return { success: true, booking, guest };

        } catch (error) {
            console.error('Supabase Booking Error:', error);
            return { success: false, error };
        }
    },

    // 1.5 Create Invoice
    async createInvoice({ bookingId, items, total }) {
        try {
            const invNum = `INV-${Date.now().toString().slice(-6)}`;

            const { error } = await supabase
                .from('invoices')
                .insert([{
                    booking_id: bookingId,
                    invoice_number: invNum,
                    items: items, // JSONB Array
                    total_amount: total,
                    status: 'issued'
                }]);

            if (error) {
                console.error('Invoice Creation Error:', error);
            }
        } catch (err) {
            console.error('Invoice Logic Error:', err);
        }
    },

    // --- INVENTORY MANAGEMENT ---

    // Get all rooms
    getRooms: async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .order('id');
        if (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
        return data;
    },

    // Update room details
    updateRoom: async (roomId, updates) => {
        const { data, error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('id', roomId)
            .select();

        if (error) {
            console.error('Error updating room:', error);
            return { success: false, error };
        }
        return { success: true, data };
    },

    // Save OTA blocked dates to Supabase
    saveBlockedDates: async (roomId, dates) => {
        try {
            // First, delete existing blocked dates for this room
            await supabase
                .from('ota_blocked_dates')
                .delete()
                .eq('room_id', roomId);

            // Insert new blocked dates
            if (dates && dates.length > 0) {
                const records = dates.map(d => ({
                    room_id: roomId,
                    blocked_date: d.start,
                    source: 'ical'
                }));

                const { error } = await supabase
                    .from('ota_blocked_dates')
                    .insert(records);

                if (error) throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Error saving blocked dates:', error);
            return { success: false, error };
        }
    },

    // Get OTA blocked dates from Supabase
    getBlockedDates: async (roomId = null) => {
        try {
            let query = supabase.from('ota_blocked_dates').select('*');

            if (roomId) {
                query = query.eq('room_id', roomId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching blocked dates:', error);
            return { success: false, data: [] };
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
                .order('created_at', { ascending: false });
            // .limit(50); // REMOVED LIMIT to allow full analytics calculation on client side

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
    },

    // 5. Upload Invoice PDF
    uploadInvoice: async (fileBlob, fileName) => {
        try {
            // 1. Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('invoices')
                .upload(fileName, fileBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('invoices')
                .getPublicUrl(fileName);

            return { success: true, publicUrl };

        } catch (error) {
            console.error('Invoice Upload Error:', error);
            return { success: false, error };
        }
    },

    // 6. Get Booking by Phone (Bill Lookup)
    getBookingsByPhone: async (phone) => {
        try {
            const cleanInput = phone.replace(/\D/g, '');
            if (cleanInput.length < 6) return { success: true, data: [] };

            const { data, error } = await supabase
                .from('bookings')
                .select(`*, guests(full_name, phone, email)`)
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;

            const inputDigits = cleanInput.slice(-10);
            const matches = data.filter(b => {
                let guestData = b.guests;
                if (Array.isArray(guestData)) guestData = guestData[0];

                const dbDigits = (guestData?.phone || '').replace(/\D/g, '').slice(-10);
                const matchLength = Math.min(inputDigits.length, dbDigits.length);
                if (matchLength < 6) return false;

                return inputDigits.slice(-matchLength) === dbDigits.slice(-matchLength);
            });

            return { success: true, data: matches };
        } catch (error) {
            return { success: false, error };
        }
    },

    // 6.5 Check Returning Customer (Loyalty)
    checkReturningCustomer: async (phone) => {
        try {
            // Use existing lookup
            const { success, data } = await SupabaseService.getBookingsByPhone(phone);
            if (!success || !data || data.length === 0) return false;

            // Check for at least one completed/valid stay
            const validStatuses = ['confirmed', 'booked', 'checked_out', 'completed'];
            return data.some(b => validStatuses.includes((b.status || '').toLowerCase()));
        } catch (error) {
            console.error('Loyalty Check Error:', error);
            return false;
        }
    },

    // 7. Get Single Booking by ID (Bill View)
    getBookingById: async (bookingId) => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    guests (full_name, phone, email),
                    invoices (*)
                `)
                .eq('id', bookingId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Fetch Booking Error:', error);
            return { success: false, error };
        }
    }
};
