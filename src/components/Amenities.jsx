const amenities = [
    {
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
        ),
        title: 'Mountain Views',
        description: 'Wake up to breathtaking panoramic views of the Himalayan mountains every morning.'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
        ),
        title: 'Free WiFi',
        description: 'Stay connected with complimentary high-speed internet throughout your stay.'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z" />
            </svg>
        ),
        title: 'Private Rooms',
        description: 'Comfortable, clean, and well-furnished private rooms for a peaceful rest.'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
            </svg>
        ),
        title: 'Local Experiences',
        description: 'Discover local culture with guided tours to monasteries, markets, and nature trails.'
    },

];

const Amenities = () => {
    return (
        <section id="amenities" className="amenities">
            <div className="container">
                <div className="section-header">
                    <h2>What This Place Offers</h2>
                    <p>Everything you need for a comfortable and memorable mountain retreat</p>
                </div>
                <div className="amenities-grid">
                    {amenities.map((amenity, index) => (
                        <div key={index} className="amenity-card">
                            <div className="amenity-icon">
                                {amenity.icon}
                            </div>
                            <h3>{amenity.title}</h3>
                            <p>{amenity.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Amenities;
