import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Parallax Effect for Image
            gsap.fromTo(imageRef.current,
                { y: 50, scale: 1.1 },
                {
                    y: -50,
                    scale: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                }
            );

            // Fade Up Text
            gsap.from(".about-fade", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 75%",
                },
                y: 60,
                opacity: 0,
                duration: 1.2,
                stagger: 0.2,
                ease: "power3.out"
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            id="about"
            ref={containerRef}
            style={{
                background: '#ffffff',
                padding: '120px 0',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '80px',
                    alignItems: 'center'
                }}>

                    {/* Left: Typography */}
                    <div ref={textRef}>
                        <h2 className="about-fade" style={{
                            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                            fontWeight: '700',
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                            color: '#1d1d1f',
                            marginBottom: '30px'
                        }}>
                            Peace of mind. <br />
                            Standard.
                        </h2>

                        <p className="about-fade" style={{
                            fontSize: '1.25rem',
                            lineHeight: 1.6,
                            color: '#86868b',
                            fontWeight: '400',
                            maxWidth: '450px',
                            marginBottom: '40px'
                        }}>
                            Nestled in the serene hills of Kalimpong, Bethany Homestay offers more than just a room. It is a sanctuary designed for those who appreciate the silence of nature and the comfort of modern luxury.
                        </p>

                        <div className="about-fade">
                            <a href="#booking" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: '#0071e3', // Apple Blue
                                textDecoration: 'none',
                                transition: 'opacity 0.2s'
                            }}>
                                Book your experience <span style={{ fontSize: '1.2em' }}>›</span>
                            </a>
                        </div>
                    </div>

                    {/* Right: Parallax Image Card */}
                    <div
                        className="about-fade"
                        style={{
                            position: 'relative',
                            height: '600px',
                            borderRadius: '30px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ height: '120%', 'width': '100%', position: 'absolute', top: '-10%' }}>
                            <img
                                ref={imageRef}
                                src="/about.jpg"
                                alt="Bethany Interiors"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>

                        {/* Floating Badge */}
                        <div style={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '30px',
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            padding: '16px 24px',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#86868b', textTransform: 'uppercase', letterSpacing: '1px' }}>Elevation</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1d1d1f' }}>1,250 m</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Responsive Fixes */}
            <style>{`
                @media (max-width: 900px) {
                    #about .container > div {
                        grid-template-columns: 1fr !important;
                        gap: 50px !important;
                    }
                    #about h2 {
                        text-align: center;
                    }
                    #about p {
                        text-align: center;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    #about div:has(a) {
                        text-align: center;
                    }
                }
            `}</style>
        </section>
    );
};

export default About;
