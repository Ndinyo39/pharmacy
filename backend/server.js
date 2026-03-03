const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   DATABASE CONNECTION (SQLite)
================================ */

const dbPath = path.resolve(__dirname, "pharmacy.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("SQLite Database Connected");
  }
});

/* ===============================
   CREATE TABLES IF NOT EXISTS
================================ */

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'pharmacist',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      generic_name TEXT,
      batch_number TEXT,
      barcode TEXT,
      purchase_price REAL,
      selling_price REAL,
      quantity INTEGER,
      expiry_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      loyalty_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      company_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      medicine_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      total_amount REAL,
      transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      medicine_id INTEGER,
      quantity INTEGER,
      prescribed_by TEXT,
      prescription_date TEXT,
      expiry_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    )
  `);

  // Superadmin: Pharmacies Table
  db.run(`
    CREATE TABLE IF NOT EXISTS pharmacies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      address TEXT,
      city TEXT,
      phone TEXT,
      email TEXT,
      license_number TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Superadmin: Branches Table
  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pharmacy_id INTEGER,
      name TEXT,
      address TEXT,
      city TEXT,
      phone TEXT,
      manager_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )
  `);

  // Superadmin: Audit Logs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Superadmin: System Settings Table
  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE,
      setting_value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Superadmin: Login History Table
  db.run(`
    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      logout_time DATETIME,
      ip_address TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Update users table to include status and branch_id
  db.run(
    `ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`,
    (err) => {
      // Column might already exist, ignore error
    }
  );

  db.run(
    `ALTER TABLE users ADD COLUMN branch_id INTEGER`,
    (err) => {
      // Column might already exist, ignore error
    }
  );

  db.run(
    `ALTER TABLE users ADD COLUMN last_login DATETIME`,
    (err) => {
      // Column might already exist, ignore error
    }
  );
});


/* ===============================
   AUTHENTICATION ROUTES
================================ */

// Register
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, hashedPassword, role || "pharmacist"],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Email already exists" });
      }

      res.status(201).json({
        message: "User registered successfully",
        userId: this.lastID,
      });
    }
  );
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: "8h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  );
});

/* ===============================
   AUTH MIDDLEWARE
================================ */

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "supersecretkey",
    (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      req.user = user;
      next();
    }
  );
}

/* ===============================
   PROTECTED DASHBOARD ROUTE
================================ */

app.get("/api/dashboard", authenticateToken, (req, res) => {
  res.json({
    message: "Welcome to the Pharmacy Dashboard",
    user: req.user,
  });
});

/* ===============================
   MEDICINE CRUD ROUTES
================================ */

// ADD MEDICINE
app.post("/api/medicines", authenticateToken, (req, res) => {
  const {
    name,
    generic_name,
    batch_number,
    barcode,
    purchase_price,
    selling_price,
    quantity,
    expiry_date,
  } = req.body;

  if (!name || !selling_price || !quantity) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  db.run(
    `INSERT INTO medicines 
     (name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      generic_name,
      batch_number,
      barcode,
      purchase_price,
      selling_price,
      quantity,
      expiry_date,
    ],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error adding medicine" });
      }

      res.status(201).json({
        message: "Medicine added successfully",
        medicineId: this.lastID,
      });
    }
  );
});

// GET ALL MEDICINES
app.get("/api/medicines", authenticateToken, (req, res) => {
  db.all("SELECT * FROM medicines", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching medicines" });
    }

    res.json(rows);
  });
});

// GET SINGLE MEDICINE
app.get("/api/medicines/:id", authenticateToken, (req, res) => {
  db.get(
    "SELECT * FROM medicines WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      res.json(row);
    }
  );
});

// UPDATE MEDICINE
app.put("/api/medicines/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    name,
    generic_name,
    batch_number,
    barcode,
    purchase_price,
    selling_price,
    quantity,
    expiry_date,
  } = req.body;

  db.run(
    `UPDATE medicines
     SET name = ?, generic_name = ?, batch_number = ?, barcode = ?,
         purchase_price = ?, selling_price = ?, quantity = ?, expiry_date = ?
     WHERE id = ?`,
    [
      name,
      generic_name,
      batch_number,
      barcode,
      purchase_price,
      selling_price,
      quantity,
      expiry_date,
      id,
    ],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error updating medicine" });
      }

      res.json({ message: "Medicine updated successfully" });
    }
  );
});

// DELETE MEDICINE
app.delete("/api/medicines/:id", authenticateToken, (req, res) => {
  db.run(
    "DELETE FROM medicines WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error deleting medicine" });
      }

      res.json({ message: "Medicine deleted successfully" });
    }
  );
});

/* ===============================
   CUSTOMERS CRUD ROUTES
================================ */

// ADD CUSTOMER
app.post("/api/customers", authenticateToken, (req, res) => {
  const { name, email, phone, address, city } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone required" });
  }

  db.run(
    `INSERT INTO customers (name, email, phone, address, city)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone, address, city],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error adding customer" });
      }

      res.status(201).json({
        message: "Customer added successfully",
        customerId: this.lastID,
      });
    }
  );
});

// GET ALL CUSTOMERS
app.get("/api/customers", authenticateToken, (req, res) => {
  db.all("SELECT * FROM customers", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching customers" });
    }

    res.json(rows);
  });
});

// GET SINGLE CUSTOMER
app.get("/api/customers/:id", authenticateToken, (req, res) => {
  db.get(
    "SELECT * FROM customers WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(row);
    }
  );
});

// UPDATE CUSTOMER
app.put("/api/customers/:id", authenticateToken, (req, res) => {
  const { name, email, phone, address, city } = req.body;

  db.run(
    `UPDATE customers
     SET name = ?, email = ?, phone = ?, address = ?, city = ?
     WHERE id = ?`,
    [name, email, phone, address, city, req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error updating customer" });
      }

      res.json({ message: "Customer updated successfully" });
    }
  );
});

// DELETE CUSTOMER
app.delete("/api/customers/:id", authenticateToken, (req, res) => {
  db.run(
    "DELETE FROM customers WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error deleting customer" });
      }

      res.json({ message: "Customer deleted successfully" });
    }
  );
});

/* ===============================
   SUPPLIERS CRUD ROUTES
================================ */

// ADD SUPPLIER
app.post("/api/suppliers", authenticateToken, (req, res) => {
  const { name, email, phone, address, city, company_name } = req.body;

  if (!name || !company_name) {
    return res.status(400).json({ message: "Name and company name required" });
  }

  db.run(
    `INSERT INTO suppliers (name, email, phone, address, city, company_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, phone, address, city, company_name],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error adding supplier" });
      }

      res.status(201).json({
        message: "Supplier added successfully",
        supplierId: this.lastID,
      });
    }
  );
});

// GET ALL SUPPLIERS
app.get("/api/suppliers", authenticateToken, (req, res) => {
  db.all("SELECT * FROM suppliers", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching suppliers" });
    }

    res.json(rows);
  });
});

// GET SINGLE SUPPLIER
app.get("/api/suppliers/:id", authenticateToken, (req, res) => {
  db.get(
    "SELECT * FROM suppliers WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(row);
    }
  );
});

// UPDATE SUPPLIER
app.put("/api/suppliers/:id", authenticateToken, (req, res) => {
  const { name, email, phone, address, city, company_name } = req.body;

  db.run(
    `UPDATE suppliers
     SET name = ?, email = ?, phone = ?, address = ?, city = ?, company_name = ?
     WHERE id = ?`,
    [name, email, phone, address, city, company_name, req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error updating supplier" });
      }

      res.json({ message: "Supplier updated successfully" });
    }
  );
});

// DELETE SUPPLIER
app.delete("/api/suppliers/:id", authenticateToken, (req, res) => {
  db.run(
    "DELETE FROM suppliers WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error deleting supplier" });
      }

      res.json({ message: "Supplier deleted successfully" });
    }
  );
});

/* ===============================
   SALES/TRANSACTIONS ROUTES
================================ */

// CREATE SALE
app.post("/api/sales", authenticateToken, (req, res) => {
  const { customer_id, medicine_id, quantity, unit_price, payment_method } = req.body;

  if (!medicine_id || !quantity || !unit_price) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const total_amount = quantity * unit_price;

  db.run(
    `INSERT INTO sales_transactions (customer_id, medicine_id, quantity, unit_price, total_amount, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [customer_id, medicine_id, quantity, unit_price, total_amount, payment_method],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error creating sale" });
      }

      // Update medicine quantity
      db.run(
        `UPDATE medicines SET quantity = quantity - ? WHERE id = ?`,
        [quantity, medicine_id],
        (updateErr) => {
          if (updateErr) {
            return res.status(400).json({ message: "Error updating medicine stock" });
          }

          res.status(201).json({
            message: "Sale recorded successfully",
            saleId: this.lastID,
            total_amount,
          });
        }
      );
    }
  );
});

// GET ALL SALES
app.get("/api/sales", authenticateToken, (req, res) => {
  db.all(
    `SELECT st.*, c.name as customer_name, m.name as medicine_name
     FROM sales_transactions st
     LEFT JOIN customers c ON st.customer_id = c.id
     LEFT JOIN medicines m ON st.medicine_id = m.id
     ORDER BY st.transaction_date DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching sales" });
      }

      res.json(rows);
    }
  );
});

// GET SALES BY CUSTOMER
app.get("/api/sales/customer/:id", authenticateToken, (req, res) => {
  db.all(
    `SELECT st.*, m.name as medicine_name
     FROM sales_transactions st
     LEFT JOIN medicines m ON st.medicine_id = m.id
     WHERE st.customer_id = ?
     ORDER BY st.transaction_date DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching sales" });
      }

      res.json(rows);
    }
  );
});

/* ===============================
   PRESCRIPTIONS ROUTES
================================ */

// CREATE PRESCRIPTION
app.post("/api/prescriptions", authenticateToken, (req, res) => {
  const { customer_id, medicine_id, quantity, prescribed_by, prescription_date, expiry_date, notes } = req.body;

  if (!customer_id || !medicine_id || !quantity) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  db.run(
    `INSERT INTO prescriptions (customer_id, medicine_id, quantity, prescribed_by, prescription_date, expiry_date, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [customer_id, medicine_id, quantity, prescribed_by, prescription_date, expiry_date, notes],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error creating prescription" });
      }

      res.status(201).json({
        message: "Prescription created successfully",
        prescriptionId: this.lastID,
      });
    }
  );
});

// GET ALL PRESCRIPTIONS
app.get("/api/prescriptions", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, c.name as customer_name, m.name as medicine_name
     FROM prescriptions p
     LEFT JOIN customers c ON p.customer_id = c.id
     LEFT JOIN medicines m ON p.medicine_id = m.id
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching prescriptions" });
      }

      res.json(rows);
    }
  );
});

// GET PRESCRIPTIONS BY CUSTOMER
app.get("/api/prescriptions/customer/:id", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, m.name as medicine_name
     FROM prescriptions p
     LEFT JOIN medicines m ON p.medicine_id = m.id
     WHERE p.customer_id = ?
     ORDER BY p.created_at DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching prescriptions" });
      }

      res.json(rows);
    }
  );
});

// UPDATE PRESCRIPTION STATUS
app.put("/api/prescriptions/:id", authenticateToken, (req, res) => {
  const { status } = req.body;

  db.run(
    `UPDATE prescriptions SET status = ? WHERE id = ?`,
    [status, req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error updating prescription" });
      }

      res.json({ message: "Prescription updated successfully" });
    }
  );
});

// DELETE PRESCRIPTION
app.delete("/api/prescriptions/:id", authenticateToken, (req, res) => {
  db.run(
    "DELETE FROM prescriptions WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error deleting prescription" });
      }

      res.json({ message: "Prescription deleted successfully" });
    }
  );
});

/* ===============================
   INVENTORY & ALERTS ROUTES
================================ */

// GET LOW STOCK MEDICINES
app.get("/api/inventory/low-stock", authenticateToken, (req, res) => {
  const threshold = req.query.threshold || 10;

  db.all(
    `SELECT * FROM medicines WHERE quantity <= ? AND quantity > 0`, 
    [threshold],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching low stock items" });
      }

      res.json(rows);
    }
  );
});

// GET OUT OF STOCK MEDICINES
app.get("/api/inventory/out-of-stock", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM medicines WHERE quantity <= 0`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching out of stock items" });
      }

      res.json(rows);
    }
  );
});

// GET EXPIRED MEDICINES
app.get("/api/inventory/expired", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM medicines 
     WHERE expiry_date IS NOT NULL 
     AND expiry_date < date('now')`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching expired items" });
      }

      res.json(rows);
    }
  );
});

/* ===============================
   REPORTS & ANALYTICS ROUTES
================================ */

// GET SALES SUMMARY
app.get("/api/reports/sales-summary", authenticateToken, (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) as total_transactions,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_transaction,
      MAX(total_amount) as highest_transaction
     FROM sales_transactions`,
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching sales summary" });
      }

      res.json(row || { total_transactions: 0, total_revenue: 0, average_transaction: 0, highest_transaction: 0 });
    }
  );
});

// GET TOP SELLING MEDICINES
app.get("/api/reports/top-medicines", authenticateToken, (req, res) => {
  db.all(
    `SELECT m.id, m.name, m.selling_price, 
      SUM(st.quantity) as total_sold,
      SUM(st.total_amount) as total_revenue
     FROM medicines m
     LEFT JOIN sales_transactions st ON m.id = st.medicine_id
     GROUP BY m.id
     ORDER BY total_sold DESC
     LIMIT 10`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching top medicines" });
      }

      res.json(rows);
    }
  );
});

// GET DAILY SALES REPORT
app.get("/api/reports/daily-sales", authenticateToken, (req, res) => {
  db.all(
    `SELECT 
      DATE(transaction_date) as date,
      COUNT(*) as transaction_count,
      SUM(total_amount) as daily_revenue
     FROM sales_transactions
     GROUP BY DATE(transaction_date)
     ORDER BY date DESC
     LIMIT 30`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching daily sales" });
      }

      res.json(rows);
    }
  );
});

// GET INVENTORY VALUE REPORT
app.get("/api/reports/inventory-value", authenticateToken, (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) as total_items,
      SUM(quantity) as total_quantity,
      SUM(quantity * purchase_price) as total_purchase_value,
      SUM(quantity * selling_price) as total_selling_value
     FROM medicines`,
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching inventory value" });
      }

      res.json(row || { total_items: 0, total_quantity: 0, total_purchase_value: 0, total_selling_value: 0 });
    }
  );
});

/* ===============================
   SUPERADMIN ROUTES
================================ */

// ===== USER MANAGEMENT =====

// GET ALL USERS (Superadmin only)
app.get("/api/superadmin/users", authenticateToken, (req, res) => {
  db.all(
    `SELECT id, name, email, role, status, branch_id, created_at, last_login FROM users`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching users" });
      }
      res.json(rows);
    }
  );
});

// UPDATE USER ROLE
app.put("/api/superadmin/users/:id/role", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  db.run(
    `UPDATE users SET role = ? WHERE id = ?`,
    [role, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error updating user role" });
      }

      // Log audit
      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) 
              VALUES (?, ?, ?, ?, ?)`, [req.user.id, 'UPDATE', 'user', id, role]);

      res.json({ message: "User role updated successfully" });
    }
  );
});

// SUSPEND USER
app.put("/api/superadmin/users/:id/suspend", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE users SET status = 'suspended' WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error suspending user" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) 
              VALUES (?, ?, ?, ?, ?)`, [req.user.id, 'SUSPEND', 'user', id, 'suspended']);

      res.json({ message: "User suspended successfully" });
    }
  );
});

// ACTIVATE USER
app.put("/api/superadmin/users/:id/activate", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE users SET status = 'active' WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error activating user" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) 
              VALUES (?, ?, ?, ?, ?)`, [req.user.id, 'ACTIVATE', 'user', id, 'active']);

      res.json({ message: "User activated successfully" });
    }
  );
});

// DELETE USER
app.delete("/api/superadmin/users/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM users WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error deleting user" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) 
              VALUES (?, ?, ?, ?)`, [req.user.id, 'DELETE', 'user', id]);

      res.json({ message: "User deleted successfully" });
    }
  );
});

// RESET USER PASSWORD
app.post("/api/superadmin/users/:id/reset-password", authenticateToken, (req, res) => {
  const { id } = req.params;
  const defaultPassword = "TempPassword123!";
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  db.run(
    `UPDATE users SET password = ? WHERE id = ?`,
    [hashedPassword, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error resetting password" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) 
              VALUES (?, ?, ?, ?)`, [req.user.id, 'RESET_PASSWORD', 'user', id]);

      res.json({ message: "Password reset to: " + defaultPassword });
    }
  );
});

// GET LOGIN HISTORY
app.get("/api/superadmin/login-history", authenticateToken, (req, res) => {
  db.all(
    `SELECT lh.*, u.name, u.email FROM login_history lh
     JOIN users u ON lh.user_id = u.id
     ORDER BY lh.login_time DESC
     LIMIT 100`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching login history" });
      }
      res.json(rows);
    }
  );
});

// ===== PHARMACY & BRANCH MANAGEMENT =====

// GET ALL PHARMACIES
app.get("/api/superadmin/pharmacies", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM pharmacies`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching pharmacies" });
      }
      res.json(rows);
    }
  );
});

// ADD NEW PHARMACY
app.post("/api/superadmin/pharmacies", authenticateToken, (req, res) => {
  const { name, address, city, phone, email, license_number } = req.body;

  db.run(
    `INSERT INTO pharmacies (name, address, city, phone, email, license_number)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, address, city, phone, email, license_number],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error creating pharmacy" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) 
              VALUES (?, ?, ?, ?)`, [req.user.id, 'CREATE', 'pharmacy', this.lastID]);

      res.status(201).json({ message: "Pharmacy created successfully", id: this.lastID });
    }
  );
});

// GET ALL BRANCHES
app.get("/api/superadmin/branches", authenticateToken, (req, res) => {
  db.all(
    `SELECT b.*, p.name as pharmacy_name, u.name as manager_name 
     FROM branches b
     LEFT JOIN pharmacies p ON b.pharmacy_id = p.id
     LEFT JOIN users u ON b.manager_id = u.id`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching branches" });
      }
      res.json(rows);
    }
  );
});

// ADD NEW BRANCH
app.post("/api/superadmin/branches", authenticateToken, (req, res) => {
  const { pharmacy_id, name, address, city, phone, manager_id } = req.body;

  db.run(
    `INSERT INTO branches (pharmacy_id, name, address, city, phone, manager_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pharmacy_id, name, address, city, phone, manager_id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Error creating branch" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) 
              VALUES (?, ?, ?, ?)`, [req.user.id, 'CREATE', 'branch', this.lastID]);

      res.status(201).json({ message: "Branch created successfully", id: this.lastID });
    }
  );
});

// ===== AUDIT LOGS =====

// GET AUDIT LOGS
app.get("/api/superadmin/audit-logs", authenticateToken, (req, res) => {
  db.all(
    `SELECT al.*, u.name as user_name, u.email 
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.timestamp DESC
     LIMIT 500`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching audit logs" });
      }
      res.json(rows);
    }
  );
});

// ===== SYSTEM SETTINGS =====

// GET SYSTEM SETTINGS
app.get("/api/superadmin/settings", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM system_settings`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching settings" });
      }
      res.json(rows);
    }
  );
});

// UPDATE SYSTEM SETTING
app.post("/api/superadmin/settings", authenticateToken, (req, res) => {
  const { setting_key, setting_value } = req.body;

  if (!setting_key || setting_value === undefined) {
    return res.status(400).json({ message: "Setting key and value required" });
  }

  db.run(
    `INSERT OR REPLACE INTO system_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [setting_key, setting_value],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error updating setting" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, new_value) 
              VALUES (?, ?, ?, ?)`, [req.user.id, 'UPDATE_SETTING', 'setting', setting_key]);

      res.json({ message: "Setting updated successfully" });
    }
  );
});

// DELETE SYSTEM SETTING
app.delete("/api/superadmin/settings/:key", authenticateToken, (req, res) => {
  const { key } = req.params;

  db.run(
    `DELETE FROM system_settings WHERE setting_key = ?`,
    [decodeURIComponent(key)],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Error deleting setting" });
      }

      db.run(`INSERT INTO audit_logs (user_id, action, entity_type, old_value) 
              VALUES (?, ?, ?, ?)`, [req.user.id, 'DELETE_SETTING', 'setting', key]);

      res.json({ message: "Setting deleted successfully" });
    }
  );
});

// ===== GLOBAL STATISTICS =====

// GET DASHBOARD STATISTICS
app.get("/api/superadmin/dashboard-stats", authenticateToken, (req, res) => {
  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM pharmacies) as total_pharmacies,
      (SELECT COUNT(*) FROM branches) as total_branches,
      (SELECT COUNT(*) FROM medicines) as total_products,
      (SELECT COUNT(*) FROM suppliers) as total_suppliers,
      (SELECT COUNT(*) FROM customers) as total_customers,
      (SELECT SUM(total_amount) FROM sales_transactions WHERE DATE(transaction_date) = DATE('now')) as today_sales,
      (SELECT SUM(total_amount) FROM sales_transactions WHERE strftime('%m', transaction_date) = strftime('%m', 'now') AND strftime('%Y', transaction_date) = strftime('%Y', 'now')) as monthly_sales,
      (SELECT COUNT(*) FROM medicines WHERE quantity <= 5) as low_stock_items,
      (SELECT COUNT(*) FROM medicines WHERE expiry_date IS NOT NULL AND expiry_date < DATE('now', '+7 days')) as expiring_soon,
      (SELECT COUNT(*) FROM medicines WHERE quantity <= 0) as out_of_stock,
      (SELECT COUNT(*) FROM prescriptions) as total_prescriptions
    `,
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching dashboard stats" });
      }
      res.json(row);
    }
  );
});

// GET SALES BY BRANCH
app.get("/api/superadmin/sales-by-branch", authenticateToken, (req, res) => {
  db.all(
    `SELECT 
      b.name as branch_name,
      COUNT(st.id) as total_transactions,
      SUM(st.total_amount) as branch_revenue
     FROM branches b
     LEFT JOIN sales_transactions st ON 1=1
     GROUP BY b.id`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching sales by branch" });
      }
      res.json(rows);
    }
  );
});

/* ===============================
   SERVER START
================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});