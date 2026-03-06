const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.tfqcadngkvjsxeinmfbz:Pssw0rd%402026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function checkDataQuality() {
    try {
        const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(quantity) as with_qty,
        COUNT(purchase_price) as with_purchase_price,
        COUNT(selling_price) as with_selling_price,
        SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as positive_qty,
        SUM(CASE WHEN purchase_price > 0 THEN 1 ELSE 0 END) as positive_purchase,
        SUM(CASE WHEN selling_price > 0 THEN 1 ELSE 0 END) as positive_selling
      FROM medicines
    `);
        console.log('Medicine Stats:', stats.rows[0]);

        const inventoryValue = await pool.query(`
      SELECT 
        CAST(COUNT(*) AS INTEGER) as total_items,
        CAST(COALESCE(SUM(quantity), 0) AS INTEGER) as total_quantity,
        COALESCE(SUM(quantity * purchase_price), 0) as total_purchase_value,
        COALESCE(SUM(quantity * selling_price), 0) as total_selling_value
      FROM medicines
    `);
        console.log('Calculated Inventory Value:', inventoryValue.rows[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkDataQuality();
