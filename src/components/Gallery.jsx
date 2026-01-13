import { useState } from 'react';
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
];

const Gallery = () => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    return (
        <section id="gallery" className="gallery" style={{ padding: '80px 0', background: '#fafafa' }}>
            <div className="container">
                <div className="section-header" style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Explore Nature at Bethany</h2>
                    <p style={{ fontSize: '1.1rem', color: '#7f8c8d' }}>Immerse yourself in the breathtaking beauty that surrounds us</p>
                </div>

                <div className="gallery-masonry">
                    {galleryItems.map((item, index) => (
                        <div
                            key={index}
                            className="gallery-item-insta"
                            onClick={() => openLightbox(index)}
                        >
                            {item.type === 'video' ? (
                                <div className="media-wrapper">
                                    <video
                                        src={item.src}
                                        preload="metadata"
                                        className="gallery-media"
                                    />
                                    <div className="video-icon">▶</div>
                                </div>
                            ) : (
                                <div className="media-wrapper">
                                    <img
                                        src={item.src}
                                        alt={item.alt}
                                        loading="lazy"
                                        className="gallery-media"
                                    />
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="insta-overlay">
                                <div className="overlay-content">
                                    <span className="overlay-icon">
                                        {item.type === 'video' ? '🎥 Watch' : '❤️ ' + item.likes}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
