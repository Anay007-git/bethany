import { useState, useEffect } from 'react';
import logoImg from '../assets/title-bar.jpeg';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="#" className="navbar-logo">
            <img src={logoImg} alt="Bethany Homestay Logo" className="navbar-logo-img" />
            <span>BETHANY HOMESTAY</span>
          </a>

          <ul className="navbar-links">
            <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a></li>
            <li><a href="#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Feature</a></li>
            <li><a href="#gallery" onClick={(e) => scrollToSection(e, 'gallery')}>Gallery</a></li>
            <li><a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a></li>
          </ul>

          <a href="#booking" className="navbar-cta" onClick={(e) => scrollToSection(e, 'booking')}>
            Book Now
          </a>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <ul>
          <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a></li>
          <li><a href="#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Feature</a></li>
          <li><a href="#gallery" onClick={(e) => scrollToSection(e, 'gallery')}>Gallery</a></li>
          <li><a href="#booking" onClick={(e) => scrollToSection(e, 'booking')}>Book Now</a></li>
          <li><a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a></li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
