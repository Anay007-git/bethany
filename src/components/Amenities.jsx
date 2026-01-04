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
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
            </svg>
        ),
        title: 'Home-Cooked Meals',
        description: 'Enjoy authentic local cuisine prepared with fresh ingredients and traditional recipes.'
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
    {
        icon: (
            <svg viewBox="0 0 24 24">
                <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
            </svg>
        ),
        title: '24/7 Support',
        description: 'Your hosts are always available to assist you with any needs during your stay.'
    }
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
