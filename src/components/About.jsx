import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Text Stagger Animation
            gsap.from(".text-huge", {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 70%",
                },
                y: 50,
                opacity: 0,
                duration: 1.2,
                ease: "power4.out"
            });

            // Card Float Animation
            gsap.from(".nature-card", {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 60%",
                },
                x: 100,
                opacity: 0,
                duration: 1.5,
                ease: "expo.out",
                delay: 0.2
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="about-nature" ref={sectionRef} id="about">
            <div className="nature-bg"></div>
            <div className="nature-overlay"></div>

            <div className="nature-container">
                {/* Left Side: Massive Typography & Glass Widgets */}
                <div className="nature-left">
                    <h2 className="text-huge">
                        EXPLORE<br />
                        NATURE'S<br />
                        HIDEAWAYS
                    </h2>

                    <p className="text-body-crisp">
                        "Welcome to Your Home Away From Home. Nestled in the serene hills of Kalimpong, Bethany Homestay combines traditional warmth with modern comfort. A world of comfort, security, and personalized service awaits."
                    </p>

                    <div className="glass-pill-container">
                        <div className="glass-pill">
                            <span className="pill-label">Elevation</span>
                            <span className="pill-value">1250m</span>
                        </div>
                        <div className="glass-pill">
                            <span className="pill-label">Rating</span>
                            <span className="pill-value">4.9/5★</span>
                        </div>
                        <div className="glass-pill">
                            <span className="pill-label">Vibe</span>
                            <span className="pill-value">Pristine</span>
                        </div>
                        <a href="#booking" className="white-btn-large">
                            Book now
                        </a>
                    </div>
                </div>

                {/* Right Side: Floating Dark "Nordway" Style Card */}
                <div className="nature-card">
                    <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <span>Choose a view</span>
                        <span>Best Place</span>
                    </div>

                    <div className="nature-image-stack">
                        {/* Tilted Image Wrapper */}
                        <div style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', perspective: '1000px' }}>
                            <img src="/about.jpg" alt="Bethany Homestay View" className="tilted-image" />
                        </div>
                    </div>

                    <div>
                        <h3 className="card-title">Exotic Mountain View</h3>
                        <div className="card-subtitle">
                            <span>Private Suite</span>
                            <span>$45 / night</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
