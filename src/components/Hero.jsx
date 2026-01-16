import { Suspense, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React from 'react';

// Lazy Load 3D Scene - Keeping commented out if we want to switch back
// const HeroScene = React.lazy(() => import('./3d/HeroScene'));

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
    const heroRef = useRef(null);
    const contentRef = useRef(null);

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
            // Intro Animation (Fade Up)
            gsap.from(".hero-animate", {
                y: 50,
                opacity: 0,
                duration: 1.2,
                stagger: 0.2,
                ease: "power3.out",
                delay: 0.5
            });

            // Parallax Effect (Content moves faster than background)
            gsap.to(contentRef.current, {
                y: 100, // Move content down slightly on scroll
                opacity: 0,
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

                <h1 className="hero-animate" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: '800', margin: '0 0 10px 0', lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    BETHANY HOMESTAY
                    <span style={{ display: 'block', fontSize: '1rem', fontWeight: '500', marginTop: '12px', letterSpacing: '2px', opacity: '0.9', fontFamily: 'Inter, sans-serif' }}>
                        <span style={{ opacity: 0.8 }}>🤝 Official Hospitality Partner:</span> <span style={{ fontWeight: '600', color: '#ffdde1' }}>Namaste Hills</span>
                    </span>
                </h1>

                <p className="hero-subtitle hero-animate" style={{ fontSize: '1.1rem', marginBottom: '30px', opacity: 0.9, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 30px auto' }}>
                    Experience the warmth of traditional hospitality in the heart of Kalimpong,
                    surrounded by breathtaking mountain views.
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
        </section>
    );
};

export default Hero;
