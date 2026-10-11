const amenitiesList = [
    {
        icon: "🏔️",
        title: "180° Kanchenjunga Panoramas",
        desc: "Unobstructed vistas of the world's third-highest peak directly from your room balcony and private sun terrace.",
        highlight: "Natural Wonder"
    },
    {
        icon: "🥗",
        title: "Farm-to-Table Homestay Kitchen",
        desc: "Wholesome, home-cooked organic meals crafted by our hosts with fresh local produce. Customizable Veg & Non-Veg dining.",
        highlight: "Organic Living"
    },
    {
        icon: "📶",
        title: "High-Speed Hill Station Wi-Fi",
        desc: "Stable, fast internet connectivity across all rooms and gardens, making it an idyllic destination for workations and remote retreats.",
        highlight: "Workation Ready"
    },
    {
        icon: "🚿",
        title: "24/7 Hot Water & Western Baths",
        desc: "Modern en-suite bathrooms equipped with continuous geyser hot water, premium toiletries, and fresh hill water.",
        highlight: "All Weather"
    },
    {
        icon: "✨",
        title: "Daily Housekeeping & Fresh Linens",
        desc: "Meticulously maintained clean rooms, sanitized bedsheets, cozy blankets, and warm hill-station duvets.",
        highlight: "Hygiene Priority"
    },
    {
        icon: "🚗",
        title: "Secure On-Premises Parking",
        desc: "Safe and spacious private parking on the property grounds with easy access for personal vehicles and cabs.",
        highlight: "Hassle-Free"
    },
    {
        icon: "🌲",
        title: "Dr. Graham's Homes Forest Walks",
        desc: "Step directly into peaceful pine-shaded trails, quiet walking routes, and the scenic historic school campus.",
        highlight: "Nature Trails"
    },
    {
        icon: "☕",
        title: "Morning Himalayan Tea Lounge",
        desc: "Wake up to fresh Darjeeling & Kalimpong orthodox tea served against the backdrop of morning mountain sunrise.",
        highlight: "Heritage Ritual"
    }
];

const Amenities = () => {
    return (
        <section id="amenities" style={{ padding: '100px 0', backgroundColor: '#FFFFFF' }}>
            <div className="container">
                <div className="section-header">
                    <div className="section-tag">
                        <span>Comfort & Convenience</span>
                    </div>
                    <h2>Tailored for Hillside Comfort</h2>
                    <p>
                        Every detail is curated to combine the rustic tranquility of the Himalayas with the modern conveniences required for a rejuvenating stay.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
                    gap: '24px'
                }}>
                    {amenitiesList.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '32px 28px',
                                background: 'var(--himalaya-ivory)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                transition: 'all 0.25s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative'
                            }}
                            className="amenity-card"
                        >
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '18px'
                                }}>
                                    <span style={{ fontSize: '2.2rem' }}>{item.icon}</span>
                                    <span style={{
                                        fontSize: '0.74rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        color: 'var(--himalaya-terracotta)',
                                        background: 'rgba(184, 107, 66, 0.08)',
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-full)'
                                    }}>
                                        {item.highlight}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--himalaya-forest-dark)' }}>
                                    {item.title}
                                </h3>

                                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.65' }}>
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .amenity-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-card);
                    border-color: rgba(35, 72, 59, 0.2);
                    background-color: #FFFFFF;
                }
            `}</style>
        </section>
    );
};

export default Amenities;
