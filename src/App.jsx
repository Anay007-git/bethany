import { useState } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Amenities from './components/Amenities';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import BookingForm from './components/BookingForm';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';

import PolicyModal from './components/PolicyModal';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [toast, setToast] = useState(null);
  const [policyType, setPolicyType] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

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
        <Hero />
        <About />
        <Gallery />
        <BookingForm onToast={showToast} />
        <Reviews />
        <Amenities />
        <Contact />
      </main>
      <Footer onOpenPolicy={openPolicy} onOpenAdmin={() => setShowAdmin(true)} />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <CookieConsent onOpenPolicy={openPolicy} />
      <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />

      {/* Admin Dashboard Modal */}
      {showAdmin && (
        <div className="modal-overlay" onClick={() => setShowAdmin(false)}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-modal" onClick={() => setShowAdmin(false)}>&times;</button>
            <AdminDashboard />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
