import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AppleHero = () => {
    const triggerRef = useRef(null);
    const canvasRef = useRef(null);
    const textRef = useRef(null);
    const contextRef = useRef(null);
    const scrollHintRef = useRef(null);
    const imagesRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Audio State
    const audioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);

    // Configuration
    const frameCount = 88;
    const images = [];
    const imagePath = (index) => `/sequence/frame_${index.toString().padStart(2, '0')}_delay-0.5s.png`;

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

    useEffect(() => {
        // Load Inter font if not already available
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        contextRef.current = context;

        // Preload images
        let loadedCount = 0;
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = imagePath(i);
            img.onload = () => {
                loadedCount++;
                if (loadedCount === frameCount) {
                    setIsLoaded(true);
                }
            };
            images.push(img);
        }
        imagesRef.current = images;

        // Set initial canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            renderFrame(0);
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const renderFrame = (index) => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        const image = imagesRef.current[index];

        if (!context || !canvas || !image) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // "object-fit: cover" implementation for canvas
        const hRatio = canvas.width / image.width;
        const vRatio = canvas.height / image.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (canvas.width - image.width * ratio) / 2;
        const centerShift_y = (canvas.height - image.height * ratio) / 2;

        context.drawImage(image, 0, 0, image.width, image.height, centerShift_x, centerShift_y, image.width * ratio, image.height * ratio);
    };

    useEffect(() => {
        if (!isLoaded) return;

        const ctx = gsap.context(() => {
            // 1. Sequence Animation
            ScrollTrigger.create({
                trigger: triggerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
                pin: canvasRef.current.parentElement,
                onUpdate: (self) => {
                    const frame = Math.floor(self.progress * (frameCount - 1));
                    renderFrame(frame);
                }
            });

            // 2. Initial Entrance
            gsap.fromTo(".hero-animate",
                { y: 60, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.1,
                    ease: "power3.out",
                    delay: 0.5
                }
            );

            // 3. SLOW Scroll Exit - Typography fades very slowly
            // Changed from '20% top' to '60% top' to keep text visible much longer
            gsap.to(textRef.current, {
                scrollTrigger: {
                    trigger: triggerRef.current,
                    start: "top top",
                    end: "60% top",
                    scrub: true
                },
                opacity: 0,
                y: -50,
                scale: 0.98,
                filter: "blur(10px)",
                ease: "none"
            });

            // Hints fade out faster
            gsap.to(scrollHintRef.current, {
                scrollTrigger: {
                    trigger: triggerRef.current,
                    start: "top top",
                    end: "10% top",
                    scrub: true
                },
                opacity: 0
            });

        }, triggerRef);

        return () => ctx.revert();
    }, [isLoaded]);

    return (
        <section ref={triggerRef} style={{ height: '600vh', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
            {/* Sticky Container */}
            <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}>

                {/* Canvas Background */}
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                    }}
                />

                {/* Modern Soft Gradient Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.2) 100%)',
                    zIndex: 2,
                    pointerEvents: 'none'
                }}></div>

                {/* Main Content Overlay - Clean Apple Style */}
                <div
                    ref={textRef}
                    className="hero-content"
                    style={{
                        position: 'absolute',
                        top: '45%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 3,
                        textAlign: 'center',
                        color: 'white',
                        width: '100%',
                        maxWidth: '900px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <h1 className="hero-animate" style={{
                        fontSize: 'clamp(4rem, 8vw, 8rem)',
                        fontWeight: '700',
                        lineHeight: 1.1,
                        color: '#ffffff',
                        marginBottom: '10px',
                        letterSpacing: '-2px', // Tighter tracking typical of Apple
                        textShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        Bethany.
                    </h1>
                    <p className="hero-animate" style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                        fontWeight: '500',
                        lineHeight: 1.2,
                        color: 'rgba(255,255,255,0.95)',
                        marginBottom: '30px',
                        letterSpacing: '-0.5px'
                    }}>
                        Sanctuary in the clouds.
                    </p>

                    <div className="hero-animate" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button
                            onClick={scrollToBooking}
                            style={{
                                background: '#0071e3', // Apple Blue
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '980px', // Full pill
                                fontWeight: '500',
                                fontSize: '17px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontFamily: "'Inter', sans-serif",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#0077ED'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#0071e3'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            Reserve your stay
                        </button>
                        <button
                            style={{
                                background: 'transparent',
                                color: '#2997ff', // Apple Link Blue
                                padding: '12px 24px',
                                borderRadius: '980px',
                                fontWeight: '500',
                                fontSize: '17px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontFamily: "'Inter', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                            Learn more <span style={{ fontSize: '12px' }}>›</span>
                        </button>
                    </div>
                </div>

                {/* Minimal Scroll Indicator */}
                <div
                    ref={scrollHintRef}
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.7)',
                        zIndex: 3,
                        pointerEvents: 'none',
                        fontSize: '12px',
                        fontWeight: 500
                    }}
                >
                    Scroll to explore
                </div>

                {/* Audio Control - Transparent Glass */}
                <div style={{ position: 'absolute', bottom: '40px', right: '40px', zIndex: 10 }}>
                    <button
                        onClick={toggleAudio}
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50%',
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                    >
                        {isMuted ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                        )}
                    </button>
                    <audio ref={audioRef} loop>
                        <source src="/nature.mp3" type="audio/mpeg" />
                    </audio>
                </div>
            </div>

        </section >
    );
};

export default AppleHero;
