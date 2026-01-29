import { useEffect, useRef } from 'react';

const amenities = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M8 13h2" />
                <path d="M8 17h2" />
                <path d="M14 13h2" />
                <path d="M14 17h2" />
            </svg>
        ),
        title: 'Mountain Views',
        description: 'Wake up to breathtaking panoramic views of the Himalayan mountains every morning.'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 19.38 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <path d="M12 20h.01" />
            </svg>
        ),
        title: 'Free WiFi',
        description: 'Stay connected with complimentary high-speed internet throughout your stay.'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
                <path d="M3 7l9-5 9 5" />
                <path d="M12 14h.01" />
            </svg>
        ),
        title: 'Private Rooms',
        description: 'Comfortable, clean, and well-furnished private rooms for a peaceful rest.'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
            </svg>
        ),
        title: 'Local Experiences',
        description: 'Discover local culture with guided tours to monasteries, markets, and nature trails.'
    },
];

const Amenities = () => {
    return (
        <section id="amenities" className="amenities-section" style={{ background: '#f0f0f3', padding: '100px 20px' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', color: '#1a1a1a', fontWeight: '800', marginBottom: '15px', letterSpacing: '-0.5px' }}>What This Place Offers</h2>
                    <p style={{ fontSize: '1.1rem', color: '#666' }}>Everything you need for a comfortable and memorable mountain retreat</p>
                </div>

                <div className="neumorphic-grid">
                    {amenities.map((amenity, index) => (
                        <div key={index} className="neumorphic-card">
                            <div className="medal-icon">
                                {amenity.icon}
                            </div>
                            <h3>{amenity.title}</h3>
                            <p>{amenity.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .neumorphic-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px;
                }

                .neumorphic-card {
                    background: #f0f0f3;
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 
                        10px 10px 20px #aeaec0,
                        -10px -10px 20px #ffffff;
                    transition: transform 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    height: 100%;
                }

                .neumorphic-card:hover {
                    transform: translateY(-5px);
                }

                .medal-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: #f0f0f3;
                    box-shadow: 
                        5px 5px 10px #aeaec0,
                        -5px -5px 10px #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 25px;
                    border: 2px solid rgba(255,255,255,0.2);
                }

                .medal-icon svg {
                    width: 24px;
                    height: 24px;
                    color: #555;
                    stroke-width: 2px;
                }

                .neumorphic-card h3 {
                    font-size: 1.25rem;
                    color: #1a1a1a;
                    margin-bottom: 12px;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }

                .neumorphic-card p {
                    font-size: 0.95rem;
                    color: #666;
                    line-height: 1.6;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .neumorphic-grid {
                        grid-template-columns: 1fr;
                        gap: 40px;
                    }
                }
            `}</style>
        </section>
    );
};

export default Amenities;
