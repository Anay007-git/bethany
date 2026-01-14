# Google Sheet & Apps Script Setup

To receive **Meal Details** and retain your **Email Notifications**, please replace your **entire** Apps Script with the code below.

## 1. Update Your Google Sheet Columns
**IMPORTANT:** Because we are adding a "Meals" column, the column order changes. Please adjust your Google Sheet Header Row (Row 1) to match this **New Order**:

| Col A | Col B | Col C | Col D | Col E | Col F | Col G | Col H | **Col I** | Col J | Col K | Col L | Col M | Col N |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Timestamp | Name | Email | Phone | Check-In | Check-Out | Guests | Room Type | **Meals** | Price/Night | Nights | Total Price | Status | Message |

> *Note: pass "Status" moves to Column M, "Message" to Column N.*

---

## 2. Updated Apps Script Code
Copy **ALL** of the code below and replace everything in your `Code.gs` file.

```javascript
/* 
   UPDATED SCRIPT (2026-01-15)
   - Added 'Meals' column support
   - Included 'Meal Plan' in Email Notifications
   - Updated Column Indexes for Status/Availability Check
*/

const OWNER_EMAIL = 'biswasanay07@gmail.com';  // Your email
const OWNER_PHONE = '+91 94478 24335';         // Your phone (Update if needed)
const HOMESTAY_NAME = 'Bethany Homestay';
const HOMESTAY_ADDRESS = 'Munnar, Kerala, India';

// Handle GET requests
function doGet(e) {
    var output;
    try {
        const params = e.parameter;
        if (params.action === 'getBookings') {
            output = getBookings();
        } else if (params.name) {
            output = saveBooking(params);
        } else {
            output = ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No valid action' }));
        }
    } catch (error) {
        output = ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }));
    }
    return output.setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests
function doPost(e) { return doGet(e); }

// Save a new booking
function saveBooking(params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add new row with booking data including MEALS
    sheet.appendRow([
        new Date(),                      // A: Timestamp
        params.name || '',               // B: Name
        params.email || '',              // C: Email
        params.phone || '',              // D: Phone
        params.checkIn || '',            // E: Check-in
        params.checkOut || '',           // F: Check-out
        params.guests || '',             // G: Guests
        params.roomType || '',           // H: Room Type
        params.meals || 'None',          // I: MEALS (NEW)
        params.pricePerNight || '',      // J: Price/Night
        params.numberOfNights || '',     // K: Nights
        params.totalPrice || '',         // L: Total Price
        'Pending',                       // M: Status (Moved)
        params.message || ''             // N: Special Requests
    ]);

    // Send emails
    try { sendCustomerEmail(params); } catch (e) { console.log('Customer email error:', e); }
    try { sendOwnerNotification(params); } catch (e) { console.log('Owner email error:', e); }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Booking saved successfully' }));
}

// Send confirmation email to customer
function sendCustomerEmail(params) {
    const customerEmail = params.email;
    if (!customerEmail) return;

    const subject = `🏡 Booking Request Received - ${HOMESTAY_NAME}`;
    
    // HTML Template
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
        .status-badge { display: inline-block; background: #ffc107; color: #333; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🏡 ${HOMESTAY_NAME}</h1><p>Booking Request Confirmation</p></div>
        <div class="content">
          <p>Dear <strong>${params.name}</strong>,</p>
          <p>Thank you for choosing ${HOMESTAY_NAME}! We have received your booking request.</p>
          <p style="text-align: center;"><span class="status-badge">⏳ PENDING CONFIRMATION</span></p>
          
          <div class="booking-details">
            <h3 style="margin-top: 0; color: #FF5A5F;">📋 Booking Details</h3>
            <div class="detail-row"><span class="detail-label">Room Type:</span><span class="detail-value">${params.roomType}</span></div>
            <div class="detail-row"><span class="detail-label">Check-in:</span><span class="detail-value">${params.checkIn}</span></div>
            <div class="detail-row"><span class="detail-label">Check-out:</span><span class="detail-value">${params.checkOut}</span></div>
            <div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${params.numberOfNights} night(s)</span></div>
            <div class="detail-row"><span class="detail-label">Guests:</span><span class="detail-value">${params.guests}</span></div>
            ${params.meals && params.meals !== 'None' ? 
            `<div class="detail-row" style="flex-direction:column; align-items:flex-start;">
                <span class="detail-label" style="margin-bottom:5px;">Meal Plan:</span>
                <span class="detail-value" style="font-size:0.9em; color:#555;">${params.meals}</span>
             </div>` : ''}
            <div class="total-row">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Amount:</span><span style="font-size: 24px; font-weight: bold;">₹${params.totalPrice}</span>
              </div>
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="color: #856404; font-weight: bold; margin-bottom: 10px;">⚠️ Action Required</div>
            <p>To confirm your booking, please contact us for advance payment:</p>
            <p><strong>📞 Phone:</strong> ${OWNER_PHONE}<br><strong>📧 Email:</strong> ${OWNER_EMAIL}</p>
          </div>
          
          <p>Warm regards,<br><strong>Team ${HOMESTAY_NAME}</strong></p>
        </div>
      </div>
    </body>
    </html>`;

    MailApp.sendEmail({
        to: customerEmail,
        subject: subject,
        body: `Booking Received. Total: ₹${params.totalPrice}. Please check HTML email.`,
        htmlBody: htmlBody
    });
}

// Send notification to owner
function sendOwnerNotification(params) {
    const subject = `🔔 New Booking - ${params.roomType} (${params.checkIn})`;
    
    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><style>.row { padding: 5px 0; border-bottom: 1px solid #eee; }</style></head>
    <body>
      <h2 style="color: #28a745;">🔔 New Booking Request</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3>Customer:</h3>
        <div class="row"><strong>Name:</strong> ${params.name}</div>
        <div class="row"><strong>Phone:</strong> ${params.phone}</div>
        <div class="row"><strong>Email:</strong> ${params.email}</div>
        
        <h3>Details:</h3>
        <div class="row"><strong>Room:</strong> ${params.roomType}</div>
        <div class="row"><strong>Dates:</strong> ${params.checkIn} to ${params.checkOut}</div>
        <div class="row"><strong>Meals:</strong> ${params.meals || 'None'}</div>
        <div class="row"><strong>Total:</strong> ₹${params.totalPrice}</div>
        <div class="row"><strong>Message:</strong> ${params.message || 'None'}</div>
      </div>
    </body>
    </html>`;

    MailApp.sendEmail({
        to: OWNER_EMAIL,
        subject: subject,
        body: `New Booking: ${params.name}, ${params.roomType}, Total: ₹${params.totalPrice}`,
        htmlBody: htmlBody
    });
}

// Get existing bookings (UPDATED COLUMN INDEXES)
function getBookings() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const bookings = [];

    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        
        // COLUMN INDEXES SHIFTED BY 1 DUE TO 'MEALS' (Col I)
        // Check-in (E) = row[4], Check-out (F) = row[5] -> Unchanged
        // RoomType (H) = row[7] -> Unchanged
        // Status is now Column M = row[12] (Previously L/11)
        
        var status = String(row[12] || '').trim(); 
        var roomType = String(row[7] || '').trim();
        var checkIn = row[4];
        var checkOut = row[5];

        if (status === 'Pending' || status === 'Booked') {
            var checkInStr = (checkIn instanceof Date) ? Utilities.formatDate(checkIn, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(checkIn);
            var checkOutStr = (checkOut instanceof Date) ? Utilities.formatDate(checkOut, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(checkOut);
            
            bookings.push({ checkIn: checkInStr, checkOut: checkOutStr, roomType: roomType, status: status });
        }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, bookings: bookings }));
}
```

### **3. Deploy**
1. **Extensions** > **Apps Script**.
2. Paste the code above.
3. **Deploy** > **Manage deployments** > **Edit** (Pencil icon) > **New Version** > **Deploy**.
