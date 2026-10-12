import { useRef, useState, useEffect } from 'react';
import './AppleHero.css';

const AppleHero = () => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    // Hero Quick Availability Search State
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const [quickCheckIn, setQuickCheckIn] = useState(today);
    const [quickCheckOut, setQuickCheckOut] = useState(tomorrow);
    const [quickGuests, setQuickGuests] = useState('2');

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => {});
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            // Dispatch custom event to sync with BookingForm state
            window.dispatchEvent(new CustomEvent('bethany:quickSearch', {
                detail: {
                    checkIn: quickCheckIn,
                    checkOut: quickCheckOut,
                    guests: quickGuests
                }
            }));
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsPlaying(false);
                });
            }
        }
    }, []);

    return (
        <section className="himalayan-hero" id="home">
            {/* Background Video / Authentic Photography Fallback */}
            <div className="hero-media-wrapper">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    webkit-playsinline="true"
                    poster="/hero.jpg"
                    preload="auto"
                    className="hero-video"
                >
                    <source src="/hero-video.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay"></div>
            </div>

            {/* Media Controls */}
            <div className="hero-media-controls">
                <button
                    onClick={togglePlay}
                    className="hero-control-btn"
                    aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
                    title={isPlaying ? 'Pause video' : 'Play video'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                    onClick={toggleMute}
                    className="hero-control-btn"
                    aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>

            {/* Hero Main Content */}
            <div className="container hero-container">
                <div className="hero-header-content">
                    <div className="hero-pill-badge">
                        <span className="pill-dot"></span>
                        <span>Boutique Sanctuary · Kalimpong, West Bengal</span>
                    </div>

                    <h1 className="hero-main-title">
                        Wake up above the clouds in the lap of the Himalayas
                    </h1>

                    <p className="hero-lead-text">
                        Perched at 1,250 meters elevation near Dr. Graham's Homes. Experience panoramic vistas of the Kanchenjunga range, wholesome home-cooked meals, and heartfelt hospitality.
                    </p>

                    <div className="hero-feature-pills">
                        <span className="feature-pill">🏔️ 180° Kanchenjunga View</span>
                        <span className="feature-pill">★ 4.9 Google Rated</span>
                        <span className="feature-pill">🥗 Organic Hill Meals</span>
                        <span className="feature-pill">📶 High-Speed Wi-Fi</span>
                    </div>
                </div>

                {/* Prominent Availability Quick Bar */}
                <div className="hero-availability-card">
                    <form onSubmit={handleSearchSubmit} className="hero-search-form">
                        <div className="search-field">
                            <label htmlFor="quick-checkin">Check-in</label>
                            <input
                                id="quick-checkin"
                                type="date"
                                min={today}
                                value={quickCheckIn}
                                onChange={(e) => {
                                    setQuickCheckIn(e.target.value);
                                    if (e.target.value >= quickCheckOut) {
                                        const nextDay = new Date(e.target.value);
                                        nextDay.setDate(nextDay.getDate() + 1);
                                        setQuickCheckOut(nextDay.toISOString().split('T')[0]);
                                    }
                                }}
                                required
                            />
                        </div>

                        <div className="search-field">
                            <label htmlFor="quick-checkout">Check-out</label>
                            <input
                                id="quick-checkout"
                                type="date"
                                min={quickCheckIn || today}
                                value={quickCheckOut}
                                onChange={(e) => setQuickCheckOut(e.target.value)}
                                required
                            />
                        </div>

                        <div className="search-field">
                            <label htmlFor="quick-guests">Guests</label>
                            <select
                                id="quick-guests"
                                value={quickGuests}
                                onChange={(e) => setQuickGuests(e.target.value)}
                            >
                                <option value="1">1 Guest</option>
                                <option value="2">2 Guests</option>
                                <option value="3">3 Guests</option>
                                <option value="4">4 Guests</option>
                                <option value="5">5 Guests</option>
                                <option value="6">6+ Guests (Family)</option>
                            </select>
                        </div>

                        <div className="search-action">
                            <button type="submit" className="hero-search-btn">
                                <span>Check Availability</span>
                                <span className="arrow-icon">→</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default AppleHero;
