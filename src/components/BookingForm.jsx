import { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Import Calendar
import ImageLightbox from './ImageLightbox'; // Import Shared Lightbox
import TiltCard from './3d/TiltCard'; // Import 3D Tilt Card
import { SupabaseService } from '../services/SupabaseService'; // Supabase Service
import './Calendar.css'; // Import Custom Styles

// Room data is now fetched from Supabase via SupabaseService.getRooms()

// --- Sub-components for Image Gallery ---

const ImageCarousel = ({ images, height = '200px', onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-slide
    useEffect(() => {
        let interval;
        if (!isHovered && images.length > 1) {
            interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
            }, 3000); // 3 seconds
        }
        return () => clearInterval(interval);
    }, [isHovered, images.length]);

    const nextSlide = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div
            className="carousel-container"
            style={{ position: 'relative', width: '100%', height: height, overflow: 'hidden', cursor: 'pointer' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onImageClick && onImageClick(currentIndex)}
        >
            {images.map((img, index) => (
                <img
                    key={index}
                    src={img}
                    alt={`Room view ${index + 1}`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: index === currentIndex ? 1 : 0,
                        transition: 'opacity 0.5s ease-in-out',
                        zIndex: 1
                    }}
                />
            ))}

            {/* Overlay Gradient for better visibility */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 2 }}></div>

            {/* Controls */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10, display: isHovered ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={nextSlide}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10, display: isHovered ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                    >
                        ›
                    </button>

                    {/* Dots */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 10 }}>
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)', transition: 'background 0.3s' }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};



const BookingForm = ({ onToast }) => {
    // State for Dynamic Rooms
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

    // State for OTA blocked dates from Supabase
    const [otaBlockedDates, setOtaBlockedDates] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        selectedRooms: [], // Array of room objects
        message: '',
        mealSelection: {
            breakfast: { veg: 0, nonVeg: 0 },
            lunch: { veg: 0, nonVeg: 0 },
            dinner: { veg: 0, nonVeg: 0 }
        }
    });

    // Lightbox State
    const [lightboxState, setLightboxState] = useState({
        isOpen: false,
        images: [],
        index: 0
    });

    const [showCalendar, setShowCalendar] = useState(false);
    const [showRoomPicker, setShowRoomPicker] = useState(false);
    const [showMealPicker, setShowMealPicker] = useState(false);

    // Calendar Reset Key (for uncontrolled component usage)
    const [calendarKey, setCalendarKey] = useState(0);

    // Reset calendar when form clears
    useEffect(() => {
        if (!formData.checkIn && !formData.checkOut) {
            setCalendarKey(prev => prev + 1);
        }
    }, [formData.checkIn, formData.checkOut]);

    // Fetch Rooms on Load
    useEffect(() => {
        const loadRooms = async () => {
            // Fallback for immediate render before DB is ready
            const defaultRooms = [
                {
                    id: 'carmel', name: 'Carmel', price: 3000, beds: '4 Adults + 1 Kid',
                    extraBed: 'Extra 1 Mattress available', view: 'Mountain View', size: '616 sq.ft (57 sq.mt)',
                    features: ['Attached Bathroom', 'Daily Housekeeping', 'Wi-Fi', 'Air Purifier'],
                    images: ['https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/6ff89f94-7679-4e40-a7c5-aa5b01a354a9.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500']
                },
                {
                    id: 'jordan', name: 'Jordan', price: 2500, beds: '4 Adults', extraBed: null,
                    view: 'Courtyard View', size: '380 sq.ft (35 sq.mt)', features: ['Attached Bathroom'],
                    images: ['https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/e3a1d318-3eea-4b47-a1ee-9b5d41b619dd.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/d5e107d3-6fb4-40f4-af8d-41fd9d277ee0.jpg?output-quality=75&downsize=*:500&crop=990:500']
                },
                {
                    id: 'sion', name: 'Sion Room', price: 2500, beds: '4 Adults', extraBed: 'Extra 1 Cot available',
                    view: 'City View', size: '320 sq.ft (28 sq.mt)', features: ['Attached Bathroom'],
                    images: ['https://r1imghtlak.mmtcdn.com/d13f1656898d11ec8dd80a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/e2ee5312898d11ec93030a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500']
                },
                {
                    id: 'zion', name: 'Zion', price: 2500, beds: '4 Adults', extraBed: null,
                    view: 'City View', size: '528 sq.ft (48 sq.mt)', features: ['Attached Bathroom'],
                    images: ['https://r1imghtlak.mmtcdn.com/e2ee5312898d11ec93030a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/6ff89f94-7679-4e40-a7c5-aa5b01a354a9.jpg?output-quality=75&downsize=*:500&crop=990:500', 'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500']
                }
            ];

            const dbRooms = await SupabaseService.getRooms();
            if (dbRooms && dbRooms.length > 0) {
                const formattedRooms = dbRooms.map(r => ({
                    ...r,
                    price: r.price_low_season,
                    beds: r.capacity,
                    features: r.features || [],
                    images: r.images || []
                }));
                setRooms(formattedRooms);
            } else {
                setRooms(defaultRooms);
            }

            // Fetch OTA blocked dates from Supabase
            const blockedResult = await SupabaseService.getBlockedDates();
            if (blockedResult.success && blockedResult.data) {
                const blocked = {};
                blockedResult.data.forEach(row => {
                    if (!blocked[row.room_id]) blocked[row.room_id] = [];
                    blocked[row.room_id].push({ start: row.blocked_date });
                });
                setOtaBlockedDates(blocked);
            }

            setLoadingRooms(false);
        };
        loadRooms();
    }, []);

    const openLightbox = (images, index = 0) => {
        setLightboxState({ isOpen: true, images, index });
    };

    const closeLightbox = () => {
        setLightboxState(prev => ({ ...prev, isOpen: false }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingBookings, setExistingBookings] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [roomPriceTotal, setRoomPriceTotal] = useState(0);
    const [mealPriceTotal, setMealPriceTotal] = useState(0);
    const [numberOfNights, setNumberOfNights] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    // Google Sheets Web App URL (Apps Script deployment)
    const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwCh7e84B44r49_S84abs7DfNyu6V8IV6umuQUNYH6qRmtGDIVKzXWR4EXD8yFrLFNksw/exec';

    // Fetch existing bookings for availability check
    useEffect(() => {
        fetchExistingBookings();
    }, []);

    // Re-fetch bookings when dates change
    useEffect(() => {
        if (formData.checkIn && formData.checkOut) {
            fetchExistingBookings();
        }
    }, [formData.checkIn, formData.checkOut]);

    const fetchExistingBookings = async () => {
        setIsLoadingBookings(true);
        try {
            // Parallel Fetch: Google Sheets (Legacy/Primary) & Supabase (Modern/Sync)
            const [sheetRes, supabaseData] = await Promise.all([
                fetch(`${GOOGLE_SHEETS_URL}?action=getBookings`).then(res => res.json()).catch(err => ({ bookings: [] })),
                SupabaseService.getAllBookings()
            ]);

            console.log('Google Sheet Bookings:', sheetRes.bookings);
            console.log('Supabase Bookings:', supabaseData);

            // Normalize Supabase Data to match Sheet structure for frontend logic
            // Supabase returns: { check_in, check_out, room_ids: [{id, name}], status: 'booked' }
            // Frontend expects: { checkIn: 'YYYY-MM-DD', checkOut: 'YYYY-MM-DD', roomType: 'Carmel, Room 2', status: 'Booked' }

            const supabaseFormatted = (supabaseData || []).map(b => {
                // Parse YYYY-MM-DD to ensure local midnight consistency, avoiding UTC shifts
                const parseDate = (dateStr) => {
                    if (!dateStr) return null;
                    const parts = dateStr.split('-'); // 2026, 01, 31
                    // Create date at local midnight: new Date(year, monthIndex, day)
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                };

                // Robustly parse room_ids (handle both Array and JSON string)
                let roomsArr = [];
                if (Array.isArray(b.room_ids)) {
                    roomsArr = b.room_ids;
                } else if (typeof b.room_ids === 'string') {
                    try {
                        roomsArr = JSON.parse(b.room_ids);
                    } catch (e) {
                        console.error('Failed to parse room_ids JSON:', b.room_ids);
                        roomsArr = [];
                    }
                }

                // Map to comma-separated string of names
                const roomTypeStr = roomsArr.map(r => r.name || r.id || '').join(', ');

                return {
                    checkIn: parseDate(b.check_in),
                    checkOut: parseDate(b.check_out),
                    roomType: roomTypeStr,
                    status: b.status // Pass raw status
                };
            });

            // Format Sheet Data (assuming it returns { bookings: [{ checkIn, checkOut, roomType... }] })
            const sheetFormatted = sheetRes.bookings || [];

            // Merge Unique Bookings
            const allBookings = [...sheetFormatted, ...supabaseFormatted];

            console.log('FINAL MERGED BOOKINGS:', allBookings);

            setExistingBookings(allBookings);

        } catch (error) {
            console.log('Could not fetch existing bookings:', error);
        } finally {
            setIsLoadingBookings(false);
        }
    };

    // --- PRICING LOGIC HELPERS ---

    // Indian Holidays 2026
    const HOLIDAYS = {
        '2026-01-26': 'Republic Day',
        '2026-03-08': 'Holi',
        '2026-04-14': 'Ambedkar Jayanti',
        '2026-08-15': 'Independence Day',
        '2026-10-02': 'Gandhi Jayanti',
        '2026-10-20': 'Dussehra',
        '2026-11-08': 'Diwali',
        '2026-12-25': 'Christmas'
    };

    // Check if a date is in High Season
    // High Season: Dec-Jan, Mar-Apr 15, Oct-Nov 7
    const isHighSeason = (date) => {
        const month = date.getMonth(); // 0-indexed (0=Jan, 11=Dec)
        const day = date.getDate();

        // December (11) & January (0)
        if (month === 11 || month === 0) return true;

        // March (2) & April (3) up to 15th
        if (month === 2) return true;
        if (month === 3 && day <= 15) return true;

        // Oct (9) & Nov (10) up to 7th
        if (month === 9) return true;
        if (month === 10 && day <= 7) return true;

        return false;
    };

    // Get Room Price for a specific date
    const getSeasonalRoomPrice = (date, roomId) => {
        const highSeason = isHighSeason(date);

        // Carmel: High=3600, Low=3000
        if (roomId === 'carmel') {
            return highSeason ? 3600 : 3000;
        }

        // Others (Jordan, Sion, Zion): High=3000, Low=2500
        // User requested "Rest are 3000" during high season, and "Off season rate is fixed to existing" (which is 2500)
        return highSeason ? 3000 : 2500;
    };



    const MEAL_PRICES = {
        breakfast: 120,
        lunch: 200,
        dinner: 200
    };

    const to12Hour = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    // Helper to get numeric capacity from string (e.g., "4 Adults + 1 Kid" -> 5)
    const getRoomCapacity = (room) => {
        // match all numbers and sum them up
        const matches = room.beds.match(/(\d+)/g);
        if (matches) {
            return matches.reduce((acc, val) => acc + parseInt(val, 10), 0);
        }
        return 2;
    };

    // Calculate number of nights and total price (Iterating through dates)
    useEffect(() => {
        if (formData.checkIn && formData.checkOut && formData.selectedRooms.length > 0) {
            const checkIn = new Date(formData.checkIn);
            const checkOut = new Date(formData.checkOut);

            // Validate: CheckOut must be after CheckIn
            if (checkOut <= checkIn) {
                setNumberOfNights(0);
                setTotalPrice(0);
                return;
            }

            const diffTime = checkOut - checkIn;
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setNumberOfNights(nights);

            let totalRoomCost = 0;
            let totalMealCost = 0;
            const currentGuests = parseInt(formData.guests) || 1;

            // Loop through each night to get precise daily rates
            for (let i = 0; i < nights; i++) {
                let currentDate = new Date(checkIn);
                currentDate.setDate(checkIn.getDate() + i);

                // Room Cost
                formData.selectedRooms.forEach(room => {
                    totalRoomCost += getSeasonalRoomPrice(currentDate, room.id);
                });

                // Meal Cost
                // Meal Cost (Sum of specific plates * price)
                let dailyMealCost = 0;

                // Breakfast
                const bCount = (formData.mealSelection.breakfast.veg || 0) + (formData.mealSelection.breakfast.nonVeg || 0);
                dailyMealCost += bCount * MEAL_PRICES.breakfast;

                // Lunch
                const lCount = (formData.mealSelection.lunch.veg || 0) + (formData.mealSelection.lunch.nonVeg || 0);
                dailyMealCost += lCount * MEAL_PRICES.lunch;

                // Dinner
                const dCount = (formData.mealSelection.dinner.veg || 0) + (formData.mealSelection.dinner.nonVeg || 0);
                dailyMealCost += dCount * MEAL_PRICES.dinner;

                // NOTE: We do NOT multiply by 'currentGuests' here because the counts (bCount, lCount, etc.)
                // are already the specific number of plates selected by the user.
                totalMealCost += dailyMealCost;
            }

            setRoomPriceTotal(totalRoomCost);
            setMealPriceTotal(totalMealCost);
            setTotalPrice(totalRoomCost + totalMealCost);

        } else {
            setNumberOfNights(0);
            setTotalPrice(0);
            setRoomPriceTotal(0);
            setMealPriceTotal(0);
        }
    }, [formData.checkIn, formData.checkOut, formData.selectedRooms, formData.guests, formData.addMeals, formData.mealSelection]);

    // Helper for Local YYYY-MM-DD
    const getLocalYMD = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    // Calendar Tile Content (Price & Holidays)
    const getTileContent = ({ date, view }) => {
        if (view === 'month') {
            const isHigh = isHighSeason(date);
            const dateStr = getLocalYMD(date);
            const holiday = HOLIDAYS[dateStr];

            // Show Base Price (Standard Room)
            // Low: 2500, High: 3000
            const price = isHigh ? 3000 : 2500;

            return (
                <div className="tile-content">
                    <div className="price-tag">₹{price}</div>
                    {holiday && <div className="holiday-name">{holiday}</div>}
                </div>
            );
        }
    };

    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = getLocalYMD(date);
            const isHoliday = HOLIDAYS[dateStr];
            let classes = isHighSeason(date) ? 'season-high' : 'season-low';
            if (isHoliday) classes += ' holiday-date';
            return classes;
        }
    };

    // Handle Calendar Range Select
    // Handle Calendar Range Select
    const handleDateChange = (dates) => {
        // React-Calendar returns [start, end]
        if (!dates || !Array.isArray(dates) || dates.length < 2) {
            // Partial or empty
            return;
        }

        const start = dates[0];
        const end = dates[1];

        const toLocalISO = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        if (start && end) {
            setFormData(prev => ({
                ...prev,
                checkIn: toLocalISO(start),
                checkOut: toLocalISO(end)
            }));
        }
    };

    // Check room availability (includes OTA blocked dates)
    const getRoomStatus = (roomId) => {
        if (!formData.checkIn || !formData.checkOut) return 'available';

        const checkIn = new Date(formData.checkIn);
        const checkOut = new Date(formData.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        const room = rooms.find(r => r.id === roomId);
        if (!room) return 'available';

        // Check OTA blocked dates from Supabase (via state)
        const roomBlockedDates = otaBlockedDates[roomId] || [];
        for (const block of roomBlockedDates) {
            const blockStart = new Date(block.start);
            blockStart.setHours(0, 0, 0, 0);
            // For single-day blocks, end date is same as start + 1 day
            const blockEnd = new Date(block.start);
            blockEnd.setDate(blockEnd.getDate() + 1);
            blockEnd.setHours(0, 0, 0, 0);

            if (checkIn < blockEnd && checkOut > blockStart) {
                return 'booked'; // Blocked by OTA
            }
        }

        // Check existing DB bookings
        for (const booking of existingBookings) {
            const bookingRooms = (booking.roomType || '').split(',').map(s => s.trim().toLowerCase());
            const currentRoomName = room.name.trim().toLowerCase();

            const isRoomBooked = bookingRooms.some(bookedRoom =>
                bookedRoom === currentRoomName || bookedRoom.includes(currentRoomName) || currentRoomName.includes(bookedRoom)
            );

            if (isRoomBooked) {
                const bookingCheckIn = new Date(booking.checkIn);
                const bookingCheckOut = new Date(booking.checkOut);
                bookingCheckIn.setHours(0, 0, 0, 0);
                bookingCheckOut.setHours(0, 0, 0, 0);

                const hasOverlap = checkIn < bookingCheckOut && checkOut > bookingCheckIn;

                if (hasOverlap) {
                    const status = (booking.status || '').toLowerCase();
                    if (status === 'booked' || status === 'confirmed') return 'booked';
                    else if (status === 'pending') return 'partial';
                }
            }
        }
        return 'available';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'booked': return { text: 'Booked', className: 'status-booked' };
            case 'partial': return { text: 'Partially Booked', className: 'status-partial' };
            default: return { text: 'Available', className: 'status-available' };
        }
    };

    // Toggle Room Selection (Add/Remove)
    const toggleRoom = (room) => {
        if (getRoomStatus(room.id) === 'booked') return;

        setFormData(prev => {
            const isSelected = prev.selectedRooms.some(r => r.id === room.id);
            if (isSelected) {
                return { ...prev, selectedRooms: prev.selectedRooms.filter(r => r.id !== room.id) };
            } else {
                return { ...prev, selectedRooms: [...prev.selectedRooms, room] };
            }
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('meal_')) {
            // format: meal_breakfast_veg
            const parts = name.split('_'); // ['meal', 'breakfast', 'veg']
            if (parts.length === 3) {
                const meal = parts[1];
                const diet = parts[2];
                let count = Math.max(0, parseInt(value) || 0);

                // VALIDATION: Total meals for this time cannot exceed guests
                const totalGuests = parseInt(formData.guests) || 1;
                const otherDiet = diet === 'veg' ? 'nonVeg' : 'veg';
                const otherCount = formData.mealSelection[meal][otherDiet];

                if (count + otherCount > totalGuests) {
                    onToast(`Total ${meal} meals cannot exceed number of guests (${totalGuests})`, 'error');
                    count = Math.max(0, totalGuests - otherCount);
                }

                setFormData(prev => ({
                    ...prev,
                    mealSelection: {
                        ...prev.mealSelection,
                        [meal]: {
                            ...prev.mealSelection[meal],
                            [diet]: count
                        }
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // VALIDATION: Check for dates
        if (!formData.checkIn || !formData.checkOut) {
            onToast("Please select Check-in and Check-out dates to proceed.", 'error');
            return;
        }

        if (formData.selectedRooms.length === 0) {
            onToast("Please select at least one room.", 'error');
            return;
        }

        setIsSubmitting(true);

        // Re-check availability before submitting
        for (const room of formData.selectedRooms) {
            if (getRoomStatus(room.id) === 'booked') {
                onToast(`Sorry, ${room.name} is no longer available. Please remove it to proceed.`, 'error');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Combine room names for the sheet
            const roomNames = formData.selectedRooms.map(r => r.name).join(', ');

            let finalMessage = formData.message;

            const selectedMeals = [];
            const msRef = formData.mealSelection;

            const formatMeal = (name, data, timeRange) => {
                const parts = [];
                if (data.veg > 0) parts.push(`${data.veg} Veg`);
                if (data.nonVeg > 0) parts.push(`${data.nonVeg} Non-Veg`);

                if (parts.length > 0) {
                    return `${name} [${timeRange}]: ${parts.join(', ')}`;
                }
                return null;
            };

            const b = formatMeal('Breakfast', msRef.breakfast, '7:30-9:30 AM');
            const l = formatMeal('Lunch', msRef.lunch, '12-2 PM');
            const d = formatMeal('Dinner', msRef.dinner, '8-10 PM');

            if (b) selectedMeals.push(b);
            if (l) selectedMeals.push(l);
            if (d) selectedMeals.push(d);

            if (selectedMeals.length > 0) {
                finalMessage = `[MEALS: ${selectedMeals.join(' | ')}] ${finalMessage}`;
            }

            // Variables for new structure
            const selectedRoomNames = roomNames; // Already defined as roomNames
            const mealDetails = selectedMeals.length > 0 ? selectedMeals.join(' | ') : 'None';

            // --- INVOICE GENERATION LOGIC ---
            const invoiceItems = [];

            // 1. Line Items for Rooms (Aggregate for simplicity or daily split?)
            // We'll do a simple aggregate: "Room Name (X Night)"
            // BUT since prices vary daily, we'll list the average or just "Accommodation Charges"
            // Let's do distinct line items per Room Type
            formData.selectedRooms.forEach(room => {
                let thisRoomTotal = 0;
                for (let i = 0; i < numberOfNights; i++) {
                    let d = new Date(formData.checkIn);
                    d.setDate(d.getDate() + i);
                    thisRoomTotal += getSeasonalRoomPrice(d, room.id);
                }
                invoiceItems.push({
                    description: `${room.name} (${numberOfNights} Nights)`,
                    quantity: 1,
                    unit_price: thisRoomTotal,
                    total: thisRoomTotal
                });
            });

            // 2. Line Items for Meals
            // Calculate total Meal quantities
            const ms = formData.mealSelection;
            const mealTypes = [
                { id: 'breakfast', label: 'Breakfast', price: MEAL_PRICES.breakfast },
                { id: 'lunch', label: 'Lunch', price: MEAL_PRICES.lunch },
                { id: 'dinner', label: 'Dinner', price: MEAL_PRICES.dinner }
            ];

            mealTypes.forEach(mt => {
                const count = (ms[mt.id].veg || 0) + (ms[mt.id].nonVeg || 0);
                if (count > 0) {
                    // Total Plates = count * nights
                    const totalPlates = count * numberOfNights;
                    const totalCost = totalPlates * mt.price;
                    invoiceItems.push({
                        description: `${mt.label} Charges (${count} plates/day)`,
                        quantity: totalPlates,
                        unit_price: mt.price,
                        total: totalCost
                    });
                }
            });

            // 2. Format Data for Google Sheets
            const formDataObj = new FormData();
            formDataObj.append('checkIn', formData.checkIn);
            formDataObj.append('checkOut', formData.checkOut);
            formDataObj.append('guests', formData.guests);
            formDataObj.append('roomType', selectedRoomNames); // Fixed key to match Apps Script
            formDataObj.append('name', formData.name);
            formDataObj.append('email', formData.email);
            formDataObj.append('phone', formData.phone);
            formDataObj.append('message', finalMessage); // Use finalMessage here
            formDataObj.append('totalPrice', totalPrice);
            formDataObj.append('meals', mealDetails);
            formDataObj.append('pricePerNight', Math.round(roomPriceTotal / numberOfNights)); // Avg Room price
            formDataObj.append('numberOfNights', numberOfNights);
            // 3. SEQUENTIAL EXECUTION: Supabase First (to get ID), then Google Sheets

            // Step A: Create in Supabase
            const supabaseResult = await SupabaseService.createBooking({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                selectedRooms: formData.selectedRooms,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                guests: formData.guests,
                totalPrice: totalPrice,
                meals: mealDetails,
                message: finalMessage,
                invoiceItems: invoiceItems // <--- Pass Detailed Breakdown
            });

            if (!supabaseResult.success) {
                onToast("Booking failed. Please check your connection.", 'error');
                setIsSubmitting(false);
                return;
            }

            const bookingId = supabaseResult.booking.id;

            // Step B: Send to Google Sheets (Now with Booking ID)
            formDataObj.append('bookingId', bookingId);
            formDataObj.append('status', 'Pending');

            fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                body: formDataObj,
                mode: 'no-cors'
            }).catch(err => console.error('Sheet Submission Error:', err));

            // Step C: Success UI
            setBookingDetails({
                ...formData,
                roomNames: selectedRoomNames,
                totalPrice,
                bookingId: bookingId
            });
            setShowSuccessModal(true);
            setFormData({
                name: '', email: '', phone: '', checkIn: '', checkOut: '',
                guests: '1', selectedRooms: [], message: '',
                mealSelection: {
                    breakfast: { veg: 0, nonVeg: 0 },
                    lunch: { veg: 0, nonVeg: 0 },
                    dinner: { veg: 0, nonVeg: 0 }
                }
            });
            setTotalPrice(0); setRoomPriceTotal(0); setMealPriceTotal(0); setNumberOfNights(0);
            fetchExistingBookings();

        } catch (error) {
            console.error('Booking error:', error);
            onToast('Failed to send booking request. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    // Calculate Capacity Logic
    const currentGuests = parseInt(formData.guests) || 1;
    const currentCapacity = formData.selectedRooms.reduce((acc, room) => acc + getRoomCapacity(room), 0);
    const capacityDifference = currentGuests - currentCapacity;
    const showCapacityWarning = formData.selectedRooms.length > 0 && capacityDifference > 0;

    return (
        <section id="booking" className="booking">
            <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }}>
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2>Book Your Stay</h2>
                    <p>Select multiple rooms for your perfect family getaway</p>
                </div>

                {/* Single Row Layout: Calendar | Rooms | Cart */}
                <div className="booking-single-row" style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>

                    {/* COL 1: Calendar */}
                    {/* COL 1: Date & Search Panel */}
                    <div className="col-search" style={{ flex: '0 0 300px', maxWidth: '320px', position: 'relative', zIndex: 100 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>1. Plan Your Stay</h3>

                        {/* Search Card */}
                        <div className="search-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.02)' }}>

                            {/* Date Picker Trigger */}
                            <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                                <label style={{ fontWeight: '700', marginBottom: '8px', display: 'block', color: '#2c3e50', fontSize: '0.9rem', letterSpacing: '0.5px' }}>DATES</label>
                                <div
                                    className="date-trigger"
                                    onClick={() => { setShowCalendar(!showCalendar); setShowRoomPicker(false); }}
                                    style={{
                                        padding: '12px 15px',
                                        borderRadius: '10px',
                                        background: '#f8f9fa',
                                        border: '2px solid transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: showCalendar ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : 'none',
                                        borderColor: showCalendar ? '#3498db' : '#e9ecef'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📅</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#2c3e50' }}>{formData.checkIn ? new Date(formData.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Check-in'}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>to</span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#2c3e50' }}>{formData.checkOut ? new Date(formData.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Check-out'}</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>{showCalendar ? '▲' : '▼'}</span>
                                </div>


                            </div>

                            {/* Room Picker Trigger */}
                            <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                                <label style={{ fontWeight: '700', marginBottom: '8px', display: 'block', color: '#2c3e50', fontSize: '0.9rem', letterSpacing: '0.5px' }}>ROOMS</label>
                                <div
                                    className="room-trigger"
                                    onClick={() => { setShowRoomPicker(!showRoomPicker); setShowCalendar(false); }}
                                    style={{
                                        padding: '12px 15px',
                                        borderRadius: '10px',
                                        background: '#f8f9fa',
                                        border: '2px solid transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: showRoomPicker ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : 'none',
                                        borderColor: showRoomPicker ? '#3498db' : '#e9ecef'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>🛏️</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#2c3e50' }}>{formData.selectedRooms.length > 0 ? `${formData.selectedRooms.length} Room${formData.selectedRooms.length > 1 ? 's' : ''} Selected` : 'Select Rooms'}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{formData.selectedRooms.length > 0 ? 'Tap to edit' : 'Tap to choose'}</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>{showRoomPicker ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Guest Selector (Moved here for cohesion) */}
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontWeight: '700', marginBottom: '8px', display: 'block', color: '#2c3e50', fontSize: '0.9rem', letterSpacing: '0.5px' }}>GUESTS</label>
                                <select
                                    name="guests"
                                    value={formData.guests}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        borderRadius: '10px',
                                        border: '2px solid #e9ecef',
                                        fontSize: '0.95rem',
                                        backgroundColor: '#f8f9fa',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232c3e50%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 15px top 50%',
                                        backgroundSize: '12px auto'
                                    }}
                                >
                                    {[...Array(15)].map((_, i) => (
                                        <option key={i} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            {formData.guests > 4 && (
                                <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '10px', fontStyle: 'italic' }}>
                                    💡 Tip: For {formData.guests} guests, you'll need at least {Math.ceil(parseInt(formData.guests) / 4)} rooms.
                                </div>
                            )}

                            {!formData.checkIn && <p style={{ color: '#e74c3c', marginTop: '15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}><span>ℹ️</span> Select dates to see prices.</p>}
                        </div>

                        {/* Hidden Inputs */}
                        <input type="hidden" name="checkIn" value={formData.checkIn} required />
                        <input type="hidden" name="checkOut" value={formData.checkOut} required />
                    </div>



                    {/* COL 3: Cart & Checkout */}
                    <div className="col-cart" style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>2. Booking Details</h3>

                        <div className="cart-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: '20px' }}>
                            {/* Cart Items */}
                            <div className="selected-rooms-summary" style={{ marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#34495e', marginBottom: '8px' }}>Selected Rooms:</h4>
                                {formData.selectedRooms.length === 0 ? (
                                    <p style={{ color: '#95a5a6', fontStyle: 'italic', background: '#f8f9fa', padding: '8px', borderRadius: '4px', fontSize: '0.9rem' }}>No rooms selected.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {formData.selectedRooms.map(room => (
                                            <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '6px', background: '#f8f9fa', borderRadius: '4px' }}>
                                                <span>{room.name}</span>
                                                <span style={{ fontWeight: '600' }}>₹{getSeasonalRoomPrice(formData.checkIn ? new Date(formData.checkIn) : new Date(), room.id).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Capacity Warning */}
                            {showCapacityWarning && (
                                <div style={{ background: '#fadbd8', color: '#c0392b', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '10px', border: '1px solid #e74c3c' }}>
                                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                    <div>
                                        <strong>Not Enough Space!</strong>
                                        <div style={{ marginTop: '4px' }}>
                                            You selected <strong>{currentGuests} guests</strong> but only have beds for <strong>{currentCapacity}</strong>.
                                            <br />
                                            Please <strong>add another room</strong>.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Meals Option Trigger */}
                            <div className="meals-trigger" onClick={() => setShowMealPicker(true)} style={{ marginBottom: '15px', padding: '15px', background: '#fff9e6', borderRadius: '12px', border: '1px solid #ffeeba', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🍽️</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '700', color: '#d35400', fontSize: '0.95rem' }}>Meal Plan</span>
                                        <span style={{ fontSize: '0.8rem', color: '#e67e22' }}>
                                            {(formData.mealSelection.breakfast.veg + formData.mealSelection.breakfast.nonVeg +
                                                formData.mealSelection.lunch.veg + formData.mealSelection.lunch.nonVeg +
                                                formData.mealSelection.dinner.veg + formData.mealSelection.dinner.nonVeg) > 0
                                                ? 'Tap to edit selection'
                                                : 'Tap to add meals'}
                                        </span>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.9rem', color: '#d35400' }}>{showMealPicker ? '▲' : '▶'}</span>
                            </div>

                            {/* Totals */}
                            {totalPrice > 0 && (
                                <div className="totals-display" style={{ paddingTop: '15px', borderTop: '2px solid #eee', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#7f8c8d', fontSize: '0.9rem' }}>
                                        <span>Duration:</span>
                                        <span>{numberOfNights} Nights</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: '800', color: '#2c3e50', marginTop: '5px' }}>
                                        <span>Total:</span>
                                        <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Checkout Form */}
                            <form onSubmit={handleSubmit} className="checkout-form">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }} />
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }} />
                                </div>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px', fontSize: '0.9rem' }} />
                                <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Message" rows="2" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '15px', fontSize: '0.9rem' }} />

                                <button type="submit" disabled={isSubmitting || formData.selectedRooms.length === 0 || showCapacityWarning} style={{ width: '100%', padding: '12px', background: isSubmitting || formData.selectedRooms.length === 0 || showCapacityWarning ? '#bdc3c7' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isSubmitting || formData.selectedRooms.length === 0 || showCapacityWarning ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
                                    {showCapacityWarning ? 'Select More Rooms' : (isSubmitting ? '...' : 'Confirm Request')}
                                </button>
                            </form>

                        </div>
                    </div>
                </div>
            </div>



            {/* Success Modal Popup */}
            {showSuccessModal && bookingDetails && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header success">
                            <span className="modal-icon">✅</span>
                            <h2>Booking Request Submitted!</h2>
                        </div>

                        <div className="modal-body">
                            <div className="modal-greeting">
                                <p>Dear <strong>{bookingDetails.name}</strong>,</p>
                                <p>Your booking request has been received successfully!</p>
                            </div>

                            <div className="modal-booking-summary">
                                <h4>📋 Booking Summary</h4>
                                <div className="summary-item">
                                    <span>Room:</span>
                                    <span>{bookingDetails.roomName}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Check-in:</span>
                                    <span>{new Date(bookingDetails.checkIn).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Check-out:</span>
                                    <span>{new Date(bookingDetails.checkOut).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Duration:</span>
                                    <span>{bookingDetails.nights} night(s)</span>
                                </div>
                                <div className="summary-item total">
                                    <span>Total Amount:</span>
                                    <span>₹{bookingDetails.totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="modal-instructions">
                                <div className="instruction-icon">📧</div>
                                <h4>Check Your Email!</h4>
                                <p>We have sent a confirmation email to:</p>
                                <p className="email-highlight">{bookingDetails.email}</p>
                                <p className="instruction-text">
                                    Please check your inbox (and spam folder) for detailed instructions
                                    on how to confirm your booking with advance payment.
                                </p>
                            </div>

                            <div className="modal-steps">
                                <h4>📝 Next Steps:</h4>
                                <ol>
                                    <li>Open the confirmation email we sent you</li>
                                    <li>Contact us via phone/WhatsApp for payment</li>
                                    <li>Complete the advance payment</li>
                                </ol>
                            </div>

                            <div className="modal-note">
                                <span className="note-icon">⚠️</span>
                                <span>Your booking is <strong>pending</strong> until advance payment is received.</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                Got it, I'll check my email!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Component */}
            <ImageLightbox
                isOpen={lightboxState.isOpen}
                images={lightboxState.images}
                initialIndex={lightboxState.index}
                onClose={closeLightbox}
            />

            {/* --- GLOBAL MODALS (Overlay) --- */}

            {/* 1. Calendar Modal */}
            {showCalendar && (
                <div className="picker-modal-overlay" onClick={() => setShowCalendar(false)}>
                    <div className="picker-modal-content calendar-modal" onClick={(e) => e.stopPropagation()}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', textAlign: 'center' }}>Select Dates</h4>
                        <div className="calendar-container-styled" style={{ boxShadow: 'none', padding: 0, border: 'none' }}>
                            <Calendar
                                key={calendarKey}
                                selectRange={true}
                                onChange={handleDateChange}
                                defaultValue={formData.checkIn && formData.checkOut ? [new Date(formData.checkIn), new Date(formData.checkOut)] : undefined}
                                minDate={new Date()}
                                tileContent={getTileContent}
                                tileClassName={getTileClassName}
                            />
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={() => setShowCalendar(false)}
                                style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)' }}
                            >
                                Confirm Dates
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Room Picker Modal */}
            {showRoomPicker && (
                <div className="picker-modal-overlay" onClick={() => setShowRoomPicker(false)}>
                    <div className="picker-modal-content room-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0, color: '#2c3e50' }}>Select Rooms</h3>
                            <button onClick={() => setShowRoomPicker(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#95a5a6' }}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {rooms.map(room => {
                                const isSelected = formData.selectedRooms.some(r => r.id === room.id);
                                const status = getRoomStatus(room.id);
                                const isBooked = status === 'booked';
                                const isPartial = status === 'partial';

                                return (
                                    <TiltCard
                                        key={room.id}
                                        className={`room-card-detailed ${isSelected ? 'selected' : ''} ${isBooked ? 'booked-card' : ''}`}
                                        onClick={() => !isBooked && toggleRoom(room)}
                                        disabled={isBooked}
                                        style={{
                                            border: isSelected ? '2px solid #3498db' : '1px solid #e0e0e0',
                                            background: isSelected ? '#fbfdff' : (isBooked ? '#f8f9fa' : 'white'),
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            cursor: isBooked ? 'not-allowed' : 'pointer',
                                            opacity: isBooked ? 0.7 : 1,
                                            // Box shadow managed by TiltCard mostly, but we keep base for static state
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Selection Badge */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '15px',
                                                right: '15px',
                                                background: '#3498db',
                                                color: 'white',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                zIndex: 10,
                                                boxShadow: '0 2px 8px rgba(52,152,219,0.4)'
                                            }}>
                                                ✓ Selected
                                            </div>
                                        )}

                                        {/* Booked Overlay Badge */}
                                        {isBooked && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(255,255,255,0.6)',
                                                zIndex: 20,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <div style={{
                                                    background: '#e74c3c',
                                                    color: 'white',
                                                    padding: '10px 25px',
                                                    borderRadius: '30px',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.2rem',
                                                    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
                                                    transform: 'rotate(-5deg)'
                                                }}>
                                                    SOLD OUT
                                                </div>
                                            </div>
                                        )}

                                        {/* Image Carousel */}
                                        <div style={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                                            <ImageCarousel images={room.images} height="220px" onImageClick={() => toggleRoom(room)} />
                                        </div>

                                        {/* Content */}
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2c3e50', fontWeight: '700' }}>{room.name}</h3>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#e67e22' }}>
                                                        ₹{getSeasonalRoomPrice(formData.checkIn ? new Date(formData.checkIn) : new Date(), room.id).toLocaleString('en-IN')}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#95a5a6' }}>/ night</div>
                                                </div>
                                            </div>

                                            {/* Specs Grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', fontSize: '0.9rem', color: '#546e7a' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🛏️ {room.beds}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📏 {room.size}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🏞️ {room.view}</div>
                                                {room.extraBed && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#27ae60' }}>➕ {room.extraBed}</div>}
                                            </div>

                                            {/* Features */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {room.features.slice(0, 4).map((feature, idx) => (
                                                    <span key={idx} style={{ background: '#f8f9fa', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#636e72', border: '1px solid #eee' }}>
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </TiltCard>
                                );
                            })}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <button
                                type="button"
                                onClick={() => setShowRoomPicker(false)}
                                style={{ background: '#3498db', color: 'white', border: 'none', padding: '12px 40px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* 3. Meal Picker Modal */}
            {
                showMealPicker && (
                    <div className="picker-modal-overlay" onClick={() => setShowMealPicker(false)}>
                        <div className="picker-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                                <h3 style={{ margin: 0, color: '#e67e22', display: 'flex', alignItems: 'center', gap: '10px' }}>🍽️ Meal Selection</h3>
                                <button onClick={() => setShowMealPicker(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#95a5a6' }}>&times;</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                <div style={{ background: '#fff9e6', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', color: '#d35400' }}>
                                    ℹ️ Please specify the number of Veg and Non-Veg plates for each meal.
                                </div>

                                {/* Breakfast */}
                                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#2c3e50', fontSize: '1.1rem' }}>Breakfast</div>
                                            <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>7:30 - 9:30 AM</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1.1rem' }}>₹{MEAL_PRICES.breakfast}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', color: '#27ae60', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Veg</label>
                                            <input
                                                type="number"
                                                min="0"
                                                name="meal_breakfast_veg"
                                                value={formData.mealSelection.breakfast.veg}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', color: '#c0392b', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Non-Veg</label>
                                            <input
                                                type="number"
                                                min="0"
                                                name="meal_breakfast_nonVeg"
                                                value={formData.mealSelection.breakfast.nonVeg}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Lunch */}
                                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#2c3e50', fontSize: '1.1rem' }}>Lunch</div>
                                            <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>12:00 - 2:00 PM</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1.1rem' }}>₹{MEAL_PRICES.lunch}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', color: '#27ae60', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Veg</label>
                                            <input
                                                type="number"
                                                min="0"
                                                name="meal_lunch_veg"
                                                value={formData.mealSelection.lunch.veg}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', color: '#c0392b', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Non-Veg</label>
                                            <input
                                                type="number"
                                                min="0"
                                                name="meal_lunch_nonVeg"
                                                value={formData.mealSelection.lunch.nonVeg}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dinner */}
                                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#2c3e50', fontSize: '1.1rem' }}>Dinner</div>
                                            <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>8:00 - 10:00 PM</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1.1rem' }}>₹{MEAL_PRICES.dinner}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', color: '#27ae60', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Veg</label>
                                            <input
                                                type="number"
                                                min="0"
                                                name="meal_dinner_veg"
                                                value={formData.mealSelection.dinner.veg}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', color: '#c0392b', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Non-Veg</label>
                                            <input
                                                type="number"
                                                min="0"
                                                name="meal_dinner_nonVeg"
                                                value={formData.mealSelection.dinner.nonVeg}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div style={{ textAlign: 'center', marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowMealPicker(false)}
                                    style={{ background: '#e67e22', color: 'white', border: 'none', padding: '12px 40px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(230, 126, 34, 0.3)' }}
                                >
                                    Confirm Meals
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </section >
    );
};

export default BookingForm;
