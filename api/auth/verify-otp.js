import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_bethany_SUPABASE_URL || 'https://xiqtayqigrmxkvanxsmn.supabase.co';
const supabaseKey = process.env.bethany_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x_n8vRtkYzhN24mzv5VVKg_auI4sBtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_OTP_ATTEMPTS = 5;

export default async function handler(req, res) {
    // Enable CORS for mobile app requests
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { email, otpCode, otp } = req.body || {};
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanOtp = (otpCode || otp || '').trim();

        if (!cleanEmail || !cleanOtp || cleanOtp.length !== 6) {
            return res.status(400).json({ success: false, error: 'Please provide email and 6-digit verification code.' });
        }

        // 1. Fetch user record
        const { data: user, error: fetchErr } = await supabase
            .from('subscription_users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (fetchErr || !user) {
            return res.status(404).json({ success: false, error: 'User record not found. Please request a new code.' });
        }

        // 2. Check maximum attempts
        if ((user.otp_attempts || 0) >= MAX_OTP_ATTEMPTS) {
            return res.status(403).json({
                success: false,
                error: 'Maximum verification attempts exceeded. Please request a new verification code.'
            });
        }

        // 3. Check expiry
        if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({
                success: false,
                error: 'Verification code has expired. Please request a new verification code.'
            });
        }

        // 4. Verify hashed OTP
        const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');

        // Check if DB has hashed code or legacy plain code
        const isMatch = (user.otp_code === inputHash) || (user.otp_code === cleanOtp);

        if (!isMatch) {
            const nextAttempts = (user.otp_attempts || 0) + 1;
            await supabase
                .from('subscription_users')
                .update({ otp_attempts: nextAttempts })
                .eq('id', user.id);

            const remaining = MAX_OTP_ATTEMPTS - nextAttempts;
            return res.status(400).json({
                success: false,
                error: `Incorrect verification code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Attempts exceeded.'}`
            });
        }

        // 5. Successful Verification -> Invalidate OTP & Mark Verified
        const now = new Date().toISOString();
        const { data: verifiedUser, error: updateErr } = await supabase
            .from('subscription_users')
            .update({
                is_email_verified: true,
                otp_code: null,
                otp_expires_at: null,
                otp_attempts: 0,
                updated_at: now
            })
            .eq('id', user.id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        return res.status(200).json({
            success: true,
            user: verifiedUser,
            message: 'Email address successfully verified.'
        });

    } catch (error) {
        console.error('verify-otp Error:', error);
        return res.status(500).json({ success: false, error: error.message || 'OTP verification failed.' });
    }
}
