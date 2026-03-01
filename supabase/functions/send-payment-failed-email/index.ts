// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createTransport } from "npm:nodemailer@6.9.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingData {
  id: string;
  guests: {
    full_name: string;
    email: string;
    phone: string;
  };
  check_in: string;
  check_out: string;
  total_price: number;
  room_ids: { name: string }[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { booking }: { booking: BookingData } = await req.json();

    if (!booking || !booking.guests?.email) {
      throw new Error("Missing booking data or guest email");
    }

    // SMTP Configuration from Environment Variables
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Missing SMTP Environment Variables");
      throw new Error("Server Misconfiguration: Missing SMTP details");
    }

    const transporter = createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const roomNames = booking.room_ids.map(r => r.name).join(', ');
    const checkInDate = new Date(booking.check_in).toLocaleDateString('en-IN');
    const checkOutDate = new Date(booking.check_out).toLocaleDateString('en-IN');

    // Email to Guest
    const mailOptions = {
      from: `"Bethany Homestay" <info@bethanyhomestay.com>`,
      to: booking.guests.email,
      cc: "namastehills.kol@gmail.com", // Copy to Admin
      subject: `Payment Declined - Bethany Homestay (#${booking.id.slice(0, 8)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #dc2626; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Payment Declined</h1>
            <p style="margin: 10px 0 0;">Namaste Hills - Bethany Homestay</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear <strong>${booking.guests.full_name}</strong>,</p>
            <p>We're writing to let you know that your recent PhonePe payment attempt was declined or cancelled.</p>
            <p>Don't worry, your reservation details are safe with us! You can easily try your payment again to secure your rooms.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #dc2626;">Pending Reservation Details</h3>
              <p><strong>Pending Booking ID:</strong> ${booking.id.split('-')[0].toUpperCase()}</p>
              <p><strong>Check-in:</strong> ${checkInDate}</p>
              <p><strong>Check-out:</strong> ${checkOutDate}</p>
              <p><strong>Rooms:</strong> ${roomNames}</p>
              <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
              <p style="font-size: 1.2em; font-weight: bold;">Total Amount: ₹${booking.total_price.toLocaleString('en-IN')}</p>
            </div>

            <p>If you have any questions or are experiencing persistent issues with the payment gateway, please reply to this email or call/WhatsApp us at <strong>+91 891 091 1758</strong>.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://bethanyhomestay.com/" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold;">Try Booking Again</a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} Bethany Homestay. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    return new Response(JSON.stringify({ success: true, message: "Declined Payment Email sent successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-payment-failed-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
