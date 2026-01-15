# Google Sheet & Apps Script Setup

To receive **Meal Details** and enable **Automatic "Booked" Confirmation Emails**, using the code below.

## 1. Update Your Google Sheet Columns
**IMPORTANT:** Column order is critical. Please match this exact order:

| A | B | C | D | E | F | G | H | **I** | J | K | L | M | N |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Timestamp | Name | Email | Phone | Check-In | Check-Out | Guests | Room Type | **Meals** | Price/Night | Nights | Total Price | Status | Message |

> *Note: "Status" must be Column M.*

---

## 2. Updated Apps Script Code
Copy **ALL** of the code below and replace everything in your `Code.gs` file.

```javascript
/* -----------------------------------------------------------
   BETHANY HOMESTAY BACKEND SCRIPT
   - Handles form submissions (doPost)
   - Handles availability checks (doGet)
   - Sends Confirmation Emails on "Booked" status change
   ----------------------------------------------------------- */

const OWNER_EMAIL = 'biswasanay07@gmail.com'; 
const OWNER_PHONE = '+91 94478 24335';
const HOMESTAY_NAME = 'Bethany Homestay';
const HOMESTAY_ADDRESS = 'Munnar, Kerala, India';

// --- PART 1: WEB APP HANDLING ---

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

function doPost(e) { return doGet(e); }

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
        'Pending',                       // M (Status)
        params.message || ''             // N
    ]);

    try { sendCustomerEmail(params); } catch (e) { console.log('Customer email error:', e); }
    try { sendOwnerNotification(params); } catch (e) { console.log('Owner email error:', e); }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Booking saved successfully' }));
}

// --- PART 2: EMAIL NOTIFICATIONS (SUBMISSION) ---

function sendCustomerEmail(params) {
    const customerEmail = params.email;
    if (!customerEmail) return;

    const subject = `🏡 Booking Request Received - ${HOMESTAY_NAME}`;
    const htmlBody = `
    <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #E04B50;">🏡 Booking Request Received</h2>
        <p>Dear <strong>${params.name}</strong>,</p>
        <p>Thank you for choosing ${HOMESTAY_NAME}. Status: <strong style="color:orange">PENDING</strong></p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
          <p><strong>Room:</strong> ${params.roomType}</p>
          <p><strong>Dates:</strong> ${params.checkIn} to ${params.checkOut}</p>
          <p><strong>Meals:</strong> ${params.meals || 'None'}</p>
          <p><strong>Total:</strong> ₹${params.totalPrice}</p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-top: 15px; border-radius: 5px;">
          <strong>⚠️ Action Required:</strong><br>
          Please contact us to pay the advance and confirm your booking.<br>
          📞 Phone: ${OWNER_PHONE}
        </div>
      </div>
    </body></html>`;

    MailApp.sendEmail({ to: customerEmail, subject: subject, htmlBody: htmlBody });
}

function sendOwnerNotification(params) {
    const subject = `🔔 New Booking - ${params.roomType}`;
    const htmlBody = `
    <!DOCTYPE html><html><body>
      <h2 style="color:green;">New Booking Request</h2>
      <p><strong>Name:</strong> ${params.name}</p>
      <p><strong>Phone:</strong> ${params.phone}</p>
      <p><strong>Room:</strong> ${params.roomType}</p>
      <p><strong>Dates:</strong> ${params.checkIn} to ${params.checkOut}</p>
      <p><strong>Meals:</strong> ${params.meals || 'None'}</p>
      <p><strong>Total:</strong> ₹${params.totalPrice}</p>
      <p><strong>Message:</strong> ${params.message}</p>
    </body></html>`;

    MailApp.sendEmail({ to: OWNER_EMAIL, subject: subject, htmlBody: htmlBody });
}

// --- PART 3: TRIGGER ON EDIT (STATUS CHANGE) ---

/* 
   IMPORTANT: This function runs when you edit the sheet.
   It checks if you changed Column M (13) to 'Booked'.
*/
function onStatusEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();
  var val = range.getValue();
  
  // Column M is index 13.
  if (col === 13 && row > 1 && String(val).toLowerCase() === 'booked') {
    
    // Get row data
    // Indexes are 0-based in the array: 
    // Col B (Name) = 1, Col C (Email) = 2, Col E (In) = 4, Col F (Out) = 5
    // Col H (Room) = 7, Col L (Total) = 11
    
    var data = sheet.getRange(row, 1, 1, 14).getValues()[0];
    
    var customerName = data[1];
    var customerEmail = data[2];
    var checkIn = formatDate(data[4]);
    var checkOut = formatDate(data[5]);
    var roomName = data[7];
    var totalAmount = data[11];
    
    if (customerEmail) {
      sendConfirmationSuccessEmail(customerName, customerEmail, roomName, checkIn, checkOut, totalAmount);
    }
  }
}

function sendConfirmationSuccessEmail(name, email, room, checkIn, checkOut, total) {
  var subject = `✅ Booking Confirmed! - ${HOMESTAY_NAME}`;
  var htmlBody = `
    <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; padding: 20px; border: 1px solid #27ae60; border-radius: 8px;">
        <h2 style="color: #27ae60;">✅ Booking Confirmed!</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>We are happy to confirm your stay at ${HOMESTAY_NAME}.</p>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Room:</strong> ${room}</p>
          <p><strong>Check-in:</strong> ${checkIn}</p>
          <p><strong>Check-out:</strong> ${checkOut}</p>
          <p><strong>Total Amount:</strong> ₹${total}</p>
        </div>
        
        <p>See you soon!</p>
        <p><strong>${HOMESTAY_NAME}</strong><br>${HOMESTAY_ADDRESS}<br>📞 ${OWNER_PHONE}</p>
      </div>
    </body></html>`;
    
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

// Helper
function formatDate(dateVal) {
  if (dateVal instanceof Date) { return Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
  return dateVal;
}

// --- PART 4: DATA FETCHING ---

function getBookings() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const bookings = [];

    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        // Status is Column M (index 12)
        var status = String(row[12] || '').trim(); 
        var roomType = String(row[7] || '').trim(); // Col H
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

## 3. IMPORTANT: Enable the Trigger
For the "Booked" confirmation to work, you must set up an **Installable Trigger**. Simple `onEdit` triggers cannot send emails.

1.  In the Apps Script Editor, click the **Triggers** icon (Clock 🕒) on the left sidebar.
2.  Click **+ Add Trigger** (blue button at bottom right).
3.  Configure these **exact settings**:
    *   **Choose which function to run**: `onStatusEdit`
    *   **Choose which deployment should run**: `Head`
    *   **Select event source**: `From spreadsheet`
    *   **Select event type**: `On edit`
4.  Click **Save**.
5.  It will ask for permissions again (because it now needs to "See your spreadsheets" and "Send email as you" whenever an edit happens). **Accept/Allow**.

Now, whenever you manually type "Booked" (or select it from a dropdown) in **Column M**, the email will fire! 🚀
