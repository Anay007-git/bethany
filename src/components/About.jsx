import { useRef } from 'react';

const About = () => {
    const containerRef = useRef(null);

    return (
        <section id="about" ref={containerRef} style={{ background: '#FFFFFF', padding: '110px 0' }}>
            <div className="container">
                <div className="about-grid">
                    {/* Left: Narrative & Heritage */}
                    <div>
                        <div className="section-tag">
                            <span>Heritage & Sanctuary</span>
                        </div>

                        <h2 style={{ marginBottom: '24px' }}>
                            Peace of mind above the mist. Authentic Himalayan living.
                        </h2>

                        <p style={{ marginBottom: '20px' }}>
                            Nestled in the tranquil pine ridges of Kalimpong at an elevation of <strong>1,250 meters</strong>, Bethany Homestay offers an intimate escape from the crowded tourist routes. Situated within the historic grounds of Dr. Graham's Homes, our sanctuary is designed for travelers who seek genuine warmth, peaceful solitude, and the grandeur of nature.
                        </p>

                        <p style={{ marginBottom: '32px' }}>
                            Hosted by Mr. Wangchuck and his family, every guest is welcomed as an honored member of our home. From freshly prepared local mountain cuisine to morning tea with unobstructed vistas of Mt. Kanchenjunga, our philosophy is rooted in traditional hospitality.
                        </p>

                        {/* Property Highlights Grid */}
                        <div className="about-highlights">
                            <div style={{
                                padding: '18px',
                                background: 'var(--himalaya-ivory)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)'
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>🏔️</span>
                                <h4 style={{ fontSize: '1.05rem', margin: '6px 0 2px' }}>180° Mountain Views</h4>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Direct line of sight to the snow peaks.</p>
                            </div>

                            <div style={{
                                padding: '18px',
                                background: 'var(--himalaya-ivory)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)'
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>🥗</span>
                                <h4 style={{ fontSize: '1.05rem', margin: '6px 0 2px' }}>Wholesome Dining</h4>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Custom home-cooked meals every day.</p>
                            </div>

                            <div style={{
                                padding: '18px',
                                background: 'var(--himalaya-ivory)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)'
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>🌲</span>
                                <h4 style={{ fontSize: '1.05rem', margin: '6px 0 2px' }}>Pine Trails</h4>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Serene hill walks right from our doorstep.</p>
                            </div>

                            <div style={{
                                padding: '18px',
                                background: 'var(--himalaya-ivory)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)'
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>📶</span>
                                <h4 style={{ fontSize: '1.05rem', margin: '6px 0 2px' }}>High-Speed Wi-Fi</h4>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Reliable connection for workations.</p>
                            </div>
                        </div>

                        <div>
                            <a
                                href="#rooms"
                                className="btn-primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Explore Our 4 Private Suites →
                            </a>
                        </div>
                    </div>

                    {/* Right: Authentic Photograph Card */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-elevated)',
                            position: 'relative',
                            height: '560px'
                        }}>
                            <img
                                src="/about.jpg"
                                alt="Bethany Homestay Exterior & Scenic Surroundings"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, transparent 60%, rgba(22, 46, 37, 0.7) 100%)'
                            }}></div>
                        </div>

                        {/* Floating Elevation Badge */}
                        <div style={{
                            position: 'absolute',
                            bottom: '24px',
                            left: '24px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            padding: '16px 24px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-card)',
                            border: '1px solid rgba(255, 255, 255, 0.7)'
                        }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--himalaya-terracotta)' }}>
                                Himalayan Altitude
                            </div>
                            <div style={{ fontSize: '1.7rem', fontWeight: '700', color: 'var(--himalaya-forest-dark)', fontFamily: 'var(--font-serif)' }}>
                                1,250 Meters
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--himalaya-grey)' }}>
                                Dr. Graham's Homes, Kalimpong
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
};

export default About;
