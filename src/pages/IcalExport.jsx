import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SupabaseService } from '../services/SupabaseService';

/**
 * iCal Export Component
 * Returns downloadable .ics file for a specific room's bookings
 * URL: /ical/:roomId
 */
const IcalExport = () => {
    const { roomId } = useParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const generateAndDownload = async () => {
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

                // Format date as YYYYMMDD
                const formatDate = (d) => {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}${month}${day}`;
                };

                // Generate iCal events
                const events = roomBookings
                    .filter(b => ['booked', 'confirmed', 'pending'].includes(b.status?.toLowerCase()))
                    .map(b => {
                        const checkIn = new Date(b.check_in);
                        const checkOut = new Date(b.check_out);
                        const uid = `${b.id}@bethany-homestay`;

                        return [
                            'BEGIN:VEVENT',
                            `DTSTART;VALUE=DATE:${formatDate(checkIn)}`,
                            `DTEND;VALUE=DATE:${formatDate(checkOut)}`,
                            `SUMMARY:Bethany Direct Booking`,
                            'TRANSP:OPAQUE',
                            `UID:${uid}`,
                            'END:VEVENT'
                        ].join('\r\n');
                    });

                const icalContent = [
                    'BEGIN:VCALENDAR',
                    'PRODID:-//Bethany Homestay//Direct Bookings//EN',
                    'VERSION:2.0',
                    'CALSCALE:GREGORIAN',
                    'METHOD:PUBLISH',
                    `X-WR-CALNAME:Bethany ${roomId} Bookings`,
                    ...events,
                    'END:VCALENDAR'
                ].join('\r\n');

                // Create blob and trigger download
                const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `bethany-${roomId}-calendar.ics`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                setStatus('success');
            } catch (err) {
                setStatus('error');
            }
        };

        generateAndDownload();
    }, [roomId]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            textAlign: 'center'
        }}>
            {status === 'loading' && (
                <div>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
                    <p>Generating calendar file...</p>
                </div>
            )}
            {status === 'success' && (
                <div>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                    <h2>Download Started!</h2>
                    <p style={{ color: '#666' }}>Your iCal file for <strong>{roomId}</strong> is downloading.</p>
                    <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#888' }}>
                        Import this file into Goibibo, Booking.com, or Airbnb to sync your bookings.
                    </p>
                </div>
            )}
            {status === 'error' && (
                <div>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>❌</div>
                    <h2>Error</h2>
                    <p style={{ color: 'red' }}>Failed to generate calendar. Please try again.</p>
                </div>
            )}
        </div>
    );
};

export default IcalExport;

