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

            // C. Create Invoice Record (Immutable Breakdown) - INLINE to avoid 'this' binding issues
            console.log('[DEBUG] invoiceItems received:', bookingData.invoiceItems);
            console.log('[DEBUG] invoiceItems length:', bookingData.invoiceItems?.length);

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

                    console.log('[DEBUG] Invoice payload:', JSON.stringify(invoicePayload, null, 2));

                    const { data: invoiceData, error: invoiceError } = await supabase
                        .from('invoices')
                        .insert([invoicePayload])
                        .select();

                    if (invoiceError) {
                        console.error('[ERROR] Invoice Creation Error:', invoiceError);
                        console.error('[ERROR] Error message:', invoiceError.message);
                        console.error('[ERROR] Error details:', invoiceError.details);
                        console.error('[ERROR] Error hint:', invoiceError.hint);
                        console.error('[ERROR] Error code:', invoiceError.code);
                    } else {
                        console.log('[SUCCESS] Invoice created:', invNum, invoiceData);
                    }
                } catch (invErr) {
                    console.error('[EXCEPTION] Invoice Logic Error:', invErr);
                }
            } else {
                console.warn('[WARN] No invoiceItems provided, skipping invoice creation');
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
            // Normalize phone: remove all non-digits
            const cleanInput = phone.replace(/\D/g, '');

            console.log('[DEBUG] Phone Lookup - Input:', phone, '-> Clean:', cleanInput);

            if (cleanInput.length < 6) {
                console.log('[DEBUG] Phone too short, need at least 6 digits');
                return { success: true, data: [] };
            }

            // Fetch recent bookings
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    guests(full_name, phone, email)
                `)
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) {
                console.error('[ERROR] Supabase query error:', error);
                throw error;
            }

            console.log('[DEBUG] Total bookings fetched:', data?.length);
            if (data?.length > 0) {
                console.log('[DEBUG] Sample booking guests structure:', typeof data[0].guests, data[0].guests);
            }

            // Client-side flexible matching
            const inputDigits = cleanInput.slice(-10); // Last 10 digits of input

            const matches = data.filter(b => {
                // Handle both array and object guest structures
                let guestData = b.guests;
                if (Array.isArray(guestData)) {
                    guestData = guestData[0]; // Take first guest if array
                }

                const dbPhone = (guestData?.phone || '').replace(/\D/g, '');
                const dbDigits = dbPhone.slice(-10);

                // Match if last N digits are same
                const matchLength = Math.min(inputDigits.length, dbDigits.length);
                if (matchLength < 6) return false;

                const inputSuffix = inputDigits.slice(-matchLength);
                const dbSuffix = dbDigits.slice(-matchLength);

                const isMatch = inputSuffix === dbSuffix;
                if (isMatch) {
                    console.log('[DEBUG] Match found:', guestData?.phone, '-> Clean:', dbDigits);
                }
                return isMatch;
            });

            console.log('[DEBUG] Matches found:', matches.length);
            return { success: true, data: matches };

        } catch (error) {
            console.error('[ERROR] Fetch by Phone Error:', error);
            return { success: false, error };
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
