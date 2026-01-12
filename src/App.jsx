import { useState } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Amenities from './components/Amenities';
import Gallery from './components/Gallery';
import BookingForm from './components/BookingForm';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Gallery />
        <BookingForm onToast={showToast} />
        <Amenities />
        <Contact />
      </main>
      <Footer />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}

export default App;
