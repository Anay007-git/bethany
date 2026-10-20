/**
 * Bethany Homestay - Authoritative Pricing & Booking Calculation Utilities
 * Shared business logic between Web and Mobile platforms
 */

// Indian Public / Festival Holidays
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

// Meal Unit Prices in INR
export const MEAL_PRICES = {
    breakfast: 120,
    lunch: 200,
    dinner: 200
};

// Default Room Inventory Fallbacks (matches Supabase seed data)
export const DEFAULT_ROOMS = [
    {
        id: 'carmel',
        name: 'Carmel',
        priceLowSeason: 3000,
        priceHighSeason: 3600,
        price: 3000,
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
        description: 'Spacious suite overlooking the majestic Kanchenjunga with private ensuite and mountain sunrise view.'
    },
    {
        id: 'jordan',
        name: 'Jordan',
        priceLowSeason: 2500,
        priceHighSeason: 3000,
        price: 2500,
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
        description: 'Serene room facing the tranquil inner courtyard, ideal for quiet relaxation and peaceful nights.'
    },
    {
        id: 'sion',
        name: 'Sion Room',
        priceLowSeason: 2500,
        priceHighSeason: 3000,
        price: 2500,
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
        description: 'Charming elevated room offering panoramic views of Kalimpong town lights and rolling valleys.'
    },
    {
        id: 'zion',
        name: 'Zion',
        priceLowSeason: 2500,
        priceHighSeason: 3000,
        price: 2500,
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
        description: 'Spacious accommodation with expansive seating area, perfect for families and small groups.'
    }
];

/**
 * Check if a given date falls in On-Season / High Season.
 * Off-season (Monsoon): Mid June (June 15) through July and August up to Mid September (Sept 15).
 * Rests are On-Season / Peak Season.
 */
export function isHighSeason(date) {
    const d = new Date(date);
    const month = d.getMonth(); // 0 = Jan, 5 = June, 6 = July, 7 = Aug, 8 = Sept, 11 = Dec
    const day = d.getDate();

    // Off-season: Mid June (June 15) to Mid September (Sept 15)
    if (month === 5 && day >= 15) return false; // June 15 - June 30
    if (month === 6) return false;              // July 1 - July 31
    if (month === 7) return false;              // August 1 - August 31
    if (month === 8 && day <= 15) return false; // September 1 - September 15

    // All other dates are On-Season / Peak Season
    return true;
}

/**
 * Get Room Price for a specific date and room
 */
export function getSeasonalRoomPrice(date, roomId, roomsList = DEFAULT_ROOMS) {
    const isHigh = isHighSeason(date);
    const room = roomsList.find(r => r.id === roomId);

    if (!room) {
        return isHigh ? 3000 : 2500;
    }

    const lowPrice = Number(room.price_low_season || room.priceLowSeason || room.price || 2500);
    const highPrice = Number(room.price_high_season || room.priceHighSeason || room.price || 3000);

    return isHigh ? highPrice : lowPrice;
}

/**
 * Calculate total room costs across date range
 */
export function calculateRoomTotal(checkInStr, checkOutStr, selectedRooms, roomsList = DEFAULT_ROOMS) {
    if (!checkInStr || !checkOutStr || !selectedRooms || selectedRooms.length === 0) {
        return { nights: 0, roomTotal: 0, dailyBreakdown: [] };
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (checkOut <= checkIn) {
        return { nights: 0, roomTotal: 0, dailyBreakdown: [] };
    }

    const diffTime = checkOut - checkIn;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let roomTotal = 0;
    const dailyBreakdown = [];

    for (let i = 0; i < nights; i++) {
        const currentDate = new Date(checkIn);
        currentDate.setDate(checkIn.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        const isHigh = isHighSeason(currentDate);

        let dayRoomTotal = 0;
        const dayRooms = [];

        selectedRooms.forEach(room => {
            const price = getSeasonalRoomPrice(currentDate, room.id, roomsList);
            dayRoomTotal += price;
            dayRooms.push({ id: room.id, name: room.name, price });
        });

        roomTotal += dayRoomTotal;
        dailyBreakdown.push({
            date: dateStr,
            isHighSeason: isHigh,
            dayRoomTotal,
            rooms: dayRooms
        });
    }

    return { nights, roomTotal, dailyBreakdown };
}

/**
 * Calculate total meal cost
 */
export function calculateMealTotal(mealSelection, nights) {
    if (!mealSelection || nights <= 0) return 0;

    let dailyMealCost = 0;

    const bCount = (mealSelection?.breakfast?.veg || 0) + (mealSelection?.breakfast?.nonVeg || 0);
    dailyMealCost += bCount * MEAL_PRICES.breakfast;

    const lCount = (mealSelection?.lunch?.veg || 0) + (mealSelection?.lunch?.nonVeg || 0);
    dailyMealCost += lCount * MEAL_PRICES.lunch;

    const dCount = (mealSelection?.dinner?.veg || 0) + (mealSelection?.dinner?.nonVeg || 0);
    dailyMealCost += dCount * MEAL_PRICES.dinner;

    return dailyMealCost * nights;
}

/**
 * Calculate coupon discount amount
 */
export function calculateDiscount(subtotal, coupon) {
    if (!coupon || !subtotal || subtotal <= 0) return 0;

    const type = (coupon.discount_type || coupon.type || '').toLowerCase().trim();
    const value = Number(coupon.discount_value || coupon.value || 0);

    let discount = 0;
    if (type === 'percentage') {
        discount = Math.round((subtotal * value) / 100);
    } else {
        discount = Math.round(value);
    }

    if (discount > subtotal) discount = subtotal;
    return Math.max(0, discount);
}

/**
 * Check if a room is available for checkIn and checkOut
 */
export function isRoomAvailable({ roomId, roomName, checkIn, checkOut, existingBookings = [], otaBlockedDates = {} }) {
    if (!checkIn || !checkOut || !roomId) return true;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // 1. Check OTA blocked dates
    const roomBlocks = otaBlockedDates[roomId] || [];
    for (const block of roomBlocks) {
        const blockStart = new Date(block.start || block.blocked_date);
        blockStart.setHours(0, 0, 0, 0);
        const blockEnd = new Date(blockStart);
        blockEnd.setDate(blockEnd.getDate() + 1);
        blockEnd.setHours(0, 0, 0, 0);

        if (start < blockEnd && end > blockStart) {
            return false;
        }
    }

    // 2. Check existing bookings
    const targetName = (roomName || roomId).toLowerCase().trim();

    for (const b of existingBookings) {
        const bStatus = (b.status || '').toLowerCase();
        if (!['booked', 'confirmed', 'pending'].includes(bStatus)) {
            continue;
        }

        // Room matching
        let hasRoom = false;
        if (Array.isArray(b.room_ids)) {
            hasRoom = b.room_ids.some(r =>
                r.id === roomId || (r.name && r.name.toLowerCase().includes(targetName))
            );
        } else if (typeof b.roomType === 'string') {
            const types = b.roomType.toLowerCase().split(',').map(s => s.trim());
            hasRoom = types.some(t => t.includes(targetName) || targetName.includes(t));
        }

        if (hasRoom) {
            const bStart = new Date(b.check_in || b.checkIn);
            const bEnd = new Date(b.check_out || b.checkOut);
            bStart.setHours(0, 0, 0, 0);
            bEnd.setHours(0, 0, 0, 0);

            if (start < bEnd && end > bStart) {
                return false;
            }
        }
    }

    return true;
}
