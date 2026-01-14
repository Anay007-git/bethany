const About = () => {
    // Local about image from user
    const heroImageUrl = '/about.jpg';

    return (
        <section id="about" className="about">
            <div className="container">
                <div className="about-grid">
                    <div className="about-image">
                        <img
                            src={heroImageUrl}
                            alt="Bethany Homestay - Beautiful mountain view property"
                        />
                        <div className="about-image-badge">
                            🏔️ Experience Himalayan Bliss
                        </div>
                    </div>
                    <div className="about-content">
                        <h2>Welcome to Your Home Away From Home</h2>
                        <p>
                            Nestled in the serene hills of Kalimpong, Bethany Homestay offers an
                            authentic Himalayan experience that combines traditional warmth with
                            modern comfort. Wake up to stunning mountain views, breathe in the fresh
                            mountain air, and experience the genuine hospitality that our region is
                            known for.
                        </p>
                        <p>
                            Our homestay is located near the famous Science Centre in Graham's Home
                            Block B, offering easy access to local attractions while providing a
                            peaceful retreat from the bustle of everyday life. Whether you're here
                            for adventure, relaxation, or cultural exploration, we ensure your stay
                            is memorable.
                        </p>

                        <div className="host-info">
                            <div className="host-avatar">NH</div>
                            <div className="host-details">
                                <h4>Namaste Hills</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
