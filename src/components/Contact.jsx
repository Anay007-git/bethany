import { useState } from 'react';

const faqItems = [
    {
        q: "What are the standard Check-in and Check-out timings?",
        a: "Check-in begins at 12:00 PM (noon), and check-out is by 11:00 AM. Early check-in or late checkout can be accommodated subject to room availability upon prior request."
    },
    {
        q: "How does meal preparation work at Bethany Homestay?",
        a: "All meals are freshly prepared on-site using organic hill produce. We offer customized Veg and Non-Veg breakfasts (₹120/plate), lunches (₹200/plate), and dinners (₹200/plate). You can pre-book meals during reservation or coordinate directly with hosts."
    },
    {
        q: "Which rooms have unobstructed views of Mt. Kanchenjunga?",
        a: "Carmel Suite offers the premier direct view of Mt. Kanchenjunga. Sion Room and Zion also offer expansive panoramic views across the Kalimpong town ridge and Himalayan sunrise."
    },
    {
        q: "What is the cancellation and refund policy?",
        a: "Free cancellation is provided for bookings cancelled at least 7 days before check-in. Cancellations within 3–7 days receive a 50% refund, while cancellations within 48 hours are non-refundable due to limited suite availability."
    },
    {
        q: "Is secure vehicle parking available on the property?",
        a: "Yes, we provide safe on-site private parking for guest cars, SUVs, and bikes inside the property compound free of charge."
    }
];

const Contact = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    return (
        <section id="contact" className="contact" style={{ padding: '100px 0', backgroundColor: 'var(--himalaya-ivory)' }}>
            <div className="container">
                <div className="section-header">
                    <div className="section-tag">
                        <span>Get in Touch</span>
                    </div>
                    <h2>Directions, FAQs & Host Contact</h2>
                    <p>
                        We are here to assist with travel logistics, cab arrangements from NJP or Bagdogra, and tailoring your Himalayan itinerary.
                    </p>
                </div>

                {/* Contact & Map Grid */}
                <div className="contact-grid" style={{ marginBottom: '80px' }}>
                    <div className="contact-info">
                        <h3>Host & Location Details</h3>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Phone & WhatsApp</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <a href="tel:+918348993048" style={{ fontWeight: '600' }}>+91 83489 93048</a>
                                        <a
                                            href="https://wa.me/918348993048?text=Hello%20Bethany%20Homestay,%20I%20would%20like%20to%20inquire%20about%20a%20stay."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.82rem',
                                                color: '#25D366',
                                                fontWeight: '700',
                                                background: 'rgba(37, 211, 102, 0.1)',
                                                padding: '3px 10px',
                                                borderRadius: 'var(--radius-full)'
                                            }}
                                        >
                                            WhatsApp Chat ↗
                                        </a>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <a href="tel:+918910911758" style={{ fontWeight: '600' }}>+91 89109 11758</a>
                                        <a
                                            href="https://wa.me/918910911758?text=Hello%20Bethany%20Homestay,%20I%20would%20like%20to%20inquire%20about%20a%20stay."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '0.82rem',
                                                color: '#25D366',
                                                fontWeight: '700',
                                                background: 'rgba(37, 211, 102, 0.1)',
                                                padding: '3px 10px',
                                                borderRadius: 'var(--radius-full)'
                                            }}
                                        >
                                            WhatsApp Chat ↗
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Email Concierge</h4>
                                <p><a href="mailto:namastehills.kol@gmail.com" style={{ fontWeight: '600' }}>namastehills.kol@gmail.com</a></p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Homestay Address</h4>
                                <p>
                                    Graham's Home Block B, Dr. Graham's Homes, Kalimpong-I<br />
                                    Kalimpong, West Bengal 734301, India<br />
                                    <strong>Landmark:</strong> Near Science Centre
                                </p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-item-icon">
                                <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
                            </div>
                            <div className="contact-item-content">
                                <h4>Local Authorities</h4>
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
                            title="Bethany Homestay Location Map"
                        />
                    </div>
                </div>

                {/* Frequently Asked Questions Accordion */}
                <div style={{ maxWidth: '820px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '8px' }}>Frequently Asked Questions</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Helpful details to ensure a seamless Himalayan retreat.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {faqItems.map((faq, idx) => (
                            <div
                                key={idx}
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-subtle)',
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-subtle)'
                                }}
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                    style={{
                                        width: '100%',
                                        padding: '18px 24px',
                                        background: 'none',
                                        border: 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1.02rem',
                                        color: 'var(--himalaya-forest-dark)'
                                    }}
                                    aria-expanded={openFaqIndex === idx}
                                >
                                    <span>{faq.q}</span>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--himalaya-terracotta)' }}>
                                        {openFaqIndex === idx ? '−' : '+'}
                                    </span>
                                </button>

                                {openFaqIndex === idx && (
                                    <div style={{
                                        padding: '0 24px 20px 24px',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.65'
                                    }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
