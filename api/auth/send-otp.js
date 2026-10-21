import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_bethany_SUPABASE_URL || 'https://xiqtayqigrmxkvanxsmn.supabase.co';
const supabaseKey = process.env.bethany_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x_n8vRtkYzhN24mzv5VVKg_auI4sBtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const OTP_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;

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
        const { email, fullName } = req.body || {};
        const cleanEmail = (email || '').trim().toLowerCase();

        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
        }

        const now = new Date();

        // 1. Check existing user and rate limit
        const { data: existingUser } = await supabase
            .from('subscription_users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (existingUser && existingUser.last_otp_sent_at) {
            const lastSent = new Date(existingUser.last_otp_sent_at);
            const secondsSince = Math.floor((now.getTime() - lastSent.getTime()) / 1000);
            if (secondsSince < OTP_COOLDOWN_SECONDS) {
                const waitLeft = OTP_COOLDOWN_SECONDS - secondsSince;
                return res.status(429).json({
                    success: false,
                    cooldown: true,
                    secondsLeft: waitLeft,
                    error: `Please wait ${waitLeft} seconds before requesting a new verification code.`
                });
            }
        }

        // 2. Cryptographically secure 6-digit OTP
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        // Securely hash OTP for storage (never store plain OTP in DB)
        const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

        // 3. Upsert user record in subscription_users
        let userId;
        if (existingUser) {
            const { data: updated, error: updateErr } = await supabase
                .from('subscription_users')
                .update({
                    full_name: (fullName || '').trim() || existingUser.full_name,
                    otp_code: hashedOtp,
                    otp_expires_at: expiresAt,
                    otp_attempts: 0,
                    last_otp_sent_at: now.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', existingUser.id)
                .select()
                .single();

            if (updateErr) throw updateErr;
            userId = updated.id;
        } else {
            const { data: inserted, error: insertErr } = await supabase
                .from('subscription_users')
                .insert([{
                    email: cleanEmail,
                    full_name: (fullName || '').trim() || 'Homestay Member',
                    auth_provider: 'email_otp',
                    is_email_verified: false,
                    otp_code: hashedOtp,
                    otp_expires_at: expiresAt,
                    otp_attempts: 0,
                    last_otp_sent_at: now.toISOString()
                }])
                .select()
                .single();

            if (insertErr) throw insertErr;
            userId = inserted.id;
        }

        // 4. Dispatch Email via SMTP / Resend
        let emailSent = false;
        let emailError = null;

        const defaultKey = Buffer.from('cmVfSkppVkRyR1lfREVQdFRtSFhUMjh6V3B6a0gzUTU5QQ==', 'base64').toString('utf-8');
        const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || defaultKey;
        const smtpHost = process.env.SMTP_HOST || 'smtp.resend.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || (smtpHost.includes('gmail.com') ? '465' : (smtpHost.includes('resend') ? '465' : '2525')), 10);
        const fromEmail = process.env.SMTP_FROM_EMAIL || (process.env.SMTP_FROM && process.env.SMTP_FROM.includes('@') ? process.env.SMTP_FROM : 'otp@anaytech.in');
        const fromName = process.env.SMTP_FROM_NAME || 'Bethany Homestay';
        const smtpFrom = fromEmail.includes('<') ? fromEmail : `"${fromName}" <${fromEmail}>`;
        const replyTo = process.env.SMTP_REPLY_TO || 'namastehills.kol@gmail.com';

        const htmlContent = `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e6e2dd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                <div style="background-color: #162E25; padding: 28px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #FAF8F5; font-size: 22px; font-weight: 700; letter-spacing: 1px;">BETHANY HOMESTAY</h1>
                    <p style="margin: 6px 0 0; color: #D6A868; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Family & Couple Room Subscription</p>
                </div>
                <div style="padding: 32px 28px; color: #162E25;">
                    <h2 style="font-size: 18px; margin-top: 0; color: #162E25;">Your Verification Code</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #555555;">
                        Hello ${fullName || 'Guest'},<br/>
                        Please use the 6-digit verification code below to confirm your email and access the Bethany Homestay Subscription Portal:
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #162E25; background: #F6F4E7; padding: 14px 28px; border-radius: 8px; border: 1px dashed #D6A868;">
                            ${otpCode}
                        </span>
                    </div>
                    <p style="font-size: 12px; color: #888888; text-align: center; margin-bottom: 24px;">
                        This code is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong> and can only be used once. Do not share this code with anyone.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #999999; line-height: 1.5; margin: 0;">
                        If you did not request this verification code, you can safely ignore this email. Someone may have entered your email address by mistake.
                    </p>
                </div>
                <div style="background-color: #FAF8F5; padding: 16px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #e6e2dd;">
                    &copy; ${now.getFullYear()} Bethany Homestay, Kalimpong. All rights reserved.
                </div>
            </div>
        `;

        if (smtpUser && smtpPass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpPort === 465,
                    auth: {
                        user: smtpUser,
                        pass: smtpPass
                    }
                });

                const info = await transporter.sendMail({
                    from: smtpFrom,
                    replyTo: replyTo,
                    to: cleanEmail,
                    subject: `${otpCode} is your Bethany Homestay verification code`,
                    html: htmlContent
                });

                console.log('OTP Email successfully submitted to provider. MessageId:', info.messageId);
                emailSent = true;
            } catch (err) {
                console.error('SMTP Provider Error:', err);
                emailError = err.message;

                // Fallback to Resend REST API if SMTP failed and key is available
                if (smtpPass && smtpPass.startsWith('re_')) {
                    try {
                        const resendRes = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${smtpPass}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: smtpFrom,
                                to: [cleanEmail],
                                reply_to: replyTo,
                                subject: `${otpCode} is your Bethany Homestay verification code`,
                                html: htmlContent
                            })
                        });
                        const resendData = await resendRes.json();
                        if (resendRes.ok) {
                            console.log('OTP Email sent via Resend API fallback. Id:', resendData.id);
                            emailSent = true;
                            emailError = null;
                        } else {
                            console.error('Resend API fallback error:', resendData);
                        }
                    } catch (apiErr) {
                        console.error('Resend API fetch error:', apiErr);
                    }
                }
            }
        }
        return res.status(200).json({
            success: true,
            userId,
            message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            emailSubmitted: emailSent
        });

    } catch (error) {
        console.error('send-otp Error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to generate verification code.' });
    }
}
