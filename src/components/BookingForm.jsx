import { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Import Calendar
import './Calendar.css'; // Import Custom Styles

// Room data based on MakeMyTrip listing
const ROOMS = [
    {
        id: 'carmel',
        name: 'Carmel',
        price: 3000,
        beds: '4 Adults + 1 Kid',
        extraBed: 'Extra 1 Mattress available',
        view: 'Mountain View',
        size: '616 sq.ft (57 sq.mt)',
        features: ['Attached Bathroom', 'Daily Housekeeping', 'Wi-Fi', 'Air Purifier'],
        images: [
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000&auto=format&fit=crop', // Bedroom
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop', // Interior
            'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop'  // View
        ]
    },
    {
        id: 'jordan',
        name: 'Jordan',
        price: 2500,
        beds: '4 Adults',
        extraBed: null,
        view: 'Courtyard View',
        size: '380 sq.ft (35 sq.mt)',
        features: ['Attached Bathroom'],
        images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1512918760532-3edbed13588d?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 'sion',
        name: 'Sion Room',
        price: 2500,
        beds: '4 Adults',
        extraBed: 'Extra 1 Cot available',
        view: 'City View',
        size: '320 sq.ft (28 sq.mt)',
        features: ['Attached Bathroom'],
        images: [
            'https://images.unsplash.com/photo-1616594039964-40891d9225e9?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1000&auto=format&fit=crop'
        ]
    },
    {
        id: 'zion',
        name: 'Zion',
        price: 2500,
        beds: '4 Adults',
        extraBed: null,
        view: 'City View',
        size: '528 sq.ft (48 sq.mt)',
        features: ['Attached Bathroom'],
        images: [
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1522771753035-0a1539503ed5?q=80&w=1000&auto=format&fit=crop'
        ]
    }
];

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

const ImageLightbox = ({ isOpen, images, initialIndex, onClose }) => {
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        setIndex(initialIndex);
    }, [initialIndex]);

    if (!isOpen) return null;

    const next = (e) => { e.stopPropagation(); setIndex((prev) => (prev + 1) % images.length); };
    const prev = (e) => { e.stopPropagation(); setIndex((prev) => (prev - 1 + images.length) % images.length); };

    return (
        <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
        >
            <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer', zIndex: 10001 }}>×</button>

            <img
                src={images[index]}
                alt="Fullscreen view"
                style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                onClick={(e) => e.stopPropagation()} // Prevent close on image click
            />

            {images.length > 1 && (
                <>
                    <button onClick={prev} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '15px', fontSize: '24px', cursor: 'pointer', borderRadius: '50%' }}>❮</button>
                    <button onClick={next} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '15px', fontSize: '24px', cursor: 'pointer', borderRadius: '50%' }}>❯</button>
                    <div style={{ position: 'absolute', bottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
                        {index + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
    );
};

const BookingForm = ({ onToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        selectedRooms: [], // Array of room objects
        message: '',
        addMeals: false
    });

    // Lightbox State
    const [lightboxState, setLightboxState] = useState({
        isOpen: false,
        images: [],
        index: 0
    });

    // Calendar Reset Key (for uncontrolled component usage)
    const [calendarKey, setCalendarKey] = useState(0);

    // Reset calendar when form clears
    useEffect(() => {
        if (!formData.checkIn && !formData.checkOut) {
            setCalendarKey(prev => prev + 1);
        }
    }, [formData.checkIn, formData.checkOut]);

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
    const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwK4ImQyrF_W8e2g9ZGjbLypWW9vaNVk4Pwh_t5uyWknnFWpGz2tiKxYJ13Js4srAar/exec';

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
            const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getBookings`, {
                method: 'GET',
                redirect: 'follow'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched bookings:', data);
                setExistingBookings(data.bookings || []);
            }
        } catch (error) {
            console.log('Could not fetch existing bookings:', error);
        } finally {
            setIsLoadingBookings(false);
        }
    };

    // --- PRICING LOGIC HELPERS ---

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

        // October (9) & November (10) up to 7th
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
        return highSeason ? 3000 : 2500;
    };

    const MEAL_PRICE = 520; // Fixed meal price for all seasons

    // Helper to get numeric capacity from string (e.g., "4 Adults" -> 4)
    const getRoomCapacity = (room) => {
        // Simple heuristic: extract first digit
        const match = room.beds.match(/(\d+)/);
        return match ? parseInt(match[0]) : 2;
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
                if (formData.addMeals) {
                    totalMealCost += (MEAL_PRICE * currentGuests);
                }
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
    }, [formData.checkIn, formData.checkOut, formData.selectedRooms, formData.guests, formData.addMeals]);

    // Calendar Tile Content (Price Display)
    const getTileContent = ({ date, view }) => {
        if (view === 'month') {
            const isHigh = isHighSeason(date);
            // Show price for currently selected primary room or generic "Start" price if none selected
            // Use 'carmel' logic for high price visualization, or generic
            // Prompt asks to "add this rate to calendar". 
            // We'll show the rate for "Carmel" (High Tier) and "Standard" (Low Tier) in a small tooltip or just one reference price?
            // User said: "highlight the rate high and low".
            // Let's show the Carmel rate as reference since it varies most distinctively (3600 vs 3000)
            const price = isHigh ? 'High' : 'Low';
            return (
                <div className="price-tag">
                    {isHigh ? 'High' : 'Low'}
                </div>
            );
        }
    };

    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            return isHighSeason(date) ? 'season-high' : 'season-low';
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

    // Check room availability
    const getRoomStatus = (roomId) => {
        if (!formData.checkIn || !formData.checkOut) return 'available';
        if (existingBookings.length === 0) return 'available';

        const checkIn = new Date(formData.checkIn);
        const checkOut = new Date(formData.checkOut);
        const room = ROOMS.find(r => r.id === roomId);
        if (!room) return 'available';

        for (const booking of existingBookings) {
            // Handle multi-room bookings from sheet (e.g. "Jordan, Sion")
            const bookingRooms = (booking.roomType || '').split(',').map(s => s.trim().toLowerCase());
            const currentRoomName = room.name.trim().toLowerCase();

            // Check if THIS room is in the booked list
            const isRoomBooked = bookingRooms.some(bookedRoom =>
                bookedRoom === currentRoomName || bookedRoom.includes(currentRoomName) || currentRoomName.includes(bookedRoom)
            );

            if (isRoomBooked) {
                const bookingCheckIn = new Date(booking.checkIn);
                const bookingCheckOut = new Date(booking.checkOut);
                const hasOverlap = checkIn < bookingCheckOut && checkOut > bookingCheckIn;

                if (hasOverlap) {
                    if (booking.status === 'Booked') return 'booked';
                    else if (booking.status === 'Pending') return 'partial';
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
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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
            if (formData.addMeals) {
                finalMessage = `[MEALS ADDED] ${finalMessage}`;
            }

            const params = new URLSearchParams({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                guests: formData.guests,
                roomType: roomNames,
                pricePerNight: Math.round(roomPriceTotal / numberOfNights), // Avg Room price
                numberOfNights: numberOfNights,
                totalPrice: totalPrice,
                status: 'Pending',
                message: finalMessage
            });

            await fetch(`${GOOGLE_SHEETS_URL}?${params.toString()}`, {
                method: 'GET',
                mode: 'no-cors'
            });

            setBookingDetails({
                name: formData.name,
                email: formData.email,
                roomName: roomNames,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                nights: numberOfNights,
                totalPrice: totalPrice,
                guests: formData.guests,
                mealsIncluded: formData.addMeals
            });

            setShowSuccessModal(true);
            setFormData({
                name: '', email: '', phone: '', checkIn: '', checkOut: '',
                guests: '1', selectedRooms: [], message: '', addMeals: false
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
                <div className="booking-single-row" style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* COL 1: Calendar */}
                    <div className="col-calendar" style={{ flex: '1 1 300px', maxWidth: '380px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>1. Select Dates</h3>
                        <div className="calendar-container-styled" style={{ background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
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
                        {/* Hidden Inputs */}
                        <input type="hidden" name="checkIn" value={formData.checkIn} required />
                        <input type="hidden" name="checkOut" value={formData.checkOut} required />

                        {!formData.checkIn && <p style={{ color: '#7f8c8d', marginTop: '10px', fontStyle: 'italic', fontSize: '0.9rem' }}>Please select check-in and check-out dates.</p>}
                    </div>

                    {/* COL 2: Room Selection (Scrollable) */}
                    <div className="col-rooms" style={{ flex: '2 1 400px', minWidth: '320px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>2. Select Rooms</h3>
                        <div className="rooms-scroll-container" style={{ maxHeight: '800px', overflowY: 'auto', paddingRight: '10px' }}>
                            <div className="rooms-list-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {ROOMS.map((room) => {
                                    const status = getRoomStatus(room.id);
                                    const statusInfo = getStatusLabel(status);
                                    const isSelected = formData.selectedRooms.some(r => r.id === room.id);
                                    const isDisabled = status === 'booked';

                                    return (
                                        <div key={room.id} className={`room-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: isSelected ? '2px solid #2ecc71' : '1px solid transparent' }}>
                                            {/* Horizontal Card Layout for compactness in middle col? Or standard vertical? Let's keep vertical but compact images */}
                                            <div style={{ position: 'relative' }}>
                                                <ImageCarousel
                                                    images={room.images}
                                                    height="180px"
                                                    onImageClick={(idx) => openLightbox(room.images, idx)}
                                                />
                                                <span className={`room-status ${statusInfo.className}`} style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', zIndex: 10 }}>{statusInfo.text}</span>
                                            </div>

                                            <div className="room-card-content" style={{ padding: '15px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                    <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{room.name}</h4>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span className="price" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2c3e50' }}>₹{room.price.toLocaleString('en-IN')}</span>
                                                        <span className="per-night" style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>/night</span>
                                                    </div>
                                                </div>

                                                <div className="room-card-details" style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '0.85rem', color: '#555', flexWrap: 'wrap' }}>
                                                    <span>🛏️ {room.beds}</span>
                                                    {room.extraBed && <span>➕ {room.extraBed}</span>}
                                                    {room.view && <span>🏔️ {room.view}</span>}
                                                </div>

                                                <div style={{ marginTop: 'auto' }}>
                                                    {isDisabled ? (
                                                        <button className="add-room-btn" disabled style={{ width: '100%', padding: '8px', background: '#ecf0f1', color: '#95a5a6', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: 'bold' }}>Unavailable</button>
                                                    ) : isSelected ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); toggleRoom(room); }}
                                                            style={{ width: '100%', padding: '8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); toggleRoom(room); }}
                                                            style={{ width: '100%', padding: '8px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background 0.2s' }}
                                                        >
                                                            Add
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* COL 3: Cart & Checkout */}
                    <div className="col-cart" style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>3. Booking Details</h3>

                        <div className="cart-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: '20px' }}>
                            {/* Guests Selector */}
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: '600', marginBottom: '5px', display: 'block', fontSize: '0.9rem' }}>Number of Guests</label>
                                <select name="guests" value={formData.guests} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.95rem' }}>
                                    {[...Array(15)].map((_, i) => (
                                        <option key={i} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>

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
                                                <span style={{ fontWeight: '600' }}>₹{room.price.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Capacity Warning */}
                            {showCapacityWarning && (
                                <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>⚠️</span>
                                    <span>Guests ({currentGuests}) &gt; Beds ({currentCapacity}). Add rooms!</span>
                                </div>
                            )}

                            {/* Meals Option */}
                            <div className="meals-option" style={{ marginBottom: '15px', padding: '10px', background: '#fff9e6', borderRadius: '6px', border: '1px solid #ffeeba' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <input type="checkbox" id="addMeals" name="addMeals" checked={formData.addMeals} onChange={handleChange} style={{ marginTop: '4px' }} />
                                    <div>
                                        <label htmlFor="addMeals" style={{ fontWeight: '700', cursor: 'pointer', color: '#d35400', fontSize: '0.95rem' }}>Add All Meals</label>
                                        <div style={{ fontSize: '0.8rem', color: '#e67e22' }}>
                                            ₹{MEAL_PRICE} /person/day
                                        </div>
                                    </div>
                                </div>
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

                                <button type="submit" disabled={isSubmitting || formData.selectedRooms.length === 0} style={{ width: '100%', padding: '12px', background: isSubmitting || formData.selectedRooms.length === 0 ? '#bdc3c7' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isSubmitting || formData.selectedRooms.length === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
                                    {isSubmitting ? '...' : 'Confirm'}
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
                                    <li>Receive your confirmed booking!</li>
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

        </section>
    );
};

export default BookingForm;
