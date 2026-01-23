import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Contact from '../components/Contact';

const ContactPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <div style={{ marginTop: '80px' }}>
                <Contact />
            </div>
            <Footer />
        </>
    );
};

export default ContactPage;
