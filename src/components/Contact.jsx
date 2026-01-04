const Contact = () => {
    return (
        <section id="contact" className="contact">
            <div className="container">
                <div className="section-header">
                    <h2>Get in Touch</h2>
                    <p>We would love to hear from you and help plan your perfect stay</p>
                </div>
                <div className="contact-grid">
                    <div className="contact-info">
                        <h3>Contact Information</h3>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Phone</h4>
                                <p><a href="tel:+918348993048">+91 83489 93048</a></p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Email</h4>
                                <p><a href="mailto:wangchuck20199@gmail.com">wangchuck20199@gmail.com</a></p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Address</h4>
                                <p>
                                    Graham's Home Block B<br />
                                    Dr. Graham's Homes, Kalimpong-I<br />
                                    Kalimpong, West Bengal, India<br />
                                    <strong>Landmark:</strong> Near Science Centre
                                </p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                </svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Police Station</h4>
                                <p>Kalimpong Police Station</p>
                            </div>
                        </div>
                    </div>

                    <div className="contact-map">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3551.738396784!2d88.4697!3d27.0620!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e42f5e0e9c7a6b%3A0x8b3a5c4f9a0e2c7d!2sDr.%20Graham's%20Homes%2C%20Kalimpong!5e0!3m2!1sen!2sin!4v1704384000000!5m2!1sen!2sin"
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Bethany Homestay Location"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
