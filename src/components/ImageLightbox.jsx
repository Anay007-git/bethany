import { useState, useEffect } from 'react';

const ImageLightbox = ({ isOpen, images, initialIndex, onClose }) => {
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        setIndex(initialIndex);
    }, [initialIndex]);

    if (!isOpen) return null;

    const next = (e) => { e.stopPropagation(); setIndex((prev) => (prev + 1) % images.length); };
    const prev = (e) => { e.stopPropagation(); setIndex((prev) => (prev - 1 + images.length) % images.length); };

    // Helper to get current item
    const currentItem = images[index];
    // Check if the item is an object with src/type or just a string URL
    const isVideo = currentItem?.type === 'video' || (typeof currentItem === 'string' && currentItem.endsWith('.mp4'));
    const src = currentItem?.src || currentItem;

    return (
        <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}
            onClick={onClose}
        >
            <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer', zIndex: 10001, opacity: 0.8 }}>×</button>

            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isVideo ? (
                    <video
                        src={src}
                        controls
                        autoPlay
                        style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '4px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : currentItem?.type === 'youtube' ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${src}?autoplay=1&rel=0`}
                        title="YouTube video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                            width: '80vw',
                            height: '80vh',
                            maxWidth: '500px', // Shorts format vertical
                            borderRadius: '12px',
                            boxShadow: '0 0 30px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    ></iframe>
                ) : (
                    <img
                        src={src}
                        alt="Fullscreen view"
                        style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>

            {images.length > 1 && (
                <>
                    <button onClick={prev} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>❮</button>
                    <button onClick={next} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>❯</button>
                    <div style={{ position: 'absolute', bottom: '20px', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                        {index + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageLightbox;
