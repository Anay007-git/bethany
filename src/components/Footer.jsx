import { useLocation, useNavigate } from 'react-router-dom';

const Footer = ({ onOpenPolicy }) => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const navigate = useNavigate();

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
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
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-logo">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                        <span>NAMASTE HILLS</span>
                    </div>

                    <ul className="footer-links">
                        <li><a href="/#about" onClick={(e) => scrollToSection(e, 'about')}>About</a></li>
                        <li><a href="/#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Feature</a></li>
                        <li><a href="/#gallery" onClick={(e) => scrollToSection(e, 'gallery')}>Gallery</a></li>
                        <li><a href="/#booking" onClick={(e) => scrollToSection(e, 'booking')}>Book Now</a></li>
                        <li><a href="/contact">Contact</a></li>
                    </ul>

                    <div className="footer-social">
                        <a href="https://www.facebook.com/people/Bethany-Homestay-Kalimpong/100076588549205/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {currentYear} Namaste Hills Bethany Homestay. All rights reserved.</p>
                    <div className="footer-legal">
                        <a href="/terms">Terms & Conditions</a>
                        <span>|</span>
                        <a href="/privacy">Privacy Policy</a>
                        <span>|</span>
                        <a href="/refund-policy">Cancellation & Refund Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
