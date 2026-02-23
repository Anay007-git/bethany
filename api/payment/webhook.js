import { createClient } from '@supabase/supabase-js';

// Reusing the Vite env variables since this Vercel function can access them
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const base64Body = req.body.response;

        if (!base64Body) {
            return res.status(400).json({ error: 'Missing response body' });
        }

        // PhonePe sends the payload as a Base64 encoded JSON string
        const decodedString = Buffer.from(base64Body, 'base64').toString('utf8');
        const payload = JSON.parse(decodedString);

        if (payload.code === 'PAYMENT_SUCCESS' && payload.data) {
            const merchantOrderId = payload.data.merchantOrderId;
            const transactionId = payload.data.transactionId;
            const amount = payload.data.amount / 100; // convert paisa to string/number

            // 1. Update Booking Status to confirmed
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('id', merchantOrderId);

            if (bookingError) {
                console.error("Booking update error:", bookingError);
            }

            // 2. Insert Payment Record
            const { error: paymentError } = await supabase
                .from('payments')
                .insert([{
                    booking_id: merchantOrderId,
                    amount: amount,
                    status: 'completed',
                    transaction_id: transactionId,
                    payment_method: payload.data.paymentInstrument?.type || 'unknown'
                }]);

            if (paymentError) {
                console.error("Payment insert error:", paymentError);
            }
        }

        // Always return 200 OK so PhonePe knows we received the webhook
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ error: error.message || 'Webhook processing failed' });
    }
}
