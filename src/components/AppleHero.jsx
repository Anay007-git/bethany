import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './AppleHero.css'; // Responsive styles

gsap.registerPlugin(ScrollTrigger);

const AppleHero = () => {
    const triggerRef = useRef(null);
    const videoRef = useRef(null);
    const textRef = useRef(null);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
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

    const scrollToBooking = (e) => {
        e.preventDefault();
        const element = document.getElementById('booking');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Load Inter font
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Animations
        const ctx = gsap.context(() => {
            // Master Timeline for Hero Entrance
            const tl = gsap.timeline({ delay: 0.5 });

            // 1. Title Reveal (Slow fade up + scale)
            tl.fromTo(".hero-title",
                { y: 100, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 1.8, ease: "power4.out" }
            );

            // 2. Subtitle Reveal (Slightly faster, staggering)
            tl.fromTo(".hero-subtitle",
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.5, ease: "power3.out" },
                "-=1.4" // Overlap with title
            );

            // 3. Buttons Reveal (Pop up)
            tl.fromTo(".hero-btn",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "back.out(1.2)" },
                "-=1.0"
            );
        }, triggerRef);

        return () => {
            document.head.removeChild(link);
            ctx.revert();
        };
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => {
                console.log("AppleHero video autoplay interrupted:", e);
                setIsPlaying(false);
            });
        }
    }, []);

    // Button Style Helper
    const ControlButton = ({ onClick, children, label }) => (
        <button
            onClick={onClick}
            aria-label={label}
            style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {children}
        </button>
    );

    return (
        <section ref={triggerRef} style={{ height: '100vh', position: 'relative', fontFamily: "'Inter', sans-serif", overflow: 'hidden', background: '#000' }}>

            {/* Video Background */}
            <video
                ref={videoRef}
                muted={isMuted}
                loop
                playsInline
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.8 // Slightly darken video for text contrast if needed
                }}
            >
                <source src="/promo-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Gradient Overlay for Text Readability - Bottom Up */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0, width: '100%', height: '60%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                zIndex: 2,
                pointerEvents: 'none'
            }}></div>

            {/* Content */}
            <div
                ref={textRef}
                className="hero-content"
                style={{
                    position: 'absolute',
                    bottom: '12%', // Positioned lower now, more like Apple feature videos
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3,
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '900px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}
            >
                <h1 className="hero-title" style={{
                    fontSize: 'clamp(5rem, 15vw, 12rem)', // FAST HUGE FONT
                    fontWeight: '800',
                    lineHeight: '0.9',
                    letterSpacing: '-0.04em',
                    color: 'white',
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.5))', // Deep shadow
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 100%)', // Subtle metallic gradient
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Bethany.
                </h1>
                <p className="hero-subtitle" style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    fontWeight: '400',
                    lineHeight: 1.4,
                    color: '#f5f5f7',
                    marginBottom: '50px',
                    maxWidth: '800px',
                    letterSpacing: '-0.01em',
                    opacity: 0.9,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                    Sanctuary in the clouds.
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button
                        className="hero-btn"
                        onClick={scrollToBooking}
                        style={{
                            background: '#0071e3',
                            color: 'white',
                            padding: '18px 48px',
                            borderRadius: '980px',
                            fontWeight: '600',
                            fontSize: '1.2rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 10px 30px rgba(0, 113, 227, 0.4)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 113, 227, 0.5)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 113, 227, 0.4)'; }}
                    >
                        Reserve
                    </button>
                    <button
                        className="hero-btn"
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            color: 'white',
                            padding: '18px 48px',
                            borderRadius: '980px',
                            fontWeight: '600',
                            fontSize: '1.2rem',
                            border: '1px solid rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        Explore
                    </button>
                </div>
            </div>

            {/* Controls - Bottom Right */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                display: 'flex',
                gap: '12px',
                zIndex: 10
            }}>
                <ControlButton onClick={togglePlay} label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </ControlButton>

                <ControlButton onClick={toggleMute} label={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                    )}
                </ControlButton>
            </div>

        </section >
    );
};

export default AppleHero;
