/* 
   UPDATED SCRIPT (Fix for "Result not showing on website")
   - Makes status check case-insensitive (Matches "Booked", "booked", "BOOKED")
   - Ensures correct column reading
*/

// ... (previous setup constants) ...
const OWNER_EMAIL = 'namastehills.kol@gmail.com'; 
const OWNER_PHONE = '+91 83489 93048';
const HOMESTAY_NAME = 'Namaste Hills';
const HOMESTAY_ADDRESS = 'Kalimpong, West Bengal, India';

// --- PART 1: WEB APP HANDLING ---

function doGet(e) {
    var output;
    try {
        const params = e.parameter;
        // ... (rest of doGet) ...
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
   // ... (same as before) ...
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

// ... (Email functions sendCustomerEmail, sendOwnerNotification same as before) ...

// --- PART 2: EMAILS (Please keep previous email functions) ---
function sendCustomerEmail(params) {
    // ... (Keep existing code) ...
    const customerEmail = params.email;
    if (!customerEmail) return;

    const subject = `🏡 Booking Request Received - ${HOMESTAY_NAME}`;
    const htmlBody = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;">
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
    // ... (Keep existing code) ...
    const subject = `🔔 New Booking - ${params.roomType}`;
    const htmlBody = `<!DOCTYPE html><html><body>
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
function onStatusEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();
  var val = range.getValue();
  
  // Column M (Status) is index 13
  // Check against 'booked' (lowercase) to be safe
  if (col === 13 && row > 1 && String(val).toLowerCase() === 'booked') {
    
    var data = sheet.getRange(row, 1, 1, 14).getValues()[0];
    // ... (fetch logic) ...
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
  // ... (Keep existing code) ...
  var subject = `✅ Booking Confirmed! - ${HOMESTAY_NAME}`;
  var htmlBody = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;">
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

function formatDate(dateVal) {
  if (dateVal instanceof Date) { return Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
  return dateVal;
}

// --- PART 4: DATA FETCHING (UPDATED FOR ROBUSTNESS) ---

function getBookings() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const bookings = [];

    // Log for debugging
    console.log("Fetching bookings, total rows: " + data.length);

    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        
        // Status is Column M (index 12)
        var rawStatus = String(row[12] || '').trim();
        var statusLower = rawStatus.toLowerCase();
        
        var roomType = String(row[7] || '').trim(); // Col H
        var checkIn = row[4];
        var checkOut = row[5];

        // CHECK 1: Is it a valid status? (Case Insensitive)
        if (statusLower === 'pending' || statusLower === 'booked' || statusLower === 'confirmed') {
            
            var checkInStr = (checkIn instanceof Date) ? Utilities.formatDate(checkIn, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(checkIn);
            var checkOutStr = (checkOut instanceof Date) ? Utilities.formatDate(checkOut, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(checkOut);
            
            // Return standardized status (Title Case) so frontend likes it
            var normalizedStatus = (statusLower === 'booked' || statusLower === 'confirmed') ? 'Booked' : 'Pending';

            bookings.push({ 
                checkIn: checkInStr, 
                checkOut: checkOutStr, 
                roomType: roomType, 
                status: normalizedStatus 
            });
        }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, bookings: bookings }));
}
