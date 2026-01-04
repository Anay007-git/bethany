const galleryImages = [
    {
        src: '/gallery1.jpg',
        alt: 'Bethany Homestay property view'
    },
    {
        src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
        alt: 'Cozy homestay room interior'
    },
    {
        src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
        alt: 'Traditional mountain home exterior'
    },
    {
        src: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600',
        alt: 'Beautiful garden terrace'
    },
    {
        src: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600',
        alt: 'Stunning sunset over mountains'
    }
];

const Gallery = () => {
    return (
        <section id="gallery" className="gallery">
            <div className="container">
                <div className="section-header">
                    <h2>Explore the Property</h2>
                    <p>Take a glimpse of what awaits you at Bethany Homestay</p>
                </div>
                <div className="gallery-grid">
                    {galleryImages.map((image, index) => (
                        <div key={index} className="gallery-item">
                            <img src={image.src} alt={image.alt} loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Gallery;
