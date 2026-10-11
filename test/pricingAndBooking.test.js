import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isHighSeason,
    getSeasonalRoomPrice,
    calculateRoomTotal,
    calculateMealTotal,
    calculateDiscount,
    isRoomAvailable,
    DEFAULT_ROOMS
} from '../src/utils/pricingAndBooking.js';

test('Seasonality logic test', () => {
    // High season: December & January
    assert.equal(isHighSeason(new Date('2026-12-25')), true, 'Dec 25 must be high season');
    assert.equal(isHighSeason(new Date('2026-01-10')), true, 'Jan 10 must be high season');

    // High season: March & April up to 15th
    assert.equal(isHighSeason(new Date('2026-03-20')), true, 'March 20 must be high season');
    assert.equal(isHighSeason(new Date('2026-04-10')), true, 'April 10 must be high season');
    assert.equal(isHighSeason(new Date('2026-04-20')), false, 'April 20 must be low season');

    // High season: October & November up to 7th
    assert.equal(isHighSeason(new Date('2026-10-15')), true, 'October 15 must be high season');
    assert.equal(isHighSeason(new Date('2026-11-05')), true, 'November 5 must be high season');
    assert.equal(isHighSeason(new Date('2026-11-15')), false, 'November 15 must be low season');

    // Regular low season: June
    assert.equal(isHighSeason(new Date('2026-06-15')), false, 'June 15 must be low season');
});

test('Seasonal room pricing test', () => {
    // Carmel: 3600 High, 3000 Low
    assert.equal(getSeasonalRoomPrice(new Date('2026-01-05'), 'carmel'), 3600);
    assert.equal(getSeasonalRoomPrice(new Date('2026-06-05'), 'carmel'), 3000);

    // Jordan: 3000 High, 2500 Low
    assert.equal(getSeasonalRoomPrice(new Date('2026-12-20'), 'jordan'), 3000);
    assert.equal(getSeasonalRoomPrice(new Date('2026-07-20'), 'jordan'), 2500);
});

test('Multi-night room calculation spanning season transition', () => {
    // April 14 to April 16 (2 nights: night 1 is high season (Apr 14), night 2 is low season (Apr 15 is high up to 15th, let's verify))
    // Apr 14 -> High (3600), Apr 15 (day <= 15) -> High (3600) for Carmel
    const selectedRooms = [DEFAULT_ROOMS[0]]; // Carmel
    const res = calculateRoomTotal('2026-04-14', '2026-04-16', selectedRooms);
    assert.equal(res.nights, 2);
    assert.equal(res.roomTotal, 7200);

    // Low season 3 nights for Carmel (June 10 to June 13)
    const resLow = calculateRoomTotal('2026-06-10', '2026-06-13', selectedRooms);
    assert.equal(resLow.nights, 3);
    assert.equal(resLow.roomTotal, 9000);
});

test('Meal calculations test', () => {
    const mealSelection = {
        breakfast: { veg: 2, nonVeg: 0 }, // 2 * 120 = 240
        lunch: { veg: 1, nonVeg: 1 },     // 2 * 200 = 400
        dinner: { veg: 0, nonVeg: 2 }     // 2 * 200 = 400
    };
    // Total per day = 1040. For 3 nights = 3120.
    const mealTotal = calculateMealTotal(mealSelection, 3);
    assert.equal(mealTotal, 3120);
});

test('Discount coupon calculations test', () => {
    const subtotal = 10000;
    // Percentage 5%
    const disc5 = calculateDiscount(subtotal, { discount_type: 'percentage', discount_value: 5 });
    assert.equal(disc5, 500);

    // Fixed 1500
    const discFixed = calculateDiscount(subtotal, { discount_type: 'fixed', discount_value: 1500 });
    assert.equal(discFixed, 1500);

    // Discount ceiling
    const discCeil = calculateDiscount(subtotal, { discount_type: 'fixed', discount_value: 15000 });
    assert.equal(discCeil, 10000);
});

test('Room availability and conflict detection', () => {
    const existingBookings = [
        {
            status: 'confirmed',
            check_in: '2026-10-10',
            check_out: '2026-10-15',
            room_ids: [{ id: 'carmel', name: 'Carmel' }]
        }
    ];

    // Conflict overlapping 2026-10-12 to 2026-10-14
    const isAvailOverlap = isRoomAvailable({
        roomId: 'carmel',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        existingBookings
    });
    assert.equal(isAvailOverlap, false, 'Should detect date conflict');

    // Available before existing booking: 2026-10-05 to 2026-10-10
    const isAvailBefore = isRoomAvailable({
        roomId: 'carmel',
        checkIn: '2026-10-05',
        checkOut: '2026-10-10',
        existingBookings
    });
    assert.equal(isAvailBefore, true, 'Checkout on same day as checkin should be available');

    // Available on another room: jordan
    const isOtherRoomAvail = isRoomAvailable({
        roomId: 'jordan',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        existingBookings
    });
    assert.equal(isOtherRoomAvail, true, 'Jordan room should be free');
});
