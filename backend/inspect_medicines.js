const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.tfqcadngkvjsxeinmfbz:Pssw0rd%402026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function inspectMedicines() {
    try {
        const res = await pool.query('SELECT name, purchase_price, selling_price, quantity FROM medicines LIMIT 10');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectMedicines();
