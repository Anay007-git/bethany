import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const amenityData = [
    {
        title: "Mountain Views",
        desc: "Panoramic 180° Himalayas",
        icon: "🏔️",
        bg: "/view.jpg", // Assuming we have this or similar, else we use color
        colSpan: 2,
        rowSpan: 2,
        type: "feature"
    },
    {
        title: "High-Speed WiFi",
        desc: "Starlink-grade connectivity",
        icon: "📶",
        colSpan: 1,
        rowSpan: 1,
        type: "standard"
    },
    {
        title: "Private Suites",
        desc: "Soundproof luxury",
        icon: "🛏️",
        colSpan: 1,
        rowSpan: 1,
        type: "standard"
    },
    {
        title: "Farm to Table",
        desc: "Organic local meals",
        icon: "🥗",
        colSpan: 1,
        rowSpan: 1,
        type: "standard"
    },
    {
        title: "Guided Tours",
        desc: "Expert local guides",
        icon: "trekking", // Placeholder for SVG check later
        colSpan: 1,
        rowSpan: 1,
        type: "standard"
    }
];

const Amenities = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".bento-item", {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 70%",
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out"
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="amenities" ref={sectionRef} style={{ background: '#f5f5f7', padding: '120px 0' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '15px' }}>
                        Everything you need.
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: '#86868b' }}>
                        Designed for comfort, curated for experience.
                    </p>
                </div>

                <div className="bento-grid">
                    {/* 1. Large Feature Card - Views */}
                    <div className="bento-item feature-card">
                        <div className="bento-content">
                            <span className="bento-icon">🏔️</span>
                            <h3>The View.</h3>
                            <p>Wake up to the majestic Kanchenjunga.<br />Unobstructed. Unforgettable.</p>
                        </div>
                        {/* Abstract Gradient Background since we might not have a specific image ready */}
                        <div className="bento-bg-gradient"></div>
                    </div>

                    {/* 2. Standard Card - WiFi */}
                    <div className="bento-item standard-card">
                        <span className="bento-icon-large">📶</span>
                        <h3>Ultra-Fast WiFi</h3>
                        <p>Stream 4K from the clouds.</p>
                    </div>

                    {/* 3. Standard Card - Private Rooms */}
                    <div className="bento-item standard-card">
                        <span className="bento-icon-large">🛏️</span>
                        <h3>Cozy Suites</h3>
                        <p>Heated blankets included.</p>
                    </div>

                    {/* 4. Wide Card - Food */}
                    <div className="bento-item wide-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <span className="bento-icon-large">🥗</span>
                            <div>
                                <h3>Organic Kitchen</h3>
                                <p>Fresh ingredients from our garden.</p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Standard Card - Security */}
                    <div className="bento-item standard-card">
                        <span className="bento-icon-large">🛡️</span>
                        <h3>24/7 Security</h3>
                        <p>Peace of mind guaranteed.</p>
                    </div>
                </div>
            </div>

            <style>{`
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-auto-rows: 250px;
                    gap: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .bento-item {
                    background: #ffffff;
                    border-radius: 30px; /* Apple Radius */
                    padding: 30px;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }

                .bento-item:hover {
                    transform: scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08); /* Apple Hover Shadow */
                    z-index: 2;
                }

                /* Feature Card (Span 2x2) */
                .feature-card {
                    grid-column: span 2;
                    grid-row: span 2;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    color: white;
                }
                
                .bento-bg-gradient {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(135deg, #0071e3 0%, #00c6fb 100%);
                    z-index: 1;
                }
                
                .feature-card .bento-content {
                    position: relative;
                    z-index: 2;
                }

                .feature-card h3 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .feature-card p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }

                /* Standard Card (1x1) */
                .standard-card {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .standard-card h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #1d1d1f;
                }

                .standard-card p {
                    font-size: 0.95rem;
                    color: #86868b;
                }

                .bento-icon-large {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    display: block;
                }

                /* Wide Card (Span 2x1) */
                .wide-card {
                    grid-column: span 2;
                    display: flex;
                    align-items: center;
                }

                .wide-card h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1d1d1f;
                }

                .wide-card p {
                    color: #86868b;
                }

                /* Responsive */
                @media (max-width: 900px) {
                    .bento-grid {
                        grid-template-columns: 1fr;
                        grid-auto-rows: auto;
                    }
                    .feature-card, .wide-card {
                        grid-column: span 1;
                        grid-row: span 1;
                        min-height: 300px;
                    }
                }
            `}</style>
        </section>
    );
};

export default Amenities;
