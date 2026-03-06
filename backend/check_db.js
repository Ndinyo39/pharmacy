const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.tfqcadngkvjsxeinmfbz:Pssw0rd%402026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function checkDb() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM medicines');
        console.log('Medicines count:', res.rows[0].count);
        const names = await pool.query('SELECT name FROM medicines LIMIT 5');
        console.log('First 5 names:', names.rows.map(r => r.name));
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkDb();
