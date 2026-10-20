import { useState, useEffect } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { DEFAULT_ROOMS, getSeasonalRoomPrice } from '../utils/pricingAndBooking';
import ImageLightbox from './ImageLightbox';

const RoomShowcase = ({ onSelectRoom }) => {
    const [rooms, setRooms] = useState(DEFAULT_ROOMS);
    const [activeRoomId, setActiveRoomId] = useState('carmel');
    const [lightboxState, setLightboxState] = useState({ isOpen: false, images: [], index: 0 });
    const [detailModalRoom, setDetailModalRoom] = useState(null);

    const fetchRooms = async () => {
        try {
            const dbRooms = await SupabaseService.getRooms();
            if (dbRooms && dbRooms.length > 0) {
                const formatted = dbRooms.map(r => ({
                    id: r.id,
                    name: r.name,
                    priceLowSeason: Number(r.price_low_season || 2500),
                    priceHighSeason: Number(r.price_high_season || 3000),
                    price_low_season: Number(r.price_low_season || 2500),
                    price_high_season: Number(r.price_high_season || 3000),
                    capacity: r.capacity || '4 Adults',
                    beds: r.capacity || '4 Adults',
                    extraBed: r.extra_bed || (r.id === 'carmel' ? 'Extra 1 Mattress available' : r.id === 'sion' ? 'Extra 1 Cot available' : null),
                    view: r.view_type || r.view || (r.id === 'carmel' ? 'Mountain View' : r.id === 'jordan' ? 'Courtyard View' : 'City View'),
                    size: r.size || (r.id === 'carmel' ? '616 sq.ft (57 sq.mt)' : r.id === 'jordan' ? '380 sq.ft (35 sq.mt)' : r.id === 'sion' ? '320 sq.ft (28 sq.mt)' : '528 sq.ft (48 sq.mt)'),
                    features: r.features && r.features.length > 0 ? r.features : ['Attached Western Bathroom', 'High-Speed Wi-Fi', 'Daily Housekeeping', '24/7 Hot Water'],
                    images: r.images && r.images.length > 0 ? r.images : DEFAULT_ROOMS.find(dr => dr.id === r.id)?.images || ['https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'],
                    description: r.description || DEFAULT_ROOMS.find(dr => dr.id === r.id)?.description || ''
                }));
                setRooms(formatted);
                if (!formatted.some(r => r.id === activeRoomId)) {
                    setActiveRoomId(formatted[0].id);
                }
            }
        } catch (err) {
            console.error("Room fetch error, using verified defaults:", err);
        }
    };

    useEffect(() => {
        fetchRooms();

        const handleRoomsUpdated = () => fetchRooms();
        window.addEventListener('bethany:roomsUpdated', handleRoomsUpdated);
        window.addEventListener('focus', handleRoomsUpdated);

        return () => {
            window.removeEventListener('bethany:roomsUpdated', handleRoomsUpdated);
            window.removeEventListener('focus', handleRoomsUpdated);
        };
    }, []);

    const openLightbox = (images, index = 0) => {
        setLightboxState({ isOpen: true, images, index });
    };

    const handleBookNow = (room) => {
        if (onSelectRoom) {
            onSelectRoom(room);
        } else {
            // Dispatch event to BookingForm
            window.dispatchEvent(new CustomEvent('bethany:selectRoom', { detail: room }));
            const bookingEl = document.getElementById('booking');
            if (bookingEl) {
                bookingEl.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <section id="rooms" style={{ padding: '100px 0', backgroundColor: 'var(--himalaya-ivory)' }}>
            <div className="container">
                <div className="section-header">
                    <div className="section-tag">
                        <span>Curated Hospitality</span>
                    </div>
                    <h2>Our {rooms.length > 0 ? rooms.length : 4} Boutique Suites</h2>
                    <p>
                        Designed with authentic hill-station charm, panoramic views, and private en-suite bathrooms. Every stay includes daily housekeeping and organic Himalayan morning breakfast options.
                    </p>
                </div>

                {/* Room Selector Filter Tabs */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '40px'
                }}>
                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setActiveRoomId(room.id)}
                            style={{
                                padding: '10px 22px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid',
                                borderColor: activeRoomId === room.id ? 'var(--himalaya-forest)' : 'var(--border-medium)',
                                backgroundColor: activeRoomId === room.id ? 'var(--himalaya-forest)' : '#FFFFFF',
                                color: activeRoomId === room.id ? 'var(--himalaya-ivory)' : 'var(--text-main)',
                                fontWeight: '600',
                                fontSize: '0.94rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: activeRoomId === room.id ? '0 4px 12px rgba(35, 72, 59, 0.2)' : 'none'
                            }}
                        >
                            {room.name} · <span style={{ opacity: 0.85, fontWeight: '400' }}>{room.view}</span>
                        </button>
                    ))}
                </div>

                {/* Featured Selected Room Card */}
                {(() => {
                    const room = rooms.find(r => r.id === activeRoomId) || rooms[0];
                    return (
                        <div style={{
                            background: '#FFFFFF',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-subtle)',
                            boxShadow: 'var(--shadow-card)',
                            overflow: 'hidden',
                            display: 'grid',
                            gridTemplateColumns: '1.15fr 0.85fr',
                            marginBottom: '60px'
                        }} className="featured-room-card">
                            {/* Image Showcase Gallery */}
                            <div style={{ position: 'relative', minHeight: '440px', background: '#222' }}>
                                <img
                                    src={room.images[0]}
                                    alt={`${room.name} Primary View`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => openLightbox(room.images, 0)}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    left: '16px',
                                    right: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        onClick={() => openLightbox(room.images, 0)}
                                        style={{
                                            background: 'rgba(22, 46, 37, 0.85)',
                                            color: '#FFFFFF',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            padding: '8px 16px',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            backdropFilter: 'blur(8px)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span>📷</span>
                                        <span>View All Photos ({room.images.length})</span>
                                    </button>

                                    <span style={{
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        color: 'var(--himalaya-forest-dark)',
                                        padding: '6px 14px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.82rem',
                                        fontWeight: '700'
                                    }}>
                                        {room.view}
                                    </span>
                                </div>
                            </div>

                            {/* Details & Booking Column */}
                            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '2.1rem', marginBottom: '4px' }}>{room.name}</h3>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--himalaya-grey)', fontWeight: '500' }}>
                                                {room.size} · {room.capacity}
                                            </span>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--himalaya-forest-dark)', fontFamily: 'var(--font-serif)' }}>
                                                ₹{getSeasonalRoomPrice(new Date(), room.id, rooms).toLocaleString('en-IN')}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'block' }}>
                                                per night
                                            </span>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '0.96rem', lineHeight: '1.65', marginBottom: '24px' }}>
                                        {room.description}
                                    </p>

                                    {room.extraBed && (
                                        <div style={{
                                            padding: '8px 14px',
                                            background: 'var(--himalaya-forest-subtle)',
                                            borderRadius: 'var(--radius-xs)',
                                            fontSize: '0.86rem',
                                            fontWeight: '600',
                                            color: 'var(--himalaya-forest)',
                                            marginBottom: '20px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>🛏️</span>
                                            <span>{room.extraBed}</span>
                                        </div>
                                    )}

                                    {/* Features Checklist */}
                                    <div style={{ marginBottom: '28px' }}>
                                        <h4 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--himalaya-grey)', marginBottom: '12px' }}>
                                            Room Features
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {room.features.map((feat, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                                    <span style={{ color: 'var(--himalaya-forest)', fontWeight: 'bold' }}>✓</span>
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '14px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                                    <button
                                        onClick={() => handleBookNow(room)}
                                        className="btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        Reserve {room.name}
                                    </button>
                                    <button
                                        onClick={() => setDetailModalRoom(room)}
                                        className="btn-secondary"
                                    >
                                        Full Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* All Rooms Comparison Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '24px'
                }}>
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                border: '1px solid var(--border-subtle)',
                                boxShadow: 'var(--shadow-card)',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            className="room-mini-card"
                        >
                            <div style={{ position: 'relative', height: '180px' }}>
                                <img
                                    src={room.images[0]}
                                    alt={room.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(22, 46, 37, 0.85)',
                                    color: '#FFFFFF',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                    padding: '4px 10px',
                                    borderRadius: 'var(--radius-full)'
                                }}>
                                    {room.view}
                                </span>
                            </div>

                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '1.25rem', margin: 0 }}>{room.name}</h4>
                                        <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--himalaya-forest)' }}>
                                            ₹{getSeasonalRoomPrice(new Date(), room.id, rooms).toLocaleString('en-IN')}
                                            <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-light)' }}>/nt</span>
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                                        {room.capacity} · {room.size}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleBookNow(room)}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '9px 12px', fontSize: '0.88rem' }}
                                    >
                                        Book Now
                                    </button>
                                    <button
                                        onClick={() => openLightbox(room.images, 0)}
                                        className="btn-secondary"
                                        style={{ padding: '9px 14px', fontSize: '0.88rem' }}
                                        title="View Photos"
                                    >
                                        📷
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Room Lightbox Viewer */}
            {lightboxState.isOpen && (
                <ImageLightbox
                    images={lightboxState.images}
                    currentIndex={lightboxState.index}
                    onClose={() => setLightboxState({ isOpen: false, images: [], index: 0 })}
                />
            )}

            {/* Room Details Modal */}
            {detailModalRoom && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '680px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '36px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setDetailModalRoom(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'var(--himalaya-ivory)',
                                border: 'none',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            aria-label="Close details"
                        >
                            ✕
                        </button>

                        <div className="section-tag" style={{ marginBottom: '10px' }}>
                            <span>{detailModalRoom.view}</span>
                        </div>
                        <h2 style={{ marginBottom: '8px' }}>{detailModalRoom.name}</h2>
                        <div style={{ fontSize: '1rem', color: 'var(--himalaya-grey)', marginBottom: '20px' }}>
                            {detailModalRoom.size} · {detailModalRoom.capacity}
                        </div>

                        {/* Photo Gallery Strip */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                            {detailModalRoom.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`${detailModalRoom.name} view ${i + 1}`}
                                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}
                                    onClick={() => openLightbox(detailModalRoom.images, i)}
                                />
                            ))}
                        </div>

                        <p style={{ marginBottom: '20px', lineHeight: '1.7' }}>
                            {detailModalRoom.description}
                        </p>

                        <div style={{
                            background: 'var(--himalaya-ivory)',
                            padding: '16px 20px',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Room Tariff
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--himalaya-forest-dark)' }}>
                                    ₹{getSeasonalRoomPrice(new Date(), detailModalRoom.id, rooms).toLocaleString('en-IN')} <span style={{ fontSize: '0.85rem', fontWeight: '400', color: 'var(--text-light)' }}>/ night</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--himalaya-forest)', fontWeight: '600' }}>
                                ✓ Best Rate Guaranteed
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    const rm = detailModalRoom;
                                    setDetailModalRoom(null);
                                    handleBookNow(rm);
                                }}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                Book {detailModalRoom.name}
                            </button>
                            <button
                                onClick={() => setDetailModalRoom(null)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 900px) {
                    .featured-room-card {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default RoomShowcase;
