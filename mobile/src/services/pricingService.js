/**
 * Authoritative Shared Pricing Logic for Mobile App
 */

export const INDIAN_HOLIDAYS_2026 = {
    '2026-01-26': 'Republic Day',
    '2026-03-08': 'Holi',
    '2026-04-14': 'Ambedkar Jayanti',
    '2026-08-15': 'Independence Day',
    '2026-10-02': 'Gandhi Jayanti',
    '2026-10-20': 'Dussehra',
    '2026-11-08': 'Diwali',
    '2026-12-25': 'Christmas'
};

export const MEAL_PRICES = {
    breakfast: 120,
    lunch: 200,
    dinner: 200
};

export const DEFAULT_ROOMS = [
    {
        id: 'carmel',
        name: 'Carmel',
        priceLowSeason: 3000,
        priceHighSeason: 3600,
        capacity: '4 Adults + 1 Kid',
        beds: '4 Adults + 1 Kid',
        maxGuests: 5,
        extraBed: 'Extra 1 Mattress available',
        view: 'Mountain View',
        viewType: 'Mountain View',
        size: '616 sq.ft (57 sq.mt)',
        features: ['Attached Bathroom', 'Daily Housekeeping', 'Wi-Fi', 'Air Purifier'],
        images: [
            'https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/6ff89f94-7679-4e40-a7c5-aa5b01a354a9.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'
        ],
        description: 'Premier mountain view suite with direct panoramic line of sight to snow-capped Mt. Kanchenjunga.'
    },
    {
        id: 'jordan',
        name: 'Jordan',
        priceLowSeason: 2500,
        priceHighSeason: 3000,
        capacity: '4 Adults',
        beds: '4 Adults',
        maxGuests: 4,
        extraBed: null,
        view: 'Courtyard View',
        viewType: 'Courtyard View',
        size: '380 sq.ft (35 sq.mt)',
        features: ['Attached Bathroom', 'Wi-Fi', 'Courtyard Access'],
        images: [
            'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/e3a1d318-3eea-4b47-a1ee-9b5d41b619dd.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/d5e107d3-6fb4-40f4-af8d-41fd9d277ee0.jpg?output-quality=75&downsize=*:500&crop=990:500'
        ],
        description: 'Serene room opening toward the inner garden courtyard, shielded from winds for absolute peace.'
    },
    {
        id: 'sion',
        name: 'Sion Room',
        priceLowSeason: 2500,
        priceHighSeason: 3000,
        capacity: '4 Adults',
        beds: '4 Adults',
        maxGuests: 4,
        extraBed: 'Extra 1 Cot available',
        view: 'City View',
        viewType: 'City View',
        size: '320 sq.ft (28 sq.mt)',
        features: ['Attached Bathroom', 'Wi-Fi', 'City Panorama'],
        images: [
            'https://r1imghtlak.mmtcdn.com/d13f1656898d11ec8dd80a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/e2ee5312898d11ec93030a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'
        ],
        description: 'Sun-drenched elevated suite overlooking the rolling green slopes of Kalimpong town.'
    },
    {
        id: 'zion',
        name: 'Zion',
        priceLowSeason: 2500,
        priceHighSeason: 3000,
        capacity: '4 Adults',
        beds: '4 Adults',
        maxGuests: 4,
        extraBed: null,
        view: 'City View',
        viewType: 'City View',
        size: '528 sq.ft (48 sq.mt)',
        features: ['Attached Bathroom', 'Wi-Fi', 'Generous Living Space'],
        images: [
            'https://r1imghtlak.mmtcdn.com/e2ee5312898d11ec93030a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/6ff89f94-7679-4e40-a7c5-aa5b01a354a9.jpg?output-quality=75&downsize=*:500&crop=990:500',
            'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'
        ],
        description: 'Large family suite featuring expansive square footage, dedicated reading space, and valley vistas.'
    }
];

export function isHighSeason(date) {
    const d = new Date(date);
    const month = d.getMonth();
    const day = d.getDate();

    if (month === 11 || month === 0) return true;
    if (month === 2) return true;
    if (month === 3 && day <= 15) return true;
    if (month === 9) return true;
    if (month === 10 && day <= 7) return true;

    return false;
}

export function getSeasonalRoomPrice(date, roomId, roomsList = DEFAULT_ROOMS) {
    const isHigh = isHighSeason(date);
    const room = roomsList.find(r => r.id === roomId);

    if (!room) return isHigh ? 3000 : 2500;

    const lowPrice = Number(room.price_low_season || room.priceLowSeason || 2500);
    const highPrice = Number(room.price_high_season || room.priceHighSeason || 3000);

    return isHigh ? highPrice : lowPrice;
}

export function calculateRoomTotal(checkInStr, checkOutStr, selectedRooms, roomsList = DEFAULT_ROOMS) {
    if (!checkInStr || !checkOutStr || !selectedRooms || selectedRooms.length === 0) {
        return { nights: 0, roomTotal: 0 };
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (checkOut <= checkIn) return { nights: 0, roomTotal: 0 };

    const diffTime = checkOut - checkIn;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let roomTotal = 0;
    for (let i = 0; i < nights; i++) {
        const currentDate = new Date(checkIn);
        currentDate.setDate(checkIn.getDate() + i);

        selectedRooms.forEach(room => {
            roomTotal += getSeasonalRoomPrice(currentDate, room.id, roomsList);
        });
    }

    return { nights, roomTotal };
}

export function calculateMealTotal(mealSelection, nights) {
    if (!mealSelection || nights <= 0) return 0;

    let dailyCost = 0;
    const bCount = (mealSelection?.breakfast?.veg || 0) + (mealSelection?.breakfast?.nonVeg || 0);
    dailyCost += bCount * MEAL_PRICES.breakfast;

    const lCount = (mealSelection?.lunch?.veg || 0) + (mealSelection?.lunch?.nonVeg || 0);
    dailyCost += lCount * MEAL_PRICES.lunch;

    const dCount = (mealSelection?.dinner?.veg || 0) + (mealSelection?.dinner?.nonVeg || 0);
    dailyCost += dCount * MEAL_PRICES.dinner;

    return dailyCost * nights;
}

export function calculateDiscount(subtotal, coupon) {
    if (!coupon || !subtotal || subtotal <= 0) return 0;
    const type = (coupon.discount_type || coupon.type || '').toLowerCase().trim();
    const value = Number(coupon.discount_value || coupon.value || 0);

    let disc = 0;
    if (type === 'percentage') {
        disc = Math.round((subtotal * value) / 100);
    } else {
        disc = Math.round(value);
    }
    return Math.min(subtotal, Math.max(0, disc));
}
