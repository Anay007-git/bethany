import { useState } from 'react';
import Navbar from '../components/Navbar';
import AppleHero from '../components/AppleHero';
import About from '../components/About';
import RoomShowcase from '../components/RoomShowcase';
import Amenities from '../components/Amenities';
import Gallery from '../components/Gallery';
import Reviews from '../components/Reviews';
import BookingForm from '../components/BookingForm';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import CookieConsent from '../components/CookieConsent';
import PolicyModal from '../components/PolicyModal';

function Home() {
    const [toast, setToast] = useState(null);
    const [policyType, setPolicyType] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const openPolicy = (type) => {
        setPolicyType(type);
    };

    return (
        <>
            <Navbar />
            <main>
                <AppleHero />
                <About />
                <RoomShowcase />
                <Amenities />
                <Gallery />
                <BookingForm onToast={showToast} />
                <Reviews />
                <Contact />
            </main>
            <Footer onOpenPolicy={openPolicy} />

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <CookieConsent onOpenPolicy={openPolicy} />
            <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />
        </>
    );
}

export default Home;
