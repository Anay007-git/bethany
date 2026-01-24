import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SupabaseService } from '../services/SupabaseService';

/**
 * iCal Export Component
 * Returns iCal format for a specific room's bookings
 * URL: /ical/:roomId
 * 
 * OTAs can import this URL to sync your direct bookings
 */
const IcalExport = () => {
    const { roomId } = useParams();
    const [icalContent, setIcalContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const generateIcal = async () => {
            try {
                // Fetch all bookings
                const stats = await SupabaseService.getDashboardStats();
                const allBookings = stats?.recentBookings || [];

                // Filter bookings for this room
                const roomBookings = allBookings.filter(b => {
                    if (!b.room_ids) return false;
                    return b.room_ids.some(r =>
                        r.id === roomId ||
                        r.name?.toLowerCase().includes(roomId.toLowerCase())
                    );
                });

                // Generate iCal content
                const events = roomBookings
                    .filter(b => ['booked', 'confirmed', 'pending'].includes(b.status?.toLowerCase()))
                    .map(b => {
                        const checkIn = new Date(b.check_in);
                        const checkOut = new Date(b.check_out);
                        const uid = `${b.id}@bethany-homestay`;
                        const summary = `Bethany Direct Booking`;

                        // Format dates as YYYYMMDD
                        const formatDate = (d) => {
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            return `${year}${month}${day}`;
                        };

                        return [
                            'BEGIN:VEVENT',
                            `DTSTART;VALUE=DATE:${formatDate(checkIn)}`,
                            `DTEND;VALUE=DATE:${formatDate(checkOut)}`,
                            `SUMMARY:${summary}`,
                            'TRANSP:OPAQUE',
                            `UID:${uid}`,
                            'END:VEVENT'
                        ].join('\r\n');
                    });

                const ical = [
                    'BEGIN:VCALENDAR',
                    'PRODID:-//Bethany Homestay//Direct Bookings//EN',
                    'VERSION:2.0',
                    'CALSCALE:GREGORIAN',
                    'METHOD:PUBLISH',
                    `X-WR-CALNAME:Bethany ${roomId} Bookings`,
                    ...events,
                    'END:VCALENDAR'
                ].join('\r\n');

                setIcalContent(ical);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        generateIcal();
    }, [roomId]);

    // Display raw iCal text
    if (loading) {
        return <pre style={{ fontFamily: 'monospace', padding: '20px' }}>Loading calendar...</pre>;
    }

    if (error) {
        return <pre style={{ fontFamily: 'monospace', padding: '20px', color: 'red' }}>Error: {error}</pre>;
    }

    return (
        <pre style={{
            fontFamily: 'monospace',
            padding: '20px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
        }}>
            {icalContent}
        </pre>
    );
};

export default IcalExport;
