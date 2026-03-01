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
                        <div className="spinner" style={{ margin: '0 auto 20px', width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #0071e3', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <h2 style={{ color: '#1d1d1f' }}>Verifying Payment...</h2>
                        <p style={{ color: '#86868b' }}>Please wait while we confirm your transaction. Do not refresh this page.</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                );
            case 'success':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#34c759' }}>✅</div>
                        <h2 style={{ color: '#1d1d1f', marginBottom: '15px' }}>Payment Successful!</h2>
                        <p style={{ color: '#86868b', marginBottom: '30px' }}>Your booking has been confirmed. A confirmation email has been sent to you.</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{ padding: '12px 24px', background: '#0071e3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Return to Home
                        </button>
                    </div>
                );
            case 'failed':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#ff3b30' }}>❌</div>
                        <h2 style={{ color: '#1d1d1f', marginBottom: '15px' }}>Payment Failed</h2>
                        <p style={{ color: '#86868b', marginBottom: '30px' }}>{errorMessage}</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{ padding: '12px 24px', background: '#e5e5ea', color: '#1d1d1f', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Try Again
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', padding: '20px' }}>
            <div style={{ background: '#ffffff', padding: '50px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxWidth: '500px', width: '100%' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default PaymentStatus;
