import test from 'node:test';
import assert from 'node:assert';
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres.xiqtayqigrmxkvanxsmn:bETHANY%40199507@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

test('Verify atomic subscription booking and cross-channel overlap prevention', async (t) => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const testEmail = `sub_atomic_${Date.now()}@test.com`;
    let userId, appId, memberId;
    const testRoom = 'carmel';
    const testDate1 = '2026-11-10';
    const testDate2 = '2026-11-11';
    const testCheckOut = '2026-11-12'; // 2 nights

    try {
        // Setup user, application, membership
        const userRes = await client.query(`
            INSERT INTO subscription_users (email, full_name, auth_provider, is_email_verified)
            VALUES ($1, 'Atomic Test Member', 'google', true)
            RETURNING id;
        `, [testEmail]);
        userId = userRes.rows[0].id;

        const appRes = await client.query(`
            INSERT INTO subscription_applications (user_id, category, primary_name, primary_email, primary_phone, primary_address, status)
            VALUES ($1, 'couple', 'Atomic Test Member', $2, '9876543210', 'Kalimpong, WB', 'approved')
            RETURNING id;
        `, [userId, testEmail]);
        appId = appRes.rows[0].id;

        const memRes = await client.query(`
            INSERT INTO subscription_memberships (
                user_id, application_id, plan_id, status, start_date, renewal_date, commitment_end_date,
                monthly_price, nights_allocated_monthly, nights_remaining_current_period, auto_pay_authorized
            ) VALUES (
                $1, $2, 'couple_serenity_tier', 'active', '2026-11-01', '2026-12-01', '2027-02-01',
                18500, 5, 5, true
            ) RETURNING id;
        `, [userId, appId]);
        memberId = memRes.rows[0].id;

        await t.test('1. Fails when dates are blocked by Admin / OTA', async () => {
            // Block the date in ota_blocked_dates (e.g. October month block)
            await client.query(`
                INSERT INTO ota_blocked_dates (room_id, blocked_date, source)
                VALUES ($1, $2, 'Admin Oct Block')
                ON CONFLICT (room_id, blocked_date) DO NOTHING;
            `, [testRoom, testDate1]);

            const res = await client.query(`
                SELECT book_subscription_stay_atomic($1, $2, $3, $4, $5, 2, '[]'::jsonb, 'Test') AS result;
            `, [memberId, userId, testRoom, testDate1, testCheckOut]);
            const result = res.rows[0].result;
            assert.strictEqual(result.success, false);
            assert.match(result.error, /blocked by management/i);

            // Unblock date for remaining tests
            await client.query(`
                DELETE FROM ota_blocked_dates WHERE room_id = $1 AND blocked_date = $2;
            `, [testRoom, testDate1]);
        });

        await t.test('2. Fails when date overlaps with a public booking', async () => {
            // Insert conflicting public booking
            const publicBookingRes = await client.query(`
                INSERT INTO bookings (room_ids, check_in, check_out, guests_count, total_price, status)
                VALUES (jsonb_build_array(jsonb_build_object('id', $1::text)), $2, $3, 2, 5000, 'confirmed')
                RETURNING id;
            `, [testRoom, testDate1, testCheckOut]);
            const pubId = publicBookingRes.rows[0].id;

            const res = await client.query(`
                SELECT book_subscription_stay_atomic($1, $2, $3, $4, $5, 2, '[]'::jsonb, 'Test') AS result;
            `, [memberId, userId, testRoom, testDate1, testCheckOut]);
            const result = res.rows[0].result;
            assert.strictEqual(result.success, false);
            assert.match(result.error, /already reserved for a standard stay/i);

            // Clean up public booking
            await client.query(`DELETE FROM bookings WHERE id = $1;`, [pubId]);
        });

        await t.test('3. Successfully books available dates and atomically updates remaining balance', async () => {
            const res = await client.query(`
                SELECT book_subscription_stay_atomic($1, $2, $3, $4, $5, 2, '[]'::jsonb, 'Test Note') AS result;
            `, [memberId, userId, testRoom, testDate1, testCheckOut]);
            const result = res.rows[0].result;
            assert.strictEqual(result.success, true);
            assert.ok(result.booking_id, 'Should return booking UUID');
            assert.strictEqual(result.remaining_nights, 3, '5 nights initial - 2 booked = 3 remaining');

            // Verify booking record was created
            const checkBooking = await client.query(`
                SELECT * FROM subscription_bookings WHERE id = $1;
            `, [result.booking_id]);
            assert.strictEqual(checkBooking.rows.length, 1);
            assert.strictEqual(checkBooking.rows[0].nights, 2);
        });

        await t.test('4. Duplicate booking attempt for same room and dates fails', async () => {
            const res = await client.query(`
                SELECT book_subscription_stay_atomic($1, $2, $3, $4, $5, 2, '[]'::jsonb, 'Test') AS result;
            `, [memberId, userId, testRoom, testDate1, testCheckOut]);
            const result = res.rows[0].result;
            assert.strictEqual(result.success, false);
            assert.match(result.error, /already booked by another/i);
        });

    } finally {
        // Clean up test data
        if (memberId) {
            await client.query(`DELETE FROM subscription_bookings WHERE membership_id = $1;`, [memberId]);
            await client.query(`DELETE FROM subscription_memberships WHERE id = $1;`, [memberId]);
        }
        if (appId) {
            await client.query(`DELETE FROM subscription_applications WHERE id = $1;`, [appId]);
        }
        if (userId) {
            await client.query(`DELETE FROM subscription_users WHERE id = $1;`, [userId]);
        }
        await client.query(`
            DELETE FROM subscription_room_allocations 
            WHERE room_id = $1 AND allocated_date IN ($2, $3);
        `, [testRoom, testDate1, testDate2]);

        await client.end();
    }
});
