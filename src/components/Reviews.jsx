import React from 'react';

const reviewsData = [
    {
        name: "Subhabrata Bhowmick",
        date: "December 2019",
        rating: 5,
        text: "We found this place via booking (dot) com... It has become one of my favorite destinations for relaxing. The place is much better than it appeared in the portal. Pros: 1. Awesome Location - staying in the lap of the valley. 2. Great Hospitality - Mr. Wangchuck & his Family make you feel like royalty. 3. Great Food... 5. Neat & clean rooms... I wish to go here again and again.",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjVD6R8OK0ovqJgqMyW10QAo4iDwrlaWzibt6FxJ-340ZW-QD55Oeg=s40-c-rp-mo-ba3-br100"
    },
    {
        name: "Dr. Amrita Chattopadhyay",
        date: "May 2022",
        rating: 5,
        text: "Stayed for a couple of days in May 2022. The owner Anteswar ji suggested a twin family room... rooms were clean and well maintained. Got some homemade non-veg dishes. The view from the room was also excellent. Thank you Anteswar ji. Will definitely refer Bethany homestay to my friends.",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjUnPyM7jtyMm1GFZ6_BDrj0nd6zqeZtUZtOxzWInuPI9NF-cPw=s40-c-rp-mo-ba2-br100"
    },
    {
        name: "tani basu",
        date: "a year ago",
        rating: 5,
        text: "It was a heavenly experience in this homestay… it was more of a home rather than a hotel. Great view from the room and thank you Mr. Wang, Mars, and the lady who used to cook for such kind and great hospitality. Thank you so much Bethany Homestay for this wonderful experience.",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjVLK5a46vUn-UtjzAlHzvL0B_gJRSASLi5w0HkcrN3cT4h_fuH2=s40-c-rp-mo-br100"
    },
    {
        name: "Ankan Ghoshal",
        date: "a year ago",
        rating: 5,
        text: "Nice view from up top, home cooked tasty meals. Overall a pleasant stay. Hotel highlights: Great view, Quiet.",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjXq9CDOctUAFBbINjZ8in1LAdpMngFvSeYbkdjWv5dWiNcgsBUB=s40-c-rp-mo-ba2-br100"
    },
    {
        name: "Dipanjan Dey",
        date: "3 years ago",
        rating: 5,
        text: "Amazing place and hospitality. I've been travelling for many years now and I had the best homestay experience at Bethany's.",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjU6C889Rpr4dXIlYIzXYYs_PPD27T9R2Ud1vMwp6Cl2f9zGz5qz=s40-c-rp-mo-br100"
    }
];

const Reviews = () => {
    return (
        <section id="reviews" className="reviews">
            <div className="container">
                <div className="section-header">
                    <h2>Guest Reviews</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffb400' }}>★ 4.9</span>
                        <span style={{ fontSize: '18px', color: '#717171' }}>on Google</span>
                    </div>
                </div>

                <div className="reviews-grid">
                    {reviewsData.map((review, index) => (
                        <div key={index} className="review-card">
                            <div className="review-header">
                                <img src={review.image} alt={review.name} className="reviewer-img" onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=' + review.name} />
                                <div className="reviewer-info">
                                    <h4>{review.name}</h4>
                                    <span className="review-date">{review.date}</span>
                                </div>
                            </div>
                            <div className="review-rating">
                                {[...Array(review.rating)].map((_, i) => (
                                    <span key={i} style={{ color: '#ffb400' }}>★</span>
                                ))}
                            </div>
                            <p className="review-text">{review.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Reviews;
