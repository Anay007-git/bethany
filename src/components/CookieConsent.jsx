import React, { useState, useEffect } from 'react';

const CookieConsent = ({ onOpenPolicy }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Show banner after a short delay for smooth entry
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        setIsVisible(false);
        localStorage.setItem('cookieConsent', 'accepted');
    };

    const handleDecline = () => {
        setIsVisible(false);
        localStorage.setItem('cookieConsent', 'declined');
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-banner">
            <div className="cookie-content">
                <p>
                    We use cookies to enhance your experience. <button className="cookie-link" onClick={() => onOpenPolicy('privacy')}>Learn more</button>
                    <br />
                    By continuing to visit this site you agree to our use of cookies.
                </p>
                <div className="cookie-actions">
                    <button onClick={handleDecline} className="cookie-btn cookie-decline">
                        Decline
                    </button>
                    <button onClick={handleAccept} className="cookie-btn cookie-accept">
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
