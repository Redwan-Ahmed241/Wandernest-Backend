const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth').authenticateToken || require('../middleware/auth');

// Protected route - requires authentication
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

module.exports = router;
