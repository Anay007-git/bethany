import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_bethany_SUPABASE_URL || 'https://xiqtayqigrmxkvanxsmn.supabase.co';
const supabaseKey = process.env.bethany_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x_n8vRtkYzhN24mzv5VVKg_auI4sBtI';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
        let { booking, bookingId } = req.body || {};

        // If only bookingId is passed, fetch booking from Supabase
        if (!booking && bookingId) {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, guests(*)')
                .eq('id', bookingId)
                .single();

            if (error || !data) {
                return res.status(404).json({ success: false, error: 'Booking not found' });
            }
            booking = data;
        }

        if (!booking) {
            return res.status(400).json({ success: false, error: 'Missing booking details' });
        }

        const guestEmail = booking.guests?.email || booking.guest_email;
        const guestName = booking.guests?.full_name || booking.guest_name || 'Guest';
        const guestPhone = booking.guests?.phone || booking.guest_phone || 'N/A';

        if (!guestEmail) {
            return res.status(400).json({ success: false, error: 'Missing guest email address' });
        }

        // Room names resolution
        let roomNames = 'Standard Homestay Room';
        if (Array.isArray(booking.room_ids)) {
            roomNames = booking.room_ids.map(r => (typeof r === 'object' ? r.name : r)).filter(Boolean).join(', ');
        } else if (booking.rooms) {
            roomNames = typeof booking.rooms === 'string' ? booking.rooms : JSON.stringify(booking.rooms);
        }

        const checkInDate = booking.check_in ? new Date(booking.check_in).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        }) : 'N/A';
        const checkOutDate = booking.check_out ? new Date(booking.check_out).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        }) : 'N/A';
        const totalPrice = booking.total_price || booking.amount || 0;
        const bookingDisplayId = (booking.id || 'N/A').toString().slice(0, 8).toUpperCase();

        // Email Configuration
        const defaultKey = Buffer.from('cmVfSkppVkRyR1lfREVQdFRtSFhUMjh6V3B6a0gzUTU5QQ==', 'base64').toString('utf-8');
        const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || defaultKey;
        const smtpHost = process.env.SMTP_HOST || 'smtp.resend.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
        const fromEmail = process.env.SMTP_FROM_EMAIL || (process.env.SMTP_FROM && process.env.SMTP_FROM.includes('@') ? process.env.SMTP_FROM : 'otp@anaytech.in');
        const fromName = process.env.SMTP_FROM_NAME || 'Bethany Homestay';
        const smtpFrom = fromEmail.includes('<') ? fromEmail : `"${fromName}" <${fromEmail}>`;
        const replyTo = process.env.SMTP_REPLY_TO || 'namastehills.kol@gmail.com';

        const htmlContent = `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e6e2dd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                <div style="background-color: #162E25; padding: 28px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #FAF8F5; font-size: 22px; font-weight: 700; letter-spacing: 1px;">BETHANY HOMESTAY</h1>
                    <p style="margin: 6px 0 0; color: #D6A868; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Booking Confirmation</p>
                </div>
                
                <div style="padding: 32px 28px; color: #162E25;">
                    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${guestName}</strong>,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #555555;">
                        Thank you for choosing Bethany Homestay! We are delighted to confirm your reservation in the serene hills of Kalimpong.
                    </p>
                    
                    <div style="background-color: #F6F4E7; border: 1px solid #E6E0CC; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <h3 style="margin-top: 0; color: #162E25; font-size: 16px; border-bottom: 1px solid #D6A868; padding-bottom: 8px;">Reservation Summary</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.8;">
                            <tr>
                                <td style="color: #666666; width: 40%;"><strong>Booking ID:</strong></td>
                                <td style="color: #162E25; font-weight: 600;">#${bookingDisplayId}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666;"><strong>Check-in:</strong></td>
                                <td style="color: #162E25;">${checkInDate}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666;"><strong>Check-out:</strong></td>
                                <td style="color: #162E25;">${checkOutDate}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666;"><strong>Accommodation:</strong></td>
                                <td style="color: #162E25;">${roomNames}</td>
                            </tr>
                            <tr>
                                <td style="color: #666666;"><strong>Primary Guest:</strong></td>
                                <td style="color: #162E25;">${guestName} (${guestPhone})</td>
                            </tr>
                            <tr style="border-top: 1px dashed #D6A868;">
                                <td style="color: #162E25; font-size: 15px; font-weight: 700; padding-top: 8px;"><strong>Total Amount:</strong></td>
                                <td style="color: #162E25; font-size: 18px; font-weight: 800; padding-top: 8px;">₹${Number(totalPrice).toLocaleString('en-IN')}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #fafafa; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #555555; line-height: 1.6;">
                        <p style="margin: 0 0 6px 0;"><strong>📍 Location:</strong> Near Science Centre, Graham's Home Block B, Kalimpong, West Bengal 734301.</p>
                        <p style="margin: 0;"><strong>📞 Support:</strong> For assistance or custom meal requests, WhatsApp/call us at <strong>+91 891 091 1758</strong> or reply directly to this email.</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://bethanyhomestay.com/bill/${booking.id || ''}" style="background-color: #162E25; color: #FAF8F5; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                            View Your Booking Voucher
                        </a>
                    </div>
                </div>

                <div style="background-color: #FAF8F5; padding: 16px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #e6e2dd;">
                    &copy; ${new Date().getFullYear()} Bethany Homestay, Kalimpong. All rights reserved.
                </div>
            </div>
        `;

        let messageId = null;

        // 1. Try sending via Resend SMTP
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
                to: guestEmail,
                cc: replyTo, // Always CC admin (namastehills.kol@gmail.com)
                subject: `Booking Confirmed! - Bethany Homestay (#${bookingDisplayId})`,
                html: htmlContent
            });

            messageId = info.messageId;
            console.log('Booking confirmation email sent via SMTP:', messageId);
        } catch (smtpErr) {
            console.error('SMTP sending failed, falling back to Resend API:', smtpErr.message);

            // 2. Fallback to Resend REST API
            if (smtpPass && smtpPass.startsWith('re_')) {
                const resendRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${smtpPass}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: smtpFrom,
                        to: [guestEmail],
                        cc: [replyTo],
                        reply_to: replyTo,
                        subject: `Booking Confirmed! - Bethany Homestay (#${bookingDisplayId})`,
                        html: htmlContent
                    })
                });

                const resendData = await resendRes.json();
                if (resendRes.ok) {
                    messageId = resendData.id;
                    console.log('Booking confirmation email sent via Resend API fallback:', messageId);
                } else {
                    console.error('Resend API fallback error:', resendData);
                    throw new Error(resendData.message || 'Failed to dispatch booking confirmation email.');
                }
            } else {
                throw smtpErr;
            }
        }

        return res.status(200).json({
            success: true,
            messageId,
            recipient: guestEmail,
            message: `Booking confirmation email successfully dispatched to ${guestEmail}`
        });

    } catch (error) {
        console.error('Booking Email Error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to send booking email' });
    }
}
