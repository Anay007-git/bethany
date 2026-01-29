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
    // Carousel Implementation for "Cover Flow" look
    const scrollContainerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Lightbox State - RESTORED
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    // Scroll to active item when index changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const cardWidth = 300; // Base width of card
            const gap = 40;
            const containerCenter = container.offsetWidth / 2;
            const cardCenter = cardWidth / 2;

            // Calculate position to center the active card
            // We assume cards are base width + gap
            // This is a naive scroll, for a true "cover flow" we'll use absolute positioning or mapped transforms in standard flex
            // Let's stick to a robust flex scroll with snap for mobile 
        }
    }, [activeIndex]);

    const handleCardClick = (index) => {
        if (index === activeIndex) {
            openLightbox(index);
        } else {
            setActiveIndex(index);
        }
    };

    return (
        <section id="gallery" className="gallery" style={{ padding: '80px 0', background: '#111', color: 'white', overflow: 'hidden' }}>
            <div className="container" style={{ maxWidth: '100%' }}>
                <div className="section-header" style={{ marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '3rem', marginBottom: '10px', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>Captured Moments.</h2>
                    <p style={{ fontSize: '1.2rem', color: '#86868b', maxWidth: '600px' }}>Swipe to explore the beauty of Bethany.</p>
                </div>

                {/* 3D Carousel Container */}
                <div className="carousel-container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '500px',
                    position: 'relative',
                    perspective: '1000px'
                }}>
                    {/* 
                        We only render a subset of items around the active index for performance and visual clarity
                        OR we render all but absolutely positioned based on distance from active
                    */}
                    {galleryItems.map((item, index) => {
                        // Calculate offset from active
                        const offset = index - activeIndex;
                        const isActive = offset === 0;
                        const isVisible = Math.abs(offset) <= 2; // Only show center + 2 neighbors

                        if (!isVisible) return null;

                        return (
                            <div
                                key={index}
                                className={`carousel-card ${isActive ? 'active' : ''}`}
                                style={{
                                    position: 'absolute',
                                    width: '300px', // Matches typical phone aspect ratio
                                    height: '450px',
                                    transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    transform: `
                                        translateX(${offset * 340}px) 
                                        scale(${isActive ? 1.1 : 0.9}) 
                                        translateZ(${isActive ? 0 : -100}px)
                                        rotateY(${offset * -15}deg)
                                    `,
                                    zIndex: isActive ? 10 : 5 - Math.abs(offset),
                                    opacity: isActive ? 1 : 0.6,
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
                                        // Auto play only active?
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
                                    <span style={{ color: 'white', fontWeight: '600' }}>
                                        {isActive ? 'Click to View' : ''}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Navigation Buttons for desktop convenience */}
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

                </div>
            </div>

            <ImageLightbox
                isOpen={lightboxOpen}
                images={galleryItems}
                initialIndex={currentImageIndex}
                onClose={() => setLightboxOpen(false)}
            />
        </section >
    );
};

export default Gallery;
