import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RefundPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: '100px', marginBottom: '60px' }}>
                <h1 style={{ marginBottom: '30px' }}>Cancellation & Refund Policy</h1>

                <div style={{ marginTop: '20px' }}>
                    <h4>1. Cancellation Policy</h4>
                    <ul>
                        <li>Cancellation terms will be communicated at the time of booking.</li>
                        <li>Please contact us as soon as possible if you need to cancel or modify your reservation.</li>
                        <li>No refunds will be provided for no-shows or early check-outs unless explicitly agreed upon in writing.</li>
                    </ul>

                    <h4>2. Refund Process & Timeline</h4>
                    <ul>
                        <li>Eligible refunds will be processed to the original UPI ID or PhonePe account used for payment.</li>
                        <li><strong>Refund timeline is not more than 5 days.</strong> We strive to process refunds as quickly as possible.</li>
                        <li>Once initiated by us, the credit to your account is subject to your bank's processing times.</li>
                    </ul>

                    <h4>3. Contact for Refunds</h4>
                    <p>If you have any questions regarding your refund status, please contact us:</p>
                    <ul>
                        <li><strong>Phone:</strong> +91 83489 93048</li>
                        <li><strong>Email:</strong> namastehills.kol@gmail.com</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default RefundPolicy;
