/**
 * Google Apps Script for Bethany Homestay Booking System
 * WITH EMAIL NOTIFICATIONS
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace all existing code with this script
 * 4. Save the script (Ctrl+S)
 * 5. Deploy as Web App:
 *    - Click "Deploy" > "New Deployment"
 *    - Select type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 *    - Click "Deploy"
 * 6. Copy the new Web App URL and update it in BookingForm.jsx (line 65)
 * 
 * SHEET COLUMNS (ensure these exist in order):
 * A: Timestamp, B: Name, C: Email, D: Phone, E: Check-in, F: Check-out,
 * G: Guests, H: Room Type, I: Price/Night, J: Nights, K: Total Price, L: Status, M: Message
 * 
 * EMAIL NOTIFICATIONS:
 * - Customer receives a confirmation email with booking details
 * - Owner receives a notification about the new booking
 */

// ============== CONFIGURATION ==============
// Update these values with your actual details
const OWNER_EMAIL = 'biswasanay07@gmail.com';  // Your email to receive booking notifications
const OWNER_PHONE = '+91 XXXXX XXXXX';         // Your phone number for customers to contact
const HOMESTAY_NAME = 'Bethany Homestay';
const HOMESTAY_ADDRESS = 'Munnar, Kerala, India';

// ============================================

// Handle GET requests
function doGet(e) {
    var output;

    try {
        const params = e.parameter;

        // If action is getBookings, return existing bookings for availability check
        if (params.action === 'getBookings') {
            output = getBookings();
        } else if (params.name) {
            // Save a new booking if name parameter exists
            output = saveBooking(params);
        } else {
            output = ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'No valid action specified'
            }));
        }
    } catch (error) {
        output = ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        }));
    }

    // Set MIME type and return
    return output.setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests (same as GET for simplicity)
function doPost(e) {
    return doGet(e);
}

// Save a new booking to the sheet and send confirmation emails
function saveBooking(params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add new row with booking data
    sheet.appendRow([
        new Date(),                      // A: Timestamp
        params.name || '',               // B: Name
        params.email || '',              // C: Email
        params.phone || '',              // D: Phone
        params.checkIn || '',            // E: Check-in Date
        params.checkOut || '',           // F: Check-out Date
        params.guests || '',             // G: Number of Guests
        params.roomType || '',           // H: Room Type
        params.pricePerNight || '',      // I: Price per Night
        params.numberOfNights || '',     // J: Number of Nights
        params.totalPrice || '',         // K: Total Price
        'Pending',                       // L: Status (Always Pending for new bookings)
        params.message || ''             // M: Special Requests
    ]);

    // Send confirmation email to customer
    try {
        sendCustomerEmail(params);
    } catch (emailError) {
        console.log('Customer email error:', emailError);
    }

    // Send notification email to owner
    try {
        sendOwnerNotification(params);
    } catch (emailError) {
        console.log('Owner email error:', emailError);
    }

    return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Booking saved and emails sent successfully'
    }));
}

// Send confirmation email to customer
function sendCustomerEmail(params) {
    const customerEmail = params.email;
    if (!customerEmail) return;

    const subject = `🏡 Booking Request Received - ${HOMESTAY_NAME}`;

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF5A5F, #E04B50); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5A5F; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { color: #666; }
        .detail-value { font-weight: bold; color: #333; }
        .total-row { background: #FF5A5F; color: white; padding: 15px; margin: 10px -20px -20px; border-radius: 0 0 8px 8px; }
        .action-box { background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .action-title { color: #856404; font-weight: bold; font-size: 18px; margin-bottom: 10px; }
        .contact-info { background: white; padding: 15px; border-radius: 8px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .status-badge { display: inline-block; background: #ffc107; color: #333; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 ${HOMESTAY_NAME}</h1>
          <p>Booking Request Confirmation</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${params.name}</strong>,</p>
          
          <p>Thank you for choosing ${HOMESTAY_NAME}! We have received your booking request.</p>
          
          <p style="text-align: center;">
            <span class="status-badge">⏳ PENDING CONFIRMATION</span>
          </p>
          
          <div class="booking-details">
            <h3 style="margin-top: 0; color: #FF5A5F;">📋 Booking Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Room Type:</span>
              <span class="detail-value">${params.roomType}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Check-in Date:</span>
              <span class="detail-value">${params.checkIn}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Check-out Date:</span>
              <span class="detail-value">${params.checkOut}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Number of Nights:</span>
              <span class="detail-value">${params.numberOfNights} night(s)</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Number of Guests:</span>
              <span class="detail-value">${params.guests}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Rate per Night:</span>
              <span class="detail-value">₹${params.pricePerNight}</span>
            </div>
            
            <div class="total-row">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Amount:</span>
                <span style="font-size: 24px; font-weight: bold;">₹${params.totalPrice}</span>
              </div>
            </div>
          </div>
          
          <div class="action-box">
            <div class="action-title">⚠️ Action Required - Confirm Your Booking</div>
            <p>To confirm your booking, please contact us for advance payment:</p>
            
            <div class="contact-info">
              <p><strong>📞 Phone/WhatsApp:</strong> ${OWNER_PHONE}</p>
              <p><strong>📧 Email:</strong> ${OWNER_EMAIL}</p>
              <p><strong>📍 Address:</strong> ${HOMESTAY_ADDRESS}</p>
            </div>
            
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <em>Note: Your booking will be confirmed once advance payment is received. 
              Rooms are subject to availability until confirmed.</em>
            </p>
          </div>
          
          ${params.message ? `
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <strong>Your Special Requests:</strong>
            <p style="margin: 10px 0 0;">${params.message}</p>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">We look forward to hosting you!</p>
          
          <p>Warm regards,<br>
          <strong>Team ${HOMESTAY_NAME}</strong></p>
        </div>
        
        <div class="footer">
          <p>${HOMESTAY_NAME} | ${HOMESTAY_ADDRESS}</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const plainTextBody = `
Dear ${params.name},

Thank you for choosing ${HOMESTAY_NAME}! We have received your booking request.

STATUS: PENDING CONFIRMATION

BOOKING DETAILS:
- Room Type: ${params.roomType}
- Check-in: ${params.checkIn}
- Check-out: ${params.checkOut}
- Duration: ${params.numberOfNights} night(s)
- Guests: ${params.guests}
- Rate: ₹${params.pricePerNight}/night
- TOTAL: ₹${params.totalPrice}

ACTION REQUIRED - CONFIRM YOUR BOOKING:
To confirm your booking, please contact us for advance payment:

📞 Phone/WhatsApp: ${OWNER_PHONE}
📧 Email: ${OWNER_EMAIL}
📍 Address: ${HOMESTAY_ADDRESS}

Note: Your booking will be confirmed once advance payment is received.

${params.message ? `Your Special Requests: ${params.message}` : ''}

We look forward to hosting you!

Warm regards,
Team ${HOMESTAY_NAME}
  `;

    MailApp.sendEmail({
        to: customerEmail,
        subject: subject,
        body: plainTextBody,
        htmlBody: htmlBody
    });
}

// Send notification email to owner about new booking
function sendOwnerNotification(params) {
    const subject = `🔔 New Booking Request - ${params.roomType} (${params.checkIn} to ${params.checkOut})`;

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .alert { background: #d4edda; border: 1px solid #28a745; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .row { padding: 10px 0; border-bottom: 1px solid #ddd; }
        .label { color: #666; }
        .value { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="alert">
        <h2 style="margin-top: 0; color: #28a745;">🔔 New Booking Request!</h2>
        <p>A new booking has been submitted on the website.</p>
      </div>
      
      <div class="details">
        <h3>Customer Details:</h3>
        <div class="row"><span class="label">Name:</span> <span class="value">${params.name}</span></div>
        <div class="row"><span class="label">Email:</span> <span class="value">${params.email}</span></div>
        <div class="row"><span class="label">Phone:</span> <span class="value">${params.phone}</span></div>
        
        <h3 style="margin-top: 20px;">Booking Details:</h3>
        <div class="row"><span class="label">Room:</span> <span class="value">${params.roomType}</span></div>
        <div class="row"><span class="label">Check-in:</span> <span class="value">${params.checkIn}</span></div>
        <div class="row"><span class="label">Check-out:</span> <span class="value">${params.checkOut}</span></div>
        <div class="row"><span class="label">Nights:</span> <span class="value">${params.numberOfNights}</span></div>
        <div class="row"><span class="label">Guests:</span> <span class="value">${params.guests}</span></div>
        <div class="row"><span class="label">Total Amount:</span> <span class="value" style="color: #28a745; font-size: 18px;">₹${params.totalPrice}</span></div>
        
        ${params.message ? `
        <h3 style="margin-top: 20px;">Special Requests:</h3>
        <div class="row">${params.message}</div>
        ` : ''}
      </div>
      
      <p style="margin-top: 20px; color: #666;">
        <em>Please contact the customer to collect advance payment and confirm the booking.
        Update the status to "Booked" in the Google Sheet once confirmed.</em>
      </p>
    </body>
    </html>
  `;

    MailApp.sendEmail({
        to: OWNER_EMAIL,
        subject: subject,
        body: `New booking request from ${params.name} for ${params.roomType}. Check-in: ${params.checkIn}, Check-out: ${params.checkOut}. Total: ₹${params.totalPrice}. Contact: ${params.phone}, ${params.email}`,
        htmlBody: htmlBody
    });
}

// Get existing bookings for availability check
function getBookings() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row, convert to objects
    const bookings = [];

    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var status = String(row[11] || '').trim(); // Column L: Status
        var roomType = String(row[7] || '').trim(); // Column H: Room Type
        var checkIn = row[4]; // Column E: Check-in
        var checkOut = row[5]; // Column F: Check-out

        // Only include bookings with status "Pending" or "Booked"
        if (status === 'Pending' || status === 'Booked') {
            // Format dates as strings
            var checkInStr = '';
            var checkOutStr = '';

            if (checkIn instanceof Date) {
                checkInStr = Utilities.formatDate(checkIn, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } else {
                checkInStr = String(checkIn);
            }

            if (checkOut instanceof Date) {
                checkOutStr = Utilities.formatDate(checkOut, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } else {
                checkOutStr = String(checkOut);
            }

            bookings.push({
                checkIn: checkInStr,
                checkOut: checkOutStr,
                roomType: roomType,
                status: status
            });
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        success: true,
        bookings: bookings,
        count: bookings.length
    }));
}

// Test function - run this to verify email works
function testEmail() {
    sendCustomerEmail({
        name: 'Test Customer',
        email: OWNER_EMAIL, // Send test to yourself
        phone: '+91 98765 43210',
        checkIn: '2026-01-15',
        checkOut: '2026-01-17',
        numberOfNights: '2',
        guests: '2',
        roomType: 'Carmel',
        pricePerNight: '1241',
        totalPrice: '2482',
        message: 'This is a test booking'
    });
    Logger.log('Test email sent!');
}
