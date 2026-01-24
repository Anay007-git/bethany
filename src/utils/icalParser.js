/**
 * iCal Parser Utility
 * Parses iCal (.ics) format from OTA platforms like Goibibo, Booking.com, Airbnb
 */

// CORS proxy to bypass browser restrictions
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Fetches and parses an iCal URL, returning blocked date ranges
 * @param {string} icalUrl - The iCal URL from OTA platform
 * @returns {Promise<{success: boolean, dates: Array<{start: string, end: string, summary: string}>}>}
 */
export async function fetchIcalDates(icalUrl) {
    try {
        if (!icalUrl || !icalUrl.trim()) {
            return { success: false, error: 'No URL provided', dates: [] };
        }

        // Fetch via CORS proxy
        const proxyUrl = CORS_PROXY + encodeURIComponent(icalUrl);
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const icalText = await response.text();
        const dates = parseIcal(icalText);

        return { success: true, dates };
    } catch (error) {
        return { success: false, error: error.message, dates: [] };
    }
}

/**
 * Parses iCal text content into date objects
 * @param {string} icalText - Raw iCal text
 * @returns {Array<{start: string, end: string, summary: string}>}
 */
function parseIcal(icalText) {
    const events = [];
    const lines = icalText.split(/\r?\n/);

    let currentEvent = null;

    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') {
            currentEvent = { start: '', end: '', summary: '' };
        } else if (line === 'END:VEVENT' && currentEvent) {
            if (currentEvent.start) {
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            // Parse DTSTART
            if (line.startsWith('DTSTART')) {
                const dateMatch = line.match(/(\d{8})/);
                if (dateMatch) {
                    currentEvent.start = formatIcalDate(dateMatch[1]);
                }
            }
            // Parse DTEND
            if (line.startsWith('DTEND')) {
                const dateMatch = line.match(/(\d{8})/);
                if (dateMatch) {
                    currentEvent.end = formatIcalDate(dateMatch[1]);
                }
            }
            // Parse SUMMARY
            if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.replace('SUMMARY:', '').trim();
            }
        }
    }

    return events;
}

/**
 * Converts YYYYMMDD to YYYY-MM-DD
 */
function formatIcalDate(icalDate) {
    if (icalDate.length !== 8) return icalDate;
    return `${icalDate.slice(0, 4)}-${icalDate.slice(4, 6)}-${icalDate.slice(6, 8)}`;
}

/**
 * Checks if a date range overlaps with any blocked dates
 * @param {string} checkIn - Check-in date (YYYY-MM-DD)
 * @param {string} checkOut - Check-out date (YYYY-MM-DD)
 * @param {Array} blockedDates - Array of {start, end} blocked ranges
 * @returns {boolean} - True if overlaps (unavailable)
 */
export function hasOverlap(checkIn, checkOut, blockedDates) {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    for (const block of blockedDates) {
        const blockStart = new Date(block.start);
        const blockEnd = new Date(block.end);

        // Check overlap: !(outDate <= blockStart || inDate >= blockEnd)
        if (!(outDate <= blockStart || inDate >= blockEnd)) {
            return true;
        }
    }

    return false;
}
