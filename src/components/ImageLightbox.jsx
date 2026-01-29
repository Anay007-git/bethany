import { useState, useEffect, useRef } from 'react';

const ImageLightbox = ({ isOpen, images, initialIndex, onClose }) => {
    // We heavily rely on native scrolling, so state is minimized
    const scrollContainerRef = useRef(null);

    // When opening, scroll to the initial index
    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const itemWidth = container.offsetWidth * 0.8; // Estimated
            // We'll rely on scrollIntoView for precision
            const target = container.children[initialIndex];
            if (target) {
                // Short timeout to ensure layout is ready
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                }, 10);
            }
        }
    }, [isOpen, initialIndex]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: '#fff', // White background as per reference
                zIndex: 9999,
                display: 'flex', flexDirection: 'column',
                animation: 'fadeIn 0.3s ease'
            }}
        >
            {/* Header / Controls */}
            <div style={{
                padding: '20px 40px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1d1d1f' }}>
                    Gallery
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent', border: 'none',
                        color: '#1d1d1f', fontSize: '2rem', cursor: 'pointer',
                        padding: '10px', lineHeight: 1
                    }}
                >
                    &times;
                </button>
            </div>

            {/* Horizontal Scroll Strip */}
            <style>{`
                .lightbox-scroll-container::-webkit-scrollbar { display: none; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            <div
                ref={scrollContainerRef}
                className="lightbox-scroll-container"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollSnapType: 'x mandatory',
                    padding: '0 50vw 0 50vw', // Center padding
                    gap: '40px',
                    scrollbarWidth: 'none', // Hide scrollbar Firefox
                    msOverflowStyle: 'none' // Hide scrollbar IE
                }}
            >
                {images.map((item, index) => {
                    const isVideo = item.type === 'video' || (typeof item.src === 'string' && item.src.endsWith('.mp4'));
                    const isYoutube = item.type === 'youtube';

                    return (
                        <div
                            key={index}
                            style={{
                                flex: '0 0 auto',
                                scrollSnapAlign: 'center',
                                width: '80vw',
                                maxWidth: '600px', // Portrait-ish width
                                height: '80vh',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                transition: 'transform 0.3s ease'
                            }}
                        >
                            {isVideo ? (
                                <video
                                    src={item.src}
                                    controls
                                    style={{
                                        width: '100%', height: '100%', objectFit: 'contain', // Changed to contain to see full image
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                                        backgroundColor: '#000' // Dark bg for video
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : isYoutube ? (
                                <iframe
                                    width="100%" height="100%"
                                    src={`https://www.youtube.com/embed/${item.src}`}
                                    title="YouTube video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                                    }}
                                ></iframe>
                            ) : (
                                <img
                                    src={item.src}
                                    alt={item.alt || `Gallery Image ${index}`}
                                    style={{
                                        width: '100%', height: '100%', objectFit: 'contain', // Changed to contain
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Indicators */}
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#86868b',
                fontSize: '0.9rem',
                display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center'
            }}>
                <span>←</span>
                <span>Scroll to browse</span>
                <span>→</span>
            </div>
        </div>
    );
};

export default ImageLightbox;
