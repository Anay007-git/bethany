import React from 'react';

const PolicyModal = ({ type, onClose }) => {
    if (!type) return null;

    const content = {
        terms: (
            <>
                <h3>Terms & Conditions</h3>
                <p>Welcome to Bethany Homestay. By accessing our website, making a booking, or completing a payment through PhonePe / UPI, you agree to the following Terms & Conditions.</p>

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

                <h4>4. Cancellation & Refund Policy</h4>
                <ul>
                    <li>Cancellation and refund terms will be communicated at the time of booking.</li>
                    <li>Eligible refunds will be processed to the original UPI ID or PhonePe account used for payment.</li>
                    <li>Refund timelines are governed by PhonePe, UPI service providers, and banks, and may take 5–10 business days.</li>
                    <li>No refunds will be provided for no-shows or early check-outs unless explicitly agreed upon in writing.</li>
                </ul>

                <h4>5. Guest Responsibilities</h4>
                <ul>
                    <li>Guests must maintain proper conduct and respect the property, staff, and other guests.</li>
                    <li>Any damage to property, loss of items, or violation of rules will be chargeable.</li>
                    <li>Illegal activities, disturbances, or misuse of property may result in immediate termination of stay without refund.</li>
                </ul>

                <h4>6. Liability Disclaimer</h4>
                <ul>
                    <li>Bethany Homestay shall not be held responsible for loss, theft, or damage of personal belongings.</li>
                    <li>Guests are responsible for their own safety during their stay.</li>
                </ul>

                <h4>7. Website Usage</h4>
                <ul>
                    <li>Website content is provided for general information purposes only.</li>
                    <li>Unauthorized copying, modification, or misuse of website content is prohibited.</li>
                </ul>

                <h4>8. Changes to Terms</h4>
                <ul>
                    <li>Bethany Homestay reserves the right to modify these Terms & Conditions at any time.</li>
                    <li>Continued use of the website or services implies acceptance of updated terms.</li>
                </ul>
            </>
        ),
        privacy: (
            <>
                <h3>Privacy Policy</h3>
                <p>Bethany Homestay respects your privacy and is committed to protecting your personal information.</p>

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
                    <li><strong>Email:</strong> biswasanay07@gmail.com</li>
                    <li><strong>Phone:</strong> +91 94478 24335</li>
                    <li><strong>Address:</strong> Bethany Homestay, Munnar, Kerala, India</li>
                </ul>
            </>
        )
    };

    return (
        <div className="policy-modal-overlay" onClick={onClose}>
            <div className="policy-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="policy-close-btn" onClick={onClose}>&times;</button>
                <div className="policy-body">
                    {content[type]}
                </div>
            </div>
        </div>
    );
};

export default PolicyModal;
