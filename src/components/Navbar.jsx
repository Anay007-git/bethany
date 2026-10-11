import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import logoImg from '../assets/title-bar.jpeg';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === '/' && location.state && location.state.scrollTo) {
      const sectionId = location.state.scrollTo;
      const element = document.getElementById(sectionId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="/" className="navbar-logo" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <img src={logoImg} alt="Bethany Homestay Crest" className="navbar-logo-img" />
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">Bethany Homestay</span>
              <span className="navbar-brand-subtitle">Kalimpong · 1,250 m</span>
            </div>
          </a>

          <nav className="navbar-links" aria-label="Main Navigation">
            <a href="/#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
            <a href="/#rooms" onClick={(e) => scrollToSection(e, 'rooms')}>Suites</a>
            <a href="/#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Experience</a>
            <a href="/#gallery" onClick={(e) => scrollToSection(e, 'gallery')}>Gallery</a>
            <a href="/#reviews" onClick={(e) => scrollToSection(e, 'reviews')}>Reviews</a>
            <a href="/#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
          </nav>

          <div className="navbar-actions">
            <Link to="/my-bill" className="navbar-bill-btn" title="View Booking & Bill">
              <span>🧾</span>
              <span>My Bill</span>
            </Link>

            <a
              href="/#booking"
              className="navbar-cta"
              onClick={(e) => scrollToSection(e, 'booking')}
            >
              Reserve Stay
            </a>

            <button
              className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`} aria-hidden={!mobileMenuOpen}>
        <ul className="mobile-nav-links">
          <li><a href="/#about" onClick={(e) => scrollToSection(e, 'about')}>About Property</a></li>
          <li><a href="/#rooms" onClick={(e) => scrollToSection(e, 'rooms')}>Rooms & Suites</a></li>
          <li><a href="/#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Amenities</a></li>
          <li><a href="/#gallery" onClick={(e) => scrollToSection(e, 'gallery')}>Photo Gallery</a></li>
          <li><a href="/#reviews" onClick={(e) => scrollToSection(e, 'reviews')}>Guest Reviews</a></li>
          <li><a href="/#contact" onClick={(e) => scrollToSection(e, 'contact')}>Location & Contact</a></li>
        </ul>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: 'auto' }}>
          <Link
            to="/my-bill"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-secondary"
            style={{ width: '100%' }}
          >
            🧾 Lookup My Bill
          </Link>
          <a
            href="/#booking"
            onClick={(e) => scrollToSection(e, 'booking')}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            Check Availability & Book
          </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
