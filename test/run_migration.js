import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

// Supabase direct connection string without sslmode in query to let pg config handle it
const connectionString = "postgres://postgres.xiqtayqigrmxkvanxsmn:bETHANY%40199507@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function applyMigration() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to Supabase PostgreSQL database...');
        await client.connect();
        console.log('Connected successfully!');

        const sqlPath = path.resolve('supabase_subscription_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing subscription migration SQL...');
        await client.query(sql);
        console.log('Subscription migration applied successfully!');

        // Verify tables
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name LIKE 'subscription_%';
        `);
        console.log('Created Subscription Tables:', res.rows.map(r => r.table_name));

        // Check plans
        const plans = await client.query(`SELECT id, title, monthly_price, commitment_months, nights_per_month FROM subscription_plans;`);
        console.log('Seeded Subscription Plans:', plans.rows);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
