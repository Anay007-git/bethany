const galleryItems = [
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-13 at 10.42.52 PM.mp4' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.39 PM.jpeg', alt: 'Bethany Nature View 1' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.40 PM (1).jpeg', alt: 'Bethany Nature View 2' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.47.47 AM.mp4' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.40 PM.jpeg', alt: 'Bethany Nature View 3' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.41 PM.jpeg', alt: 'Bethany Nature View 4' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.46.51 AM.mp4' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.42 PM (1).jpeg', alt: 'Bethany Nature View 5' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.42 PM.jpeg', alt: 'Bethany Nature View 6' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.47.24 AM.mp4' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.44.44 AM.mp4' },
];

const Gallery = () => {
    return (
        <section id="gallery" className="gallery">
            <div className="container">
                <div className="section-header">
                    <h2>Explore Nature at Bethany</h2>
                    <p>Immerse yourself in the breathtaking beauty that surrounds us</p>
                </div>
                <div className="gallery-grid">
                    {galleryItems.map((item, index) => (
                        <div key={index} className="gallery-item" style={{ overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                            {item.type === 'video' ? (
                                <video
                                    src={item.src}
                                    controls
                                    preload="metadata"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            ) : (
                                <img
                                    src={item.src}
                                    alt={item.alt}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Gallery;
