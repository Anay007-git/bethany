import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
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

    if (!isVisible) return null;

    return (
        <div className="cookie-banner">
            <div className="cookie-content">
                <p>
                    We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
                </p>
                <button onClick={handleAccept} className="cookie-btn">
                    Got it
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
