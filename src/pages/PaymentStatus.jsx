import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SupabaseService } from '../services/SupabaseService';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // loading, success, failed, pending
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!orderId) {
            setStatus('failed');
            setErrorMessage('No order ID provided in URL.');
            return;
        }

        let isPolling = true;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/payment/status?orderId=${orderId}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to verify payment status from server');
                }

                // PhonePe SDK getOrderStatus usually returns an object that has state directly or inside `data`
                // According to docs, `state` can be PENDING, FAILED, COMPLETED
                const state = data.state || (data.data && data.data.state);

                if (state === 'COMPLETED' || state === 'SUCCESS') {
                    isPolling = false;
                    // Provide dual-write safety: update Supabase directly from frontend as well
                    await SupabaseService.updateBookingStatus(orderId, 'confirmed');

                    // Fetch the full booking details to send the email
                    const bookingRes = await SupabaseService.getBookingById(orderId);
                    if (bookingRes.success && bookingRes.data) {
                        await SupabaseService.sendBookingConfirmation(bookingRes.data);
                    }

                    setStatus('success');
                } else if (state === 'FAILED') {
                    isPolling = false;
                    // Update Supabase to cancelled due to failure
                    await SupabaseService.updateBookingStatus(orderId, 'cancelled');

                    // Fetch the full booking details to send the declined email
                    const bookingRes = await SupabaseService.getBookingById(orderId);
                    if (bookingRes.success && bookingRes.data) {
                        await SupabaseService.sendPaymentFailedEmail(bookingRes.data);
                    }

                    setStatus('failed');
                    setErrorMessage('Your payment was declined or failed.');
                } else {
                    // PENDING / IN-PROGRESS
                    setStatus('pending');
                    // Continue polling every 3 seconds if still pending
                    if (isPolling) {
                        setTimeout(checkStatus, 3000);
                    }
                }
            } catch (err) {
                console.error("Payment status check error:", err);
                isPolling = false;
                setStatus('failed');
                setErrorMessage(err.message);
            }
        };

        checkStatus();

        return () => {
            isPolling = false; // Cleanup on unmount
        };
    }, [orderId]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
            case 'pending':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px', width: '50px', height: '50px', border: '4px solid var(--himalaya-beige)', borderTop: '4px solid var(--himalaya-forest)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <h2 style={{ color: 'var(--himalaya-forest-dark)', fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Verifying Transaction...</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Confirming reservation with PhonePe secure gateway. Please do not refresh.</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                );
            case 'success':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3.6rem', marginBottom: '16px' }}>🏔️</div>
                        <h2 style={{ color: 'var(--himalaya-forest-dark)', fontFamily: 'var(--font-serif)', fontSize: '2.4rem', marginBottom: '12px' }}>
                            Reservation Confirmed!
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                            Your advance payment was successfully processed. A detailed confirmation voucher has been sent to your email.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => navigate(`/bill/${orderId}`)}
                                className="btn-primary"
                                style={{ width: '100%', padding: '14px' }}
                            >
                                🧾 View Official Bill & Voucher
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="btn-secondary"
                                style={{ width: '100%', padding: '13px' }}
                            >
                                Return to Bethany Homestay
                            </button>
                        </div>
                    </div>
                );
            case 'failed':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3.6rem', marginBottom: '16px', color: '#B86B42' }}>⚠️</div>
                        <h2 style={{ color: 'var(--himalaya-forest-dark)', fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '12px' }}>
                            Payment Incomplete
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.6' }}>
                            {errorMessage || 'The transaction could not be verified or was cancelled.'}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-primary"
                            style={{ width: '100%', padding: '14px' }}
                        >
                            Return & Retry Reservation
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--himalaya-ivory)', padding: '24px' }}>
            <div style={{ background: '#FFFFFF', padding: '48px 36px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', maxWidth: '480px', width: '100%', border: '1px solid var(--border-subtle)' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default PaymentStatus;
