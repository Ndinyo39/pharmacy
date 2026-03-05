const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Pharmacy Backend API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


/* ================================
   DATABASE CONNECTION (PostgreSQL - Supabase)
=============================== */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.tfqcadngkvjsxeinmfbz:Pssw0rd%402026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('PostgreSQL Database Connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

/* ================================
   CREATE TABLES IF NOT EXISTS
=============================== */

const initDatabase = async () => {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'pharmacist',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Medicines table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id SERIAL PRIMARY KEY,
      name TEXT,
      generic_name TEXT,
      batch_number TEXT,
      barcode TEXT,
      purchase_price REAL,
      selling_price REAL,
      quantity INTEGER,
      expiry_date TEXT,
      category TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      loyalty_points INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Suppliers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      company_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales transactions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_transactions (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      medicine_id INTEGER REFERENCES medicines(id),
      quantity INTEGER,
      unit_price REAL,
      total_amount REAL,
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT
    )
  `);

  // Prescriptions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      medicine_id INTEGER REFERENCES medicines(id),
      quantity INTEGER,
      prescribed_by TEXT,
      prescription_date DATE,
      expiry_date DATE,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Pharmacies table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pharmacies (
      id SERIAL PRIMARY KEY,
      name TEXT,
      address TEXT,
      city TEXT,
      phone TEXT,
      email TEXT,
      license_number TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Branches table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      pharmacy_id INTEGER REFERENCES pharmacies(id),
      name TEXT,
      address TEXT,
      city TEXT,
      phone TEXT,
      manager_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      setting_key TEXT UNIQUE,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Audit logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('All tables created successfully');
};

// Initialize database
initDatabase().catch(console.error);

/* ================================
   AUTHENTICATION MIDDLEWARE
=============================== */

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

/* ================================
   AUTH ROUTES
=============================== */

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'pharmacist']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   MEDICINES ROUTES
=============================== */

// Get all medicines
app.get('/api/medicines', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single medicine
app.get('/api/medicines/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create medicine
app.post('/api/medicines', authenticateToken, async (req, res) => {
  try {
    const { name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date, category, description } = req.body;
    const result = await pool.query(
      'INSERT INTO medicines (name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date, category, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date, category, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medicine
app.put('/api/medicines/:id', authenticateToken, async (req, res) => {
  try {
    const { name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date, category, description } = req.body;
    const result = await pool.query(
      'UPDATE medicines SET name = $1, generic_name = $2, batch_number = $3, barcode = $4, purchase_price = $5, selling_price = $6, quantity = $7, expiry_date = $8, category = $9, description = $10 WHERE id = $11 RETURNING *',
      [name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date, category, description, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete medicine
app.delete('/api/medicines/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM medicines WHERE id = $1', [req.params.id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   CUSTOMERS ROUTES
=============================== */

app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, city } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, address, city) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, address, city]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, city } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3, address = $4, city = $5 WHERE id = $6 RETURNING *',
      [name, email, phone, address, city, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   SALES ROUTES
=============================== */

app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, m.name as medicine_name, c.name as customer_name 
      FROM sales_transactions s 
      LEFT JOIN medicines m ON s.medicine_id = m.id 
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.transaction_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { customer_id, medicine_id, quantity, unit_price, payment_method } = req.body;
    const total_amount = quantity * unit_price;

    const result = await pool.query(
      'INSERT INTO sales_transactions (customer_id, medicine_id, quantity, unit_price, total_amount, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id || null, medicine_id, quantity, unit_price, total_amount, payment_method]
    );

    // Update medicine quantity
    await pool.query(
      'UPDATE medicines SET quantity = quantity - $1 WHERE id = $2',
      [quantity, medicine_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sales/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get sale details first
    const saleResult = await client.query('SELECT medicine_id, quantity FROM sales_transactions WHERE id = $1', [req.params.id]);

    if (saleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sale record not found' });
    }

    const { medicine_id, quantity } = saleResult.rows[0];

    // Delete the sale record
    await client.query('DELETE FROM sales_transactions WHERE id = $1', [req.params.id]);

    // Restore medicine quantity
    await client.query(
      'UPDATE medicines SET quantity = quantity + $1 WHERE id = $2',
      [quantity, medicine_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Sale record deleted and inventory updated' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});


/* ================================
   PRESCRIPTIONS ROUTES
=============================== */

app.get('/api/prescriptions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, m.name as medicine_name, c.name as customer_name 
      FROM prescriptions p 
      LEFT JOIN medicines m ON p.medicine_id = m.id 
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prescriptions', authenticateToken, async (req, res) => {
  try {
    const { customer_id, medicine_id, quantity, prescribed_by, prescription_date, expiry_date, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO prescriptions (customer_id, medicine_id, quantity, prescribed_by, prescription_date, expiry_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [customer_id, medicine_id, quantity, prescribed_by, prescription_date, expiry_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/prescriptions/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE prescriptions SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/prescriptions/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM prescriptions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   SUPPLIERS ROUTES
=============================== */

app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, city, company_name } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (name, email, phone, address, city, company_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, address, city, company_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   INVENTORY ROUTES
=============================== */

app.get('/api/inventory/low-stock', authenticateToken, async (req, res) => {
  try {
    const threshold = req.query.threshold || 5;
    const result = await pool.query('SELECT * FROM medicines WHERE quantity <= $1 ORDER BY quantity ASC', [threshold]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/inventory/out-of-stock', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines WHERE quantity = 0 ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/inventory/expired', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines WHERE expiry_date < CURRENT_DATE ORDER BY expiry_date');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   REPORTS ROUTES
=============================== */

app.get('/api/reports/sales-summary', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_transactions
      FROM sales_transactions
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/top-medicines', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.name, SUM(s.quantity) as total_sold, SUM(s.total_amount) as total_revenue
      FROM sales_transactions s
      JOIN medicines m ON s.medicine_id = m.id
      GROUP BY m.id, m.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/daily-sales', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(transaction_date) as date,
        COUNT(*) as transaction_count,
        SUM(total_amount) as daily_revenue
      FROM sales_transactions
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(transaction_date)
      ORDER BY date
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/inventory-value', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        CAST(COUNT(*) AS INTEGER) as total_items,
        CAST(COALESCE(SUM(quantity), 0) AS INTEGER) as total_quantity,
        COALESCE(SUM(quantity * purchase_price), 0) as total_purchase_value,
        COALESCE(SUM(quantity * selling_price), 0) as total_selling_value
      FROM medicines
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   SETTINGS ROUTES
=============================== */

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    await pool.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP',
      [key, value]
    );
    res.json({ message: 'Setting saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/settings/:key', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM settings WHERE setting_key = $1', [req.params.key]);
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   SUPER ADMIN ROUTES
=============================== */

// Dashboard stats
app.get('/api/superadmin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const [pharmacies, branches, users, medicines, suppliers, customers, sales, prescriptions] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM pharmacies'),
      pool.query('SELECT COUNT(*) as count FROM branches'),
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM medicines'),
      pool.query('SELECT COUNT(*) as count FROM suppliers'),
      pool.query('SELECT COUNT(*) as count FROM customers'),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales_transactions WHERE DATE(transaction_date) = CURRENT_DATE"),
      pool.query('SELECT COUNT(*) as count FROM prescriptions')
    ]);

    const lowStock = await pool.query('SELECT COUNT(*) as count FROM medicines WHERE quantity <= 5');
    const outOfStock = await pool.query('SELECT COUNT(*) as count FROM medicines WHERE quantity = 0');
    const expiringSoon = await pool.query("SELECT COUNT(*) as count FROM medicines WHERE expiry_date <= CURRENT_DATE + INTERVAL '7 days'");

    res.json({
      total_pharmacies: parseInt(pharmacies.rows[0].count),
      total_branches: parseInt(branches.rows[0].count),
      total_users: parseInt(users.rows[0].count),
      total_products: parseInt(medicines.rows[0].count),
      total_suppliers: parseInt(suppliers.rows[0].count),
      total_customers: parseInt(customers.rows[0].count),
      today_sales: parseFloat(sales.rows[0].total),
      total_prescriptions: parseInt(prescriptions.rows[0].count),
      low_stock_items: parseInt(lowStock.rows[0].count),
      out_of_stock: parseInt(outOfStock.rows[0].count),
      expiring_soon: parseInt(expiringSoon.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users management
app.get('/api/superadmin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/superadmin/users/:id/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/superadmin/users/:id/suspend', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['suspended', req.params.id]);
    res.json({ message: 'User suspended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/superadmin/users/:id/activate', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['active', req.params.id]);
    res.json({ message: 'User activated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/superadmin/users/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pharmacies
app.get('/api/superadmin/pharmacies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pharmacies ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/superadmin/pharmacies', authenticateToken, async (req, res) => {
  try {
    const { name, address, city, phone, email, license_number } = req.body;
    const result = await pool.query(
      'INSERT INTO pharmacies (name, address, city, phone, email, license_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, address, city, phone, email, license_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Branches
app.get('/api/superadmin/branches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.name as pharmacy_name 
      FROM branches b 
      LEFT JOIN pharmacies p ON b.pharmacy_id = p.id 
      ORDER BY b.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/superadmin/branches', authenticateToken, async (req, res) => {
  try {
    const { pharmacy_id, name, address, city, phone } = req.body;
    const result = await pool.query(
      'INSERT INTO branches (pharmacy_id, name, address, city, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [pharmacy_id, name, address, city, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit logs
app.get('/api/superadmin/audit-logs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, u.name as user_name, u.email 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.timestamp DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   SERVER START
=============================== */

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

