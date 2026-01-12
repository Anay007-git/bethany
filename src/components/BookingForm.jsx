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
        features: ['Attached Bathroom', 'Daily Housekeeping', 'Wi-Fi', 'Air Purifier']
    },
    {
        id: 'jordan',
        name: 'Jordan',
        price: 2500,
        beds: '4 Adults',
        extraBed: null,
        view: 'Courtyard View',
        size: null,
        features: ['Attached Bathroom']
    },
    {
        id: 'sion',
        name: 'Sion Room',
        price: 2500,
        beds: '4 Adults',
        extraBed: 'Extra 1 Cot available',
        view: null,
        size: null,
        features: ['Attached Bathroom']
    },
    {
        id: 'zion',
        name: 'Zion',
        price: 2500,
        beds: '4 Adults',
        extraBed: null,
        view: 'City View',
        size: null,
        features: ['Attached Bathroom']
    }
];

const BookingForm = ({ onToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        roomType: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingBookings, setExistingBookings] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
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
            // Fetch bookings from Google Sheets
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
            // Continue without availability check if fetch fails
        } finally {
            setIsLoadingBookings(false);
        }
    };

    // Calculate number of nights and total price
    useEffect(() => {
        if (formData.checkIn && formData.checkOut) {
            const checkIn = new Date(formData.checkIn);
            const checkOut = new Date(formData.checkOut);
            const diffTime = checkOut - checkIn;
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (nights > 0) {
                setNumberOfNights(nights);
                if (formData.roomType) {
                    const selectedRoom = ROOMS.find(r => r.id === formData.roomType);
                    if (selectedRoom) {
                        setTotalPrice(nights * selectedRoom.price);
                    }
                }
            } else {
                setNumberOfNights(0);
                setTotalPrice(0);
            }
        } else {
            setNumberOfNights(0);
            setTotalPrice(0);
        }
    }, [formData.checkIn, formData.checkOut, formData.roomType]);

    // Check room availability for given dates
    const getRoomStatus = (roomId) => {
        if (!formData.checkIn || !formData.checkOut) return 'available';
        if (existingBookings.length === 0) return 'available';

        const checkIn = new Date(formData.checkIn);
        const checkOut = new Date(formData.checkOut);

        // Find the room name for this roomId
        const room = ROOMS.find(r => r.id === roomId);
        if (!room) return 'available';

        for (const booking of existingBookings) {
            // Match room name (case-insensitive, trim spaces)
            const bookingRoomName = (booking.roomType || '').trim().toLowerCase();
            const currentRoomName = room.name.trim().toLowerCase();

            if (bookingRoomName === currentRoomName || bookingRoomName.includes(currentRoomName) || currentRoomName.includes(bookingRoomName)) {
                const bookingCheckIn = new Date(booking.checkIn);
                const bookingCheckOut = new Date(booking.checkOut);

                // Check if dates overlap
                const hasOverlap = checkIn < bookingCheckOut && checkOut > bookingCheckIn;

                if (hasOverlap) {
                    if (booking.status === 'Booked') {
                        return 'booked';
                    } else if (booking.status === 'Pending') {
                        return 'partial';
                    }
                }
            }
        }
        return 'available';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'booked':
                return { text: 'Booked', className: 'status-booked' };
            case 'partial':
                return { text: 'Partially Booked', className: 'status-partial' };
            default:
                return { text: 'Available', className: 'status-available' };
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate room selection
        if (!formData.roomType) {
            onToast('Please select a room type', 'error');
            return;
        }

        // Check if room is fully booked
        const roomStatus = getRoomStatus(formData.roomType);
        if (roomStatus === 'booked') {
            onToast('This room is already booked for the selected dates. Please choose different dates or another room.', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const selectedRoom = ROOMS.find(r => r.id === formData.roomType);

            // Build URL with query parameters including room details
            const params = new URLSearchParams({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                guests: formData.guests,
                roomType: selectedRoom.name,
                pricePerNight: selectedRoom.price,
                numberOfNights: numberOfNights,
                totalPrice: totalPrice,
                status: 'Pending',
                message: formData.message
            });

            // Submit to Google Sheets
            await fetch(`${GOOGLE_SHEETS_URL}?${params.toString()}`, {
                method: 'GET',
                mode: 'no-cors'
            });

            // Save booking details for modal
            setBookingDetails({
                name: formData.name,
                email: formData.email,
                roomName: selectedRoom.name,
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                nights: numberOfNights,
                totalPrice: totalPrice
            });

            // Show success modal
            setShowSuccessModal(true);

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                checkIn: '',
                checkOut: '',
                guests: '1',
                roomType: '',
                message: ''
            });
            setTotalPrice(0);
            setNumberOfNights(0);

            // Refresh bookings
            fetchExistingBookings();
        } catch (error) {
            console.error('Booking error:', error);
            onToast('Failed to send booking request. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <section id="booking" className="booking">
            <div className="container">
                <div className="section-header">
                    <h2>Book Your Stay</h2>
                    <p>Reserve your mountain getaway today and create unforgettable memories</p>
                </div>

                {/* Room Selection Cards */}
                <div className="room-selection">
                    <h3 className="room-selection-title">Select Your Room</h3>
                    <p className="room-selection-subtitle">
                        {formData.checkIn && formData.checkOut
                            ? `Showing availability for ${new Date(formData.checkIn).toLocaleDateString('en-IN')} - ${new Date(formData.checkOut).toLocaleDateString('en-IN')}`
                            : 'Select dates above to check availability'
                        }
                    </p>

                    <div className="room-cards">
                        {ROOMS.map((room) => {
                            const status = getRoomStatus(room.id);
                            const statusInfo = getStatusLabel(status);
                            const isSelected = formData.roomType === room.id;
                            const isDisabled = status === 'booked';

                            return (
                                <div
                                    key={room.id}
                                    className={`room-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => !isDisabled && handleChange({ target: { name: 'roomType', value: room.id } })}
                                >
                                    <div className="room-card-header">
                                        <h4>{room.name}</h4>
                                        <span className={`room-status ${statusInfo.className}`}>
                                            {statusInfo.text}
                                        </span>
                                    </div>
                                    <div className="room-card-price">
                                        <span className="price">₹{room.price.toLocaleString('en-IN')}</span>
                                        <span className="per-night">/night</span>
                                    </div>
                                    <div className="room-card-details">
                                        <p className="beds">🛏️ {room.beds}</p>
                                        {room.extraBed && <p className="extra-bed">➕ {room.extraBed}</p>}
                                        {room.view && <p className="view">🏔️ {room.view}</p>}
                                        {room.size && <p className="size">📐 {room.size}</p>}
                                    </div>
                                    <div className="room-card-features">
                                        {room.features.map((feature, idx) => (
                                            <span key={idx} className="feature-tag">✓ {feature}</span>
                                        ))}
                                    </div>
                                    {isSelected && (
                                        <div className="selected-indicator">
                                            <span>✓ Selected</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="booking-card">
                    <form className="booking-form" onSubmit={handleSubmit}>
                        {/* Date Selection - Moved to top for availability check */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="checkIn">Check-in Date</label>
                                <input
                                    type="date"
                                    id="checkIn"
                                    name="checkIn"
                                    value={formData.checkIn}
                                    onChange={handleChange}
                                    min={today}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="checkOut">Check-out Date</label>
                                <input
                                    type="date"
                                    id="checkOut"
                                    name="checkOut"
                                    value={formData.checkOut}
                                    onChange={handleChange}
                                    min={formData.checkIn || today}
                                    required
                                />
                            </div>
                        </div>

                        {/* Room Type Selection */}
                        <div className="form-group full-width">
                            <label htmlFor="roomTypeSelect">Room Type *</label>
                            <select
                                id="roomTypeSelect"
                                name="roomType"
                                value={formData.roomType}
                                onChange={handleChange}
                                required
                                className={formData.roomType ? 'room-selected' : ''}
                            >
                                <option value="">-- Select a Room --</option>
                                {ROOMS.map((room) => {
                                    const status = getRoomStatus(room.id);
                                    const statusText = status === 'booked' ? ' (Booked)' : status === 'partial' ? ' (Partially Booked)' : '';
                                    const isDisabled = status === 'booked';
                                    return (
                                        <option
                                            key={room.id}
                                            value={room.id}
                                            disabled={isDisabled}
                                        >
                                            {room.name} - ₹{room.price.toLocaleString('en-IN')}/night • {room.beds}{statusText}
                                        </option>
                                    );
                                })}
                            </select>
                            {formData.roomType && (
                                <div className="selected-room-info">
                                    <span className="room-name">🏠 {ROOMS.find(r => r.id === formData.roomType)?.name}</span>
                                    <span className="room-beds">{ROOMS.find(r => r.id === formData.roomType)?.beds}</span>
                                    {ROOMS.find(r => r.id === formData.roomType)?.view && (
                                        <span className="room-view">🏔️ {ROOMS.find(r => r.id === formData.roomType)?.view}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Price Summary */}
                        {formData.roomType && numberOfNights > 0 && (
                            <div className="price-summary">
                                <div className="price-summary-header">
                                    <span className="summary-title">📋 Booking Summary</span>
                                </div>
                                <div className="price-row">
                                    <span>Room:</span>
                                    <span className="room-name-highlight">{ROOMS.find(r => r.id === formData.roomType)?.name}</span>
                                </div>
                                <div className="price-row">
                                    <span>Check-in:</span>
                                    <span>{new Date(formData.checkIn).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="price-row">
                                    <span>Check-out:</span>
                                    <span>{new Date(formData.checkOut).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="price-row">
                                    <span>Duration:</span>
                                    <span><strong>{numberOfNights}</strong> night(s)</span>
                                </div>
                                <div className="price-row calculation">
                                    <span>Rate:</span>
                                    <span>₹{ROOMS.find(r => r.id === formData.roomType)?.price.toLocaleString('en-IN')} × {numberOfNights} nights</span>
                                </div>
                                <div className="price-row total">
                                    <span>Total Amount:</span>
                                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <p className="booking-note">
                                    <span className="note-icon">ℹ️</span>
                                    Room Only • Meals at extra charges • Non-Refundable
                                </p>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="guests">Number of Guests</label>
                                <select
                                    id="guests"
                                    name="guests"
                                    value={formData.guests}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="1">1 Guest</option>
                                    <option value="2">2 Guests</option>
                                    <option value="3">3 Guests</option>
                                    <option value="4">4 Guests</option>
                                    <option value="5">5+ Guests</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="message">Special Requests (Optional)</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Any special requirements or questions..."
                                rows="4"
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting || !formData.roomType}
                        >
                            {isSubmitting ? 'Sending Request...' : `Book Now${totalPrice > 0 ? ` - ₹${totalPrice.toLocaleString('en-IN')}` : ''}`}
                        </button>
                    </form>
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
        </section>
    );
};

export default BookingForm;
