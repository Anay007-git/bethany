import { supabase } from './supabase';

export const SupabaseService = {
    /**
     * Fetch existing bookings for the calendar
     * @returns {Promise<Array>} Array of booking objects
     */
    async getBookings() {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('check_in, check_out, status, room_id')
                .in('status', ['confirmed', 'booked', 'pending']);

            if (error) {
                console.error('Supabase fetch error:', error);
                return [];
            }

            // Map to format expected by frontend
            return data.map(b => ({
                checkIn: b.check_in, // Supabase returns YYYY-MM-DD which works
                checkOut: b.check_out,
                status: b.status.charAt(0).toUpperCase() + b.status.slice(1), // Capitalize
                room_id: b.room_id
            }));
        } catch (err) {
            console.error('Service error:', err);
            return [];
        }
    },

    /**
     * Save a new booking
     * @param {Object} formData - Form data from BookingForm
     */
    async saveBooking(formData) {
        try {
            // 1. Upsert Guest (Find by email, or create)
            // We use email as unique identifier for simplicity in this demo
            const { data: guestData, error: guestError } = await supabase
                .from('guests')
                .select('id')
                .eq('email', formData.email)
                .single();

            let guestId = guestData?.id;

            if (!guestId) {
                const { data: newGuest, error: createGuestError } = await supabase
                    .from('guests')
                    .insert([{
                        full_name: formData.name,
                        email: formData.email,
                        phone: formData.phone
                    }])
                    .select()
                    .single();

                if (createGuestError) throw createGuestError;
                guestId = newGuest.id;
            }

            // 2. Create Bookings (One entry per room if multiple selected, or single entry with room_id?)
            // The current DB schema has 'room_id' as text.
            // If the user selects multiple rooms, we should technically create multiple booking entries linked to the same "Group"?
            // For simplicity/compatibility with current schema, we will iterate and create one booking per room.

            const bookingsToCreate = formData.selectedRooms.map(room => ({
                guest_id: guestId,
                room_id: room.id,
                check_in: formData.checkIn,
                check_out: formData.checkOut,
                status: 'pending',
                total_amount: formData.totalPrice / formData.selectedRooms.length, // Split price approx or logic needs update
                guest_count: formData.guests,
                meal_plan: formData.mealSelection, // JSONB
                message: formData.message
            }));

            const { data: bookings, error: bookingError } = await supabase
                .from('bookings')
                .insert(bookingsToCreate)
                .select();

            if (bookingError) throw bookingError;

            return { success: true, data: bookings };

        } catch (error) {
            console.error('Supabase save error:', error);
            return { success: false, error };
        }
    }
};
