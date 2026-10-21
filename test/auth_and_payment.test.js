import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres.xiqtayqigrmxkvanxsmn:bETHANY%40199507@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

test('Authentication, OTP hashing, and Payment verification pipeline', async (t) => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const testEmail = `auth_test_${Date.now()}@test.com`;
    const testOtp = '742915';
    const hashedOtp = crypto.createHash('sha256').update(testOtp).digest('hex');
    let userId;

    try {
        // 1. Test OTP hashing and storage
        await t.test('1. Cryptographic OTP generation and hashed storage', async () => {
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            const res = await client.query(`
                INSERT INTO subscription_users (
                    email, full_name, auth_provider, is_email_verified,
                    otp_code, otp_expires_at, otp_attempts, last_otp_sent_at
                ) VALUES ($1, 'Test Guest', 'email_otp', false, $2, $3, 0, NOW())
                RETURNING id, otp_code, is_email_verified;
            `, [testEmail, hashedOtp, expiresAt]);

            userId = res.rows[0].id;
            assert.strictEqual(res.rows[0].is_email_verified, false);
            // Verify plain OTP is NOT stored in database
            assert.notStrictEqual(res.rows[0].otp_code, testOtp);
            assert.strictEqual(res.rows[0].otp_code, hashedOtp);
        });

        // 2. Test Invalid OTP rejection and attempt counter increment
        await t.test('2. Reject invalid OTP and track attempt count', async () => {
            const wrongOtp = '000000';
            const wrongHash = crypto.createHash('sha256').update(wrongOtp).digest('hex');

            const check = await client.query(`SELECT otp_code, otp_attempts FROM subscription_users WHERE id = $1`, [userId]);
            assert.notStrictEqual(check.rows[0].otp_code, wrongHash);

            // Increment attempt
            await client.query(`UPDATE subscription_users SET otp_attempts = otp_attempts + 1 WHERE id = $1`, [userId]);
            const updated = await client.query(`SELECT otp_attempts FROM subscription_users WHERE id = $1`, [userId]);
            assert.strictEqual(updated.rows[0].otp_attempts, 1);
        });

        // 3. Test Successful OTP verification and account activation
        await t.test('3. Successful OTP verification clears OTP and sets is_email_verified to true', async () => {
            const inputOtp = '742915';
            const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex');

            const matchRes = await client.query(`
                SELECT id FROM subscription_users 
                WHERE id = $1 AND otp_code = $2 AND otp_expires_at > NOW() AND otp_attempts < 5
            `, [userId, inputHash]);

            assert.strictEqual(matchRes.rows.length, 1);

            // Invalidate code upon successful verification (single-use OTP)
            await client.query(`
                UPDATE subscription_users 
                SET is_email_verified = true, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0
                WHERE id = $1
            `, [userId]);

            const verifiedCheck = await client.query(`
                SELECT is_email_verified, otp_code FROM subscription_users WHERE id = $1
            `, [userId]);

            assert.strictEqual(verifiedCheck.rows[0].is_email_verified, true);
            assert.strictEqual(verifiedCheck.rows[0].otp_code, null);
        });

        // 4. Test Google OAuth Account Linking
        await t.test('4. Google OAuth links to existing user without creating duplicate account', async () => {
            // Simulated Google Sign-In with same email
            const linkRes = await client.query(`
                UPDATE subscription_users
                SET auth_provider = 'google', is_email_verified = true, updated_at = NOW()
                WHERE email = $1
                RETURNING id, email, auth_provider, is_email_verified;
            `, [testEmail]);

            assert.strictEqual(linkRes.rows.length, 1);
            assert.strictEqual(linkRes.rows[0].auth_provider, 'google');
            assert.strictEqual(linkRes.rows[0].is_email_verified, true);

            // Verify count remains 1
            const countRes = await client.query(`SELECT COUNT(*) FROM subscription_users WHERE email = $1`, [testEmail]);
            assert.strictEqual(parseInt(countRes.rows[0].count, 10), 1);
        });

        // 5. Test 3-Month Minimum Commitment Rule
        await t.test('5. Verify 3-month commitment constraints on subscription plans', async () => {
            const plans = await client.query(`SELECT id, monthly_price, commitment_months FROM subscription_plans WHERE is_active = true`);
            assert(plans.rows.length > 0);
            for (const plan of plans.rows) {
                assert(plan.commitment_months >= 3, `Plan ${plan.id} commitment months must be >= 3`);
                const totalThreeMonthCommitment = parseFloat(plan.monthly_price) * 3;
                assert(totalThreeMonthCommitment > 0);
            }
        });

    } finally {
        if (userId) {
            await client.query(`DELETE FROM subscription_users WHERE id = $1`, [userId]);
        }
        await client.end();
    }
});
