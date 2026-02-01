import { useState, useRef, useEffect } from 'react';
import ImageLightbox from './ImageLightbox';

const galleryItems = [
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-13 at 10.42.52 PM.mp4' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.39 PM.jpeg', alt: 'Bethany Nature View 1', likes: 124 },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.40 PM (1).jpeg', alt: 'Bethany Nature View 2', likes: 89 },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.47.47 AM.mp4' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.40 PM.jpeg', alt: 'Bethany Nature View 3', likes: 210 },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.41 PM.jpeg', alt: 'Bethany Nature View 4', likes: 156 },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.46.51 AM.mp4' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.42 PM (1).jpeg', alt: 'Bethany Nature View 5', likes: 98 },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.42 PM.jpeg', alt: 'Bethany Nature View 6', likes: 175 },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.47.24 AM.mp4' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.44.44 AM.mp4' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.44.44 AM.mp4' },
    { type: 'youtube', src: 'lUZBGCCRp-Y', alt: 'Bethany Homestay Vibes' },
    { type: 'youtube', src: 'WfWgYTlUkWY', alt: 'Munnar Beauty' },
];

const Gallery = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const handleCardClick = (index) => {
        if (index === activeIndex) {
            openLightbox(index);
        } else {
            setActiveIndex(index);
        }
    };

    // Touch swipe handlers
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50;

        if (diff > threshold && activeIndex < galleryItems.length - 1) {
            setActiveIndex(prev => prev + 1);
        } else if (diff < -threshold && activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        }
    };

    // Dynamic card dimensions based on screen
    const cardWidth = isMobile ? Math.min(260, window.innerWidth * 0.7) : 300;
    const cardHeight = isMobile ? cardWidth * 1.4 : 450;
    const cardGap = isMobile ? cardWidth * 0.85 : 340;

    return (
        <section id="gallery" className="gallery" style={{
            padding: isMobile ? '60px 0' : '80px 0',
            background: '#111',
            color: 'white',
            overflow: 'hidden'
        }}>
            <div className="container" style={{ maxWidth: '100%' }}>
                <div className="section-header" style={{
                    marginBottom: isMobile ? '30px' : '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '0 20px'
                }}>
                    <h2 style={{
                        fontSize: isMobile ? '2rem' : '3rem',
                        marginBottom: '10px',
                        fontWeight: '800',
                        color: 'white',
                        letterSpacing: '-1px'
                    }}>
                        Captured Moments.
                    </h2>
                    <p style={{
                        fontSize: isMobile ? '1rem' : '1.2rem',
                        color: '#86868b',
                        maxWidth: '600px'
                    }}>
                        {isMobile ? 'Swipe to explore' : 'Swipe to explore the beauty of Bethany.'}
                    </p>
                </div>

                {/* 3D Carousel Container */}
                <div
                    className="carousel-container"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: isMobile ? `${cardHeight + 60}px` : '500px',
                        position: 'relative',
                        perspective: '1000px',
                        touchAction: 'pan-y'
                    }}
                >
                    {galleryItems.map((item, index) => {
                        const offset = index - activeIndex;
                        const isActive = offset === 0;
                        const visibleRange = isMobile ? 1 : 2;
                        const isVisible = Math.abs(offset) <= visibleRange;

                        if (!isVisible) return null;

                        return (
                            <div
                                key={index}
                                className={`carousel-card ${isActive ? 'active' : ''}`}
                                style={{
                                    position: 'absolute',
                                    width: `${cardWidth}px`,
                                    height: `${cardHeight}px`,
                                    transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    transform: `
                                        translateX(${offset * cardGap}px) 
                                        scale(${isActive ? 1.05 : (isMobile ? 0.85 : 0.9)}) 
                                        translateZ(${isActive ? 0 : -80}px)
                                        rotateY(${isMobile ? offset * -10 : offset * -15}deg)
                                    `,
                                    zIndex: isActive ? 10 : 5 - Math.abs(offset),
                                    opacity: isActive ? 1 : (isMobile ? 0.4 : 0.6),
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.5)' : 'none',
                                    cursor: 'pointer',
                                    border: isActive ? '2px solid rgba(255,255,255,0.2)' : 'none'
                                }}
                                onClick={() => handleCardClick(index)}
                            >
                                {item.type === 'video' ? (
                                    <video
                                        src={item.src}
                                        muted
                                        loop
                                        playsInline
                                        ref={el => {
                                            if (el) isActive ? el.play() : el.pause();
                                        }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : item.type === 'youtube' ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${item.src}/hqdefault.jpg`}
                                        alt={item.alt}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <img
                                        src={item.src}
                                        alt={item.alt}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )}

                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '20px',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    opacity: isActive ? 1 : 0,
                                    transition: 'opacity 0.3s'
                                }}>
                                    <span style={{ color: 'white', fontWeight: '600', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                        {isActive ? 'Tap to View' : ''}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Navigation Buttons - Hidden on mobile, use swipe instead */}
                    {!isMobile && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => Math.max(0, prev - 1)); }}
                                disabled={activeIndex === 0}
                                style={{
                                    position: 'absolute', left: '10%', top: '50%', transform: 'translateY(-50%)',
                                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                                    width: '50px', height: '50px', color: 'white', fontSize: '24px', cursor: 'pointer',
                                    display: activeIndex === 0 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                ←
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => Math.min(galleryItems.length - 1, prev + 1)); }}
                                disabled={activeIndex === galleryItems.length - 1}
                                style={{
                                    position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)',
                                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                                    width: '50px', height: '50px', color: 'white', fontSize: '24px', cursor: 'pointer',
                                    display: activeIndex === galleryItems.length - 1 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                →
                            </button>
                        </>
                    )}
                </div>

                {/* Dot indicators for mobile */}
                {isMobile && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '20px'
                    }}>
                        {galleryItems.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                style={{
                                    width: index === activeIndex ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: index === activeIndex ? 'white' : 'rgba(255,255,255,0.3)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ImageLightbox
                isOpen={lightboxOpen}
                images={galleryItems}
                initialIndex={currentImageIndex}
                onClose={() => setLightboxOpen(false)}
            />
        </section>
    );
};

export default Gallery;

