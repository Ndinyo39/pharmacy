/**
 * Medicine Routes
 * Handles all medicine-related API endpoints
 */

const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get('/', medicineController.getAll);
router.get('/:id', medicineController.getById);
router.post('/', medicineController.create);
router.put('/:id', medicineController.update);
router.delete('/:id', medicineController.delete);

module.exports = router;
