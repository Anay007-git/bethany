const Hero = () => {
    // Local hero image - beautiful Kalimpong landscape
    const heroImageUrl = '/hero.jpg';

    const scrollToBooking = (e) => {
        e.preventDefault();
        const element = document.getElementById('booking');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToAbout = (e) => {
        e.preventDefault();
        const element = document.getElementById('about');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="hero">
            <div
                className="hero-background"
                style={{ backgroundImage: `url(${heroImageUrl})` }}
            />

            {/* Floating Clouds */}
            <div className="clouds-container">
                <div className="cloud cloud-1"></div>
                <div className="cloud cloud-2"></div>
                <div className="cloud cloud-3"></div>
            </div>

            <div className="hero-content">
                <span className="hero-badge animate-fade-in">✨ Authentic Himalayan Experience</span>
                <h1 className="animate-text">
                    BETHANY HOMESTAY
                    <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '700', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: '0.9' }}>
                        🤝 Official Hospitality Partner: Namaste Hills
                    </span>
                </h1>
                <p className="hero-subtitle animate-text delay-1">
                    Experience the warmth of traditional hospitality in the heart of Kalimpong,
                    surrounded by breathtaking mountain views.
                </p>
                <div className="hero-location animate-text delay-2">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>Kalimpong, West Bengal, India</span>
                </div>
                <div className="hero-buttons animate-text delay-3">
                    <a href="#booking" className="btn-primary" onClick={scrollToBooking}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                        </svg>
                        Book Your Stay
                    </a>
                    <a href="#about" className="btn-secondary" onClick={scrollToAbout}>
                        Explore More
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Hero;
