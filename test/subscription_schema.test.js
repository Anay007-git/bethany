import test from 'node:test';
import assert from 'node:assert';
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres.xiqtayqigrmxkvanxsmn:bETHANY%40199507@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

test('Verify subscription database schemas and constraints', async (t) => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    await t.test('1. Plans table has default 3-month commitment plans', async () => {
        const { rows } = await client.query('SELECT * FROM subscription_plans');
        assert.ok(rows.length >= 2, 'Should have at least 2 seeded plans');
        for (const plan of rows) {
            assert.ok(plan.commitment_months >= 3, 'Commitment must be at least 3 months');
            assert.ok(Number(plan.monthly_price) > 0, 'Price must be positive');
        }
    });

    await t.test('2. Enforce 4 occupant limit per application', async () => {
        // Create dummy user
        const testEmail = `test_occ_${Date.now()}@test.com`;
        const userRes = await client.query(`
            INSERT INTO subscription_users (email, full_name, auth_provider, is_email_verified)
            VALUES ($1, 'Test User', 'manual', true)
            RETURNING id;
        `, [testEmail]);
        const userId = userRes.rows[0].id;

        // Create application
        const appRes = await client.query(`
            INSERT INTO subscription_applications (user_id, category, primary_name, primary_email, primary_phone, primary_address, status)
            VALUES ($1, 'family', 'Test User', $2, '9876543210', 'Kalimpong, WB', 'draft')
            RETURNING id;
        `, [userId, testEmail]);
        const appId = appRes.rows[0].id;

        // Add 4 occupants (should succeed)
        for (let i = 1; i <= 4; i++) {
            await client.query(`
                INSERT INTO subscription_occupants (application_id, full_name, age, relationship, is_primary)
                VALUES ($1, $2, 30, 'Family', $3);
            `, [appId, `Occupant ${i}`, i === 1]);
        }

        // 5th occupant MUST fail with trigger error
        let failed = false;
        try {
            await client.query(`
                INSERT INTO subscription_occupants (application_id, full_name, age, relationship, is_primary)
                VALUES ($1, 'Occupant 5', 25, 'Guest', false);
            `, [appId]);
        } catch (err) {
            failed = true;
            assert.match(err.message, /cannot have more than 4 occupants/i);
        }
        assert.strictEqual(failed, true, 'Inserting 5th occupant must fail');

        // Clean up test data
        await client.query(`DELETE FROM subscription_users WHERE id = $1;`, [userId]);
    });

    await client.end();
});
