import { Suspense, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React from 'react';

// Lazy Load 3D Scene - Keeping commented out if we want to switch back
// const HeroScene = React.lazy(() => import('./3d/HeroScene'));

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
    const heroRef = useRef(null);
    const contentRef = useRef(null);
    const audioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            } else {
                audioRef.current.pause();
            }
            setIsMuted(!isMuted);
        }
    };

    const scrollToBooking = (e) => {
        e.preventDefault();
        const element = document.getElementById('booking');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToAbout = (e) => {
        e.preventDefault();
        const element = document.getElementById('about');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    // GSAP Intro & Parallax
    useEffect(() => {
        const ctx = gsap.context(() => {
            // 1. Initial State Setting
            gsap.set(".hero-animate", {
                y: 30,
                opacity: 0,
                filter: "blur(10px)"
            });

            // 2. Cinematic Blur Reveal
            gsap.to(".hero-animate", {
                y: 0,
                opacity: 1,
                filter: "blur(0px)",
                duration: 1.5,
                stagger: 0.2,
                ease: "power2.out",
                delay: 0.2
            });

            // 3. Special "Namaste Hills" Shimmer
            gsap.to(".shimmer-text", {
                backgroundPosition: "200% center",
                duration: 3,
                repeat: -1,
                ease: "linear"
            });

            // 4. Parallax Effect (Content moves faster than background)
            gsap.to(contentRef.current, {
                y: 100, // Move content down slightly on scroll
                opacity: 0,
                filter: "blur(5px)", // Fade out with blur
                ease: "none",
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="hero" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Video Background */}
            <div className="hero-video-background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                >
                    <source src="/hero-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)', zIndex: 1, pointerEvents: 'none' }}></div>

            <div ref={contentRef} className="hero-content" style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'white', maxWidth: '800px', padding: '20px' }}>
                <span className="hero-badge hero-animate" style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '20px', fontSize: '0.9rem', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.4)' }}>
                    ✨ Authentic Himalayan Experience
                </span>

                <h1 className="hero-animate" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: '800', margin: '0 0 10px 0', lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.2)', letterSpacing: '-1px' }}>
                    BETHANY HOMESTAY
                    <span style={{ display: 'block', fontSize: '1rem', fontWeight: '500', marginTop: '12px', letterSpacing: '3px', opacity: '0.9', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>
                        <span style={{ opacity: 0.8 }}>🤝 Official Hospitality Partner:</span>
                        <span className="shimmer-text" style={{
                            fontWeight: '700',
                            background: 'linear-gradient(90deg, #ffdde1 0%, #ffffff 50%, #ffdde1 100%)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginLeft: '8px',
                            display: 'inline-block'
                        }}>
                            NAMASTE HILLS
                        </span>
                    </span>
                </h1>

                <p className="hero-subtitle hero-animate" style={{ fontSize: '1.1rem', marginBottom: '30px', opacity: 0.9, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 30px auto' }}>
                    Welcome to the <strong>best homestay in Kalimpong</strong>. Nestled in the hills of <strong>West Bengal, India</strong>,
                    we offer breathtaking mountain views and authentic Himalayan hospitality.
                </p>

                <div className="hero-location hero-animate" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '30px', opacity: 0.8 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>Kalimpong, West Bengal, India</span>
                </div>

                <div className="hero-buttons hero-animate" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href="#booking" className="btn-primary" onClick={scrollToBooking} style={{ background: '#e74c3c', color: 'white', padding: '12px 30px', borderRadius: '30px', fontWeight: '600', textDecoration: 'none', transition: 'transform 0.2s', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                        Book Your Stay
                    </a>
                    <a href="#about" className="btn-secondary" onClick={scrollToAbout} style={{ background: 'rgba(255,255,255,0.9)', color: '#2c3e50', padding: '12px 30px', borderRadius: '30px', fontWeight: '600', textDecoration: 'none', transition: 'transform 0.2s', border: 'none' }}>
                        Explore More
                    </a>
                </div>
            </div>
            {/* Ambient Sound Controller */}
            <div style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 10 }}>
                <button
                    onClick={toggleAudio}
                    style={{
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    title={isMuted ? "Unmute Nature Sounds" : "Mute Nature Sounds"}
                >
                    {isMuted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                    )}
                </button>
                <audio ref={audioRef} loop>
                    <source src="/nature.mp3" type="audio/mpeg" />
                </audio>
            </div>
        </section>
    );
};

export default Hero;
