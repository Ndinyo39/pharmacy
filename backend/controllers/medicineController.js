/**
 * Medicine Controller
 * Handles all medicine-related business logic
 */

const db = require('../config/database');

const medicineController = {
  // Get all medicines
  getAll: (req, res) => {
    db.all('SELECT * FROM medicines ORDER BY name ASC', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching medicines' });
      }
      res.json(rows);
    });
  },

  // Get single medicine
  getById: (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM medicines WHERE id = ?', [id], (err, row) => {
      if (err || !row) {
        return res.status(404).json({ message: 'Medicine not found' });
      }
      res.json(row);
    });
  },

  // Create medicine
  create: (req, res) => {
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
      return res.status(400).json({ message: 'Required fields missing' });
    }

    db.run(
      `INSERT INTO medicines 
       (name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date],
      function (err) {
        if (err) {
          return res.status(400).json({ message: 'Error adding medicine' });
        }

        res.status(201).json({
          message: 'Medicine added successfully',
          medicineId: this.lastID,
        });
      }
    );
  },

  // Update medicine
  update: (req, res) => {
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
      [name, generic_name, batch_number, barcode, purchase_price, selling_price, quantity, expiry_date, id],
      function (err) {
        if (err) {
          return res.status(400).json({ message: 'Error updating medicine' });
        }
        res.json({ message: 'Medicine updated successfully' });
      }
    );
  },

  // Delete medicine
  delete: (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM medicines WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(400).json({ message: 'Error deleting medicine' });
      }
      res.json({ message: 'Medicine deleted successfully' });
    });
  },
};

module.exports = medicineController;
