import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: '100px', marginBottom: '60px' }}>
                <h1 style={{ marginBottom: '30px' }}>Privacy Policy</h1>
                <p>Bethany Homestay respects your privacy and is committed to protecting your personal information.</p>

                <div style={{ marginTop: '20px' }}>
                    <h4>1. Information We Collect</h4>
                    <p>We may collect:</p>
                    <ul>
                        <li>Name</li>
                        <li>Phone number and email address</li>
                        <li>Booking and stay details</li>
                        <li>Payment reference numbers / transaction IDs</li>
                        <li>ID proof details required under applicable laws</li>
                    </ul>
                    <p><strong>Important:</strong> We do not collect or store UPI PINs, bank account details, or card information.</p>

                    <h4>2. Payment Data</h4>
                    <ul>
                        <li>Payments are securely processed via PhonePe and UPI services.</li>
                        <li>All payment-related data is encrypted and handled by the payment service provider.</li>
                        <li>Bethany Homestay receives only payment status and transaction reference information.</li>
                    </ul>

                    <h4>3. Use of Information</h4>
                    <p>Collected information is used to:</p>
                    <ul>
                        <li>Confirm and manage bookings</li>
                        <li>Process payments, cancellations, and refunds</li>
                        <li>Communicate booking and stay details</li>
                        <li>Comply with legal and regulatory obligations</li>
                        <li>Improve guest experience and services</li>
                    </ul>

                    <h4>4. Data Security</h4>
                    <ul>
                        <li>Reasonable security measures are implemented to protect your personal data.</li>
                        <li>Access to guest information is restricted to authorized personnel only.</li>
                    </ul>

                    <h4>5. Information Sharing</h4>
                    <ul>
                        <li>We do not sell, rent, or trade personal data.</li>
                        <li>Information may be shared with payment providers or authorities only when legally required.</li>
                    </ul>

                    <h4>6. Cookies</h4>
                    <ul>
                        <li>Our website may use basic cookies to enhance functionality.</li>
                        <li>You may disable cookies through your browser settings.</li>
                    </ul>

                    <h4>7. Third-Party Services</h4>
                    <ul>
                        <li>Our website may contain links to third-party platforms, including payment services.</li>
                        <li>Bethany Homestay is not responsible for the privacy practices of third-party websites.</li>
                    </ul>

                    <h4>8. Consent</h4>
                    <ul>
                        <li>By using our website and completing a payment, you consent to this Privacy Policy.</li>
                    </ul>

                    <h4>9. Contact Us</h4>
                    <ul>
                        <li>For questions related to bookings, payments, refunds, or privacy, please contact us:</li>
                        <li><strong>Phone:</strong> +91 83489 93048</li>
                        <li><strong>Chat (WhatsApp):</strong> +91 89109 11758</li>
                        <li><strong>Email:</strong> namastehills.kol@gmail.com</li>
                        <li><strong>Address:</strong> Graham's Home Block B, Dr. Graham's Homes, Kalimpong-I, Kalimpong, West Bengal, India.<br />(Landmark: Near Science Centre)</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PrivacyPolicy;
