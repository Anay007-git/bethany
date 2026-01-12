import { useState, useEffect } from 'react';

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

    // Helper to check if a date is in Peak Season
    const isPeakSeason = (date) => {
        const month = date.getMonth();
        const seasonMonths = [11, 0, 1, 2, 3, 8, 9];
        return seasonMonths.includes(month);
    };

    // Helper to get numeric capacity from string (e.g., "4 Adults" -> 4)
    const getRoomCapacity = (room) => {
        // Simple heuristic: extract first digit
        const match = room.beds.match(/(\d+)/);
        return match ? parseInt(match[0]) : 2;
    };

    // Calculate number of nights and total price
    useEffect(() => {
        if (formData.checkIn && formData.checkOut && formData.selectedRooms.length > 0) {
            const checkIn = new Date(formData.checkIn);
            const checkOut = new Date(formData.checkOut);
            const diffTime = checkOut - checkIn;
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (nights > 0) {
                setNumberOfNights(nights);

                // 1. Calculate Room Price (Sum of all selected rooms)
                let roomTotal = 0;
                formData.selectedRooms.forEach(room => {
                    roomTotal += (room.price * nights);
                });
                setRoomPriceTotal(roomTotal);

                // 2. Calculate Meal Price
                let mealTotal = 0;
                if (formData.addMeals) {
                    const guests = parseInt(formData.guests) || 1;
                    let currentDate = new Date(checkIn);

                    for (let i = 0; i < nights; i++) {
                        const isSeason = isPeakSeason(currentDate);
                        const dailyMealRate = isSeason ? 1500 : 1200;
                        mealTotal += (dailyMealRate * guests);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
                setMealPriceTotal(mealTotal);

                // 3. Grand Total
                setTotalPrice(roomTotal + mealTotal);
            } else {
                setNumberOfNights(0);
                setTotalPrice(0);
                setRoomPriceTotal(0);
                setMealPriceTotal(0);
            }
        } else {
            setNumberOfNights(0);
            setTotalPrice(0);
            setRoomPriceTotal(0);
            setMealPriceTotal(0);
        }
    }, [formData.checkIn, formData.checkOut, formData.selectedRooms, formData.guests, formData.addMeals]);

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
            <div className="container">
                <div className="section-header">
                    <h2>Book Your Stay</h2>
                    <p>Select multiple rooms for your perfect family getaway</p>
                </div>

                <div className="booking-layout" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {/* LEFT COLUMN: Rooms & Filters */}
                    <div className="booking-main" style={{ flex: '2', minWidth: '300px' }}>

                        {/* Global Filters */}
                        <div className="filters-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Check-in</label>
                                    <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} min={today} required />
                                </div>
                                <div className="form-group">
                                    <label>Check-out</label>
                                    <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} min={formData.checkIn || today} required />
                                </div>
                                <div className="form-group">
                                    <label>Guests</label>
                                    <select name="guests" value={formData.guests} onChange={handleChange} required>
                                        {[...Array(15)].map((_, i) => (
                                            <option key={i} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Capacity Suggestion */}
                            {showCapacityWarning && (
                                <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>⚠️</span>
                                    <span>You have {currentGuests} guests but selected rooms only fit {currentCapacity}. Please add another room!</span>
                                </div>
                            )}

                            {!formData.checkIn && <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>Select dates to check availability.</p>}
                        </div>

                        {/* Room Cards List */}
                        <div className="room-cards">
                            {ROOMS.map((room) => {
                                const status = getRoomStatus(room.id);
                                const statusInfo = getStatusLabel(status);
                                const isSelected = formData.selectedRooms.some(r => r.id === room.id);
                                const isDisabled = status === 'booked';

                                return (
                                    <div key={room.id} className={`room-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                                        {/* Carousel Component */}
                                        <ImageCarousel
                                            images={room.images}
                                            height="180px"
                                            onImageClick={(idx) => openLightbox(room.images, idx)}
                                        />

                                        <div className="room-card-content" style={{ padding: '15px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                            <div className="room-card-header">
                                                <h4>{room.name}</h4>
                                                <span className={`room-status ${statusInfo.className}`}>{statusInfo.text}</span>
                                            </div>
                                            <div className="room-card-price">
                                                <span className="price">₹{room.price.toLocaleString('en-IN')}</span>
                                                <span className="per-night">/night</span>
                                            </div>
                                            <div className="room-card-details">
                                                <p>🛏️ {room.beds}</p>
                                                {room.extraBed && <p className="extra-bed">➕ {room.extraBed}</p>}
                                                {room.view && <p className="view">🏔️ {room.view}</p>}
                                                {room.size && <p className="size">📐 {room.size}</p>}
                                            </div>
                                            <div className="room-card-features">
                                                {room.features.map((feature, idx) => (
                                                    <span key={idx} className="feature-tag">✓ {feature}</span>
                                                ))}
                                            </div>

                                            <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
                                                {isDisabled ? (
                                                    <button className="add-room-btn" disabled style={{ width: '100%', padding: '10px', background: '#ddd', border: 'none', borderRadius: '6px', cursor: 'not-allowed' }}>Unavailable</button>
                                                ) : isSelected ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleRoom(room); }}
                                                        style={{ width: '100%', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Remove Room
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleRoom(room); }}
                                                        style={{ width: '100%', padding: '10px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Add to Stay
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Cart & Checkout Form */}
                    <div className="booking-sidebar" style={{ flex: '1', minWidth: '300px' }}>
                        <div className="sidebar-cart" style={{ position: 'sticky', top: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Your Selection</h3>

                            {formData.selectedRooms.length === 0 ? (
                                <div className="empty-cart-placeholder">
                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🛒</div>
                                    <p>Your cart is empty</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>Select rooms to start your booking</p>
                                </div>
                            ) : (
                                <div className="selected-rooms-list" style={{ marginBottom: '20px' }}>
                                    {formData.selectedRooms.map(room => (
                                        <div key={room.id} className="cart-item">
                                            <span>🏠 {room.name}</span>
                                            <span>₹{room.price.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                    <div style={{ borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                        <span>Room Subtotal:</span>
                                        <span>₹{formData.selectedRooms.reduce((sum, r) => sum + r.price, 0).toLocaleString('en-IN')}/night</span>
                                    </div>
                                </div>
                            )}

                            {/* Add Meals Option */}
                            <div className="form-group" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <input type="checkbox" id="addMeals" name="addMeals" checked={formData.addMeals} onChange={handleChange} style={{ marginTop: '4px' }} />
                                    <div>
                                        <label htmlFor="addMeals" style={{ fontWeight: '600', cursor: 'pointer' }}>Add All Meals</label>
                                        <div style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: 'bold', marginTop: '5px' }}>
                                            Rate: ₹{isPeakSeason(formData.checkIn ? new Date(formData.checkIn) : new Date()) ? '1500' : '1200'} per person/day
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final Total */}
                            {totalPrice > 0 && (
                                <div className="cart-total" style={{ padding: '20px', borderRadius: '12px', marginBottom: '25px', marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem', opacity: 0.9 }}>
                                        <span>Nights:</span>
                                        <span>{numberOfNights}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem', opacity: 0.9 }}>
                                        <span>Guests:</span>
                                        <span>{formData.guests}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '800', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '12px', marginTop: '10px' }}>
                                        <span>Total:</span>
                                        <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group"><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                                <div className="form-group"><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                                <div className="form-group"><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                                <div className="form-group"><textarea name="message" value={formData.message} onChange={handleChange} placeholder="Special Requests..." rows="3" style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }} /></div>

                                <button type="submit" className="submit-btn" disabled={isSubmitting || formData.selectedRooms.length === 0} style={{ width: '100%', padding: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isSubmitting || formData.selectedRooms.length === 0 ? 'not-allowed' : 'pointer', opacity: isSubmitting || formData.selectedRooms.length === 0 ? 0.7 : 1 }}>
                                    {isSubmitting ? 'Booking...' : 'Confirm Booking'}
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
