# Google Sheet & Apps Script Setup

## 1. Google Sheet Columns
Headers must be:
`A` Timestamp | `B` Name | `C` Email | `D` Phone | `E` Check In | `F` Check Out | `G` Guests | `H` Room Type | `I` Meals | `J` Price Per Night | `K` Number Of Nights | `L` Total Price | `M` Status | `N` Message | `O` Booking ID

## 2. Google Apps Script Code
Copy and paste the **entire code below** into `Extensions > Apps Script`.

```javascript
/* 
   BETHANY HOMESTAY BOOKING SYSTEM
   - Handles Bookings (Save to Sheet)
   - Handles Emails (Pending, Confirmed, Cancelled, Owner)
   - Handles 2-Way Sync (Update Status by ID)
*/

// --- CONFIGURATION ---
const OWNER_EMAIL = 'namastehills.kol@gmail.com'; 
const OWNER_PHONE = '+91 83489 93048';
const HOMESTAY_NAME = 'Namaste Hills';

// --- PART 1: WEB APP HANDLING ---

function doGet(e) {
    var output;
    try {
        const params = e.parameter;
        
        if (params.action === 'getBookings') {
            output = getBookings();
        } else if (params.action === 'updateStatus') {
            output = updateStatus(params);
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

function doPost(e) { return doGet(e); }

// --- PART 2: CORE FUNCTIONS ---

function getBookings() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const bookings = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const status = row[12]; // Column M
        
        if (status && ['cancelled', 'rejected'].indexOf(String(status).toLowerCase()) === -1) {
             bookings.push({
                 checkIn: row[4],
                 checkOut: row[5],
                 roomType: row[7],
                 status: status
             });
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ bookings: bookings }));
}

function updateStatus(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const targetId = params.bookingId;
  const targetStatus = params.status.charAt(0).toUpperCase() + params.status.slice(1).toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][14]); 
    const rowEmail = String(data[i][2]).toLowerCase().trim();
    
    let matchFound = false;

    if (targetId && rowId === targetId) {
        matchFound = true;
    } else if (!targetId && rowEmail === String(params.email).toLowerCase().trim()) {
         const rowDateVal = data[i][4];
         const s = String(rowDateVal);
         if (s.includes(params.checkIn)) matchFound = true;
    }

    if (matchFound) {
       // Update Status
       sheet.getRange(i + 1, 13).setValue(targetStatus);
       
       // Handle Emails based on Status
       const guestName = data[i][1];
       const guestEmail = data[i][2];
       const checkIn = data[i][4];
       
       if (targetStatus.toLowerCase() === 'cancelled') {
           sendCancellationEmail(guestEmail, guestName, checkIn);
       } else if (targetStatus.toLowerCase() === 'booked' || targetStatus.toLowerCase() === 'confirmed') {
           sendConfirmationEmail(guestEmail, guestName, checkIn);
       }
       
       return ContentService.createTextOutput(JSON.stringify({success: true, message: 'Updated via ID/Match'}));
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Booking not found'}));
}

function saveBooking(params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
        new Date(),                      // A
        params.name || '',               // B
        params.email || '',              // C
        params.phone || '',              // D
        params.checkIn || '',            // E
        params.checkOut || '',           // F
        params.guests || '',             // G
        params.roomType || '',           // H
        params.meals || 'None',          // I
        params.pricePerNight || '',      // J
        params.numberOfNights || '',     // K
        params.totalPrice || '',         // L
        'Pending',                       // M
        params.message || '',            // N
        params.bookingId || ''           // O
    ]);

    try { sendPendingEmail(params); } catch (e) {}
    try { sendOwnerNotification(params); } catch (e) {}

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Saved' }));
}

// --- PART 3: EMAIL NOTIFICATIONS ---

function sendPendingEmail(params) {
    const htmlBody = `
    <!DOCTYPE html><html><body style="font-family: Arial, sans-serif;">
      <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #f39c12;">⏳ Booking Pending</h2>
        <p>Dear <strong>${params.name}</strong>,</p>
        <p>We have received your request for <strong>${params.roomType}</strong>.</p>
        <p>Dates: ${params.checkIn} to ${params.checkOut}</p>
        <p>Total: ₹${params.totalPrice}</p>
        <p>Please wait for our confirmation call/email regarding the advance payment.</p>
        <p>📞 Phone: ${OWNER_PHONE}</p>
      </div>
    </body></html>`;
    MailApp.sendEmail({ to: params.email, subject: `Booking Request Received - ${HOMESTAY_NAME}`, htmlBody: htmlBody });
}

function sendConfirmationEmail(email, name, checkInDate) {
    if (!email) return;
    const htmlBody = `
    <!DOCTYPE html><html><body style="font-family: Arial, sans-serif;">
      <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #27ae60;">✅ Booking Confirmed!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Great news! Your stay at ${HOMESTAY_NAME} starting on <strong>${checkInDate}</strong> is confirmed.</p>
        <p>We look forward to hosting you!</p>
        <p>📍 Data: <a href="https://maps.app.goo.gl/YourMapLink">Get Directions</a></p>
        <p>📞 Contact: ${OWNER_PHONE}</p>
      </div>
    </body></html>`;
    MailApp.sendEmail({ to: email, subject: `Booking Confirmed - ${HOMESTAY_NAME}`, htmlBody: htmlBody });
}

function sendCancellationEmail(email, name, checkInDate) {
    if (!email) return;
    const htmlBody = `
    <!DOCTYPE html><html><body style="font-family: Arial, sans-serif;">
      <h2 style="color: #c0392b;">❌ Booking Cancelled</h2>
      <p>Dear ${name}, your booking for ${checkInDate} has been cancelled.</p>
      <p>If this was a mistake, please call us: ${OWNER_PHONE}</p>
    </body></html>`;
    MailApp.sendEmail({ to: email, subject: `Booking Cancelled - ${HOMESTAY_NAME}`, htmlBody: htmlBody });
}

function sendOwnerNotification(params) {
    const htmlBody = `New Booking: ${params.name} | ${params.roomType} | ${params.checkIn}`;
    MailApp.sendEmail({ to: OWNER_EMAIL, subject: `New Booking - ${params.name}`, htmlBody: htmlBody });
}
```
