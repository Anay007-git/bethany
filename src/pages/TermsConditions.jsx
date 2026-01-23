import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsConditions = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: '100px', marginBottom: '60px' }}>
                <h1 style={{ marginBottom: '30px' }}>Terms & Conditions</h1>
                <p>Welcome to Bethany Homestay. By accessing our website, making a booking, or completing a payment through PhonePe / UPI, you agree to the following Terms & Conditions.</p>

                <div style={{ marginTop: '20px' }}>
                    <h4>1. Booking & Confirmation</h4>
                    <ul>
                        <li>All bookings are subject to availability.</li>
                        <li>A booking is considered confirmed only after successful payment via PhonePe, UPI, or other supported digital payment methods.</li>
                        <li>Guests must present valid government-issued photo ID at the time of check-in.</li>
                    </ul>

                    <h4>2. Check-In & Check-Out</h4>
                    <ul>
                        <li>Check-in and check-out timings will be shared during booking confirmation.</li>
                        <li>Early check-in or late check-out is subject to availability and may attract additional charges.</li>
                    </ul>

                    <h4>3. Online Payments (PhonePe / UPI)</h4>
                    <ul>
                        <li>Online payments are processed securely through PhonePe and UPI platforms.</li>
                        <li>Bethany Homestay does not collect, store, or process sensitive payment information such as UPI PINs, bank details, or card numbers.</li>
                        <li>Payment authorization and processing are handled directly by PhonePe and the customer’s bank.</li>
                        <li>In case of payment failure, interruption, or delay, the booking will remain unconfirmed until successful payment is received.</li>
                    </ul>

                    <h4>4. Guest Responsibilities</h4>
                    <ul>
                        <li>Guests must maintain proper conduct and respect the property, staff, and other guests.</li>
                        <li>Any damage to property, loss of items, or violation of rules will be chargeable.</li>
                        <li>Illegal activities, disturbances, or misuse of property may result in immediate termination of stay without refund.</li>
                    </ul>

                    <h4>5. Liability Disclaimer</h4>
                    <ul>
                        <li>Bethany Homestay shall not be held responsible for loss, theft, or damage of personal belongings.</li>
                        <li>Guests are responsible for their own safety during their stay.</li>
                    </ul>

                    <h4>6. Website Usage</h4>
                    <ul>
                        <li>Website content is provided for general information purposes only.</li>
                        <li>Unauthorized copying, modification, or misuse of website content is prohibited.</li>
                    </ul>

                    <h4>7. Changes to Terms</h4>
                    <ul>
                        <li>Bethany Homestay reserves the right to modify these Terms & Conditions at any time.</li>
                        <li>Continued use of the website or services implies acceptance of updated terms.</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default TermsConditions;
