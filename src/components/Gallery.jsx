import { useState } from 'react';
import ImageLightbox from './ImageLightbox';

const mediaCollection = [
    { type: 'image', src: '/gallery1.jpg', title: 'Mountain Valley View', category: 'views' },
    { type: 'image', src: '/about.jpg', title: 'Homestay Architecture', category: 'property' },
    { type: 'image', src: '/hero.jpg', title: 'Sunset Horizon at Kalimpong', category: 'views' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-13 at 10.42.52 PM.mp4', title: 'Terrace Walkthrough', category: 'videos' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.39 PM.jpeg', title: 'Verandah Overlook', category: 'property' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.40 PM (1).jpeg', title: 'Pine Hills Morning', category: 'views' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.47.47 AM.mp4', title: 'Garden Vista', category: 'videos' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.40 PM.jpeg', title: 'Cozy Homestay Interiors', category: 'property' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.41 PM.jpeg', title: 'Himalayan Ridge Line', category: 'views' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.46.51 AM.mp4', title: 'Hill Station Breeze', category: 'videos' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.42 PM (1).jpeg', title: 'Lush Surroundings', category: 'property' },
    { type: 'image', src: '/explore-nature/WhatsApp Image 2026-01-13 at 10.45.42 PM.jpeg', title: 'Quiet Corner', category: 'property' },
    { type: 'video', src: '/explore-nature/WhatsApp Video 2026-01-14 at 12.47.24 AM.mp4', title: 'Homestay Grounds', category: 'videos' }
];

const Gallery = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const filteredItems = mediaCollection.filter(item => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'views') return item.category === 'views';
        if (selectedFilter === 'property') return item.category === 'property';
        if (selectedFilter === 'videos') return item.type === 'video';
        return true;
    });

    const openLightbox = (index) => {
        setLightboxIndex(index);
    };

    return (
        <section id="gallery" style={{ padding: '100px 0', backgroundColor: 'var(--himalaya-ivory)' }}>
            <div className="container">
                <div className="section-header">
                    <div className="section-tag">
                        <span>Authentic Imagery</span>
                    </div>
                    <h2>Captured Moments in Kalimpong</h2>
                    <p>
                        Real photography and unedited videos showcasing the authentic scenery, rooms, and peaceful hill environment of Bethany Homestay.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '36px'
                }}>
                    {[
                        { id: 'all', label: 'All Media' },
                        { id: 'views', label: 'Himalayan Panoramas' },
                        { id: 'property', label: 'Property & Interiors' },
                        { id: 'videos', label: 'Video Walkthroughs' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedFilter(tab.id)}
                            style={{
                                padding: '9px 20px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid',
                                borderColor: selectedFilter === tab.id ? 'var(--himalaya-forest)' : 'var(--border-medium)',
                                backgroundColor: selectedFilter === tab.id ? 'var(--himalaya-forest)' : '#FFFFFF',
                                color: selectedFilter === tab.id ? 'var(--himalaya-ivory)' : 'var(--text-main)',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Media Masonry Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredItems.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'relative',
                                height: '240px',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-card)',
                                border: '1px solid var(--border-subtle)'
                            }}
                            className="gallery-media-card"
                            onClick={() => openLightbox(index)}
                        >
                            {item.type === 'video' ? (
                                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                                    <video
                                        src={item.src}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        muted
                                        playsInline
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(0, 0, 0, 0.3)'
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.85)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            color: 'var(--himalaya-forest-dark)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                        }}>
                                            ▶
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={item.src}
                                    alt={item.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.4s ease'
                                    }}
                                    className="gallery-img"
                                />
                            )}

                            {/* Hover Overlay Title */}
                            <div className="gallery-caption-overlay">
                                <span>{item.title}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{item.type === 'video' ? '🎬 Play Video' : '🔍 View High-Res'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <ImageLightbox
                    images={filteredItems.map(i => i.src)}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            <style>{`
                .gallery-media-card:hover .gallery-img {
                    transform: scale(1.04);
                }
                .gallery-caption-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(22, 46, 37, 0.85) 0%, transparent 60%);
                    opacity: 0;
                    transition: opacity 0.25s ease;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 16px;
                    color: #FFFFFF;
                    font-weight: 600;
                    font-size: 0.95rem;
                }
                .gallery-media-card:hover .gallery-caption-overlay {
                    opacity: 1;
                }
            `}</style>
        </section>
    );
};

export default Gallery;
