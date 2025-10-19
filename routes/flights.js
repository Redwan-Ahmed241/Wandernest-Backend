const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

// Public routes - no authentication required
router.get('/', flightController.getAllFlights);
router.get('/:id', flightController.getFlightById);

module.exports = router;
