const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../middleware/auth').authenticateToken || require('../middleware/auth');

// Validation middleware
const bookPackageValidation = [
    body('package_id').isInt().withMessage('Package ID must be an integer'),
    body('start_date').isISO8601().withMessage('Valid start date is required'),
    body('end_date').isISO8601().withMessage('Valid end date is required'),
    body('travelers').optional().isInt({ min: 1 }).withMessage('Travelers must be at least 1')
];

const bookHotelValidation = [
    body('hotel_id').notEmpty().withMessage('Hotel ID is required'),
    body('check_in_date').isISO8601().withMessage('Valid check-in date is required'),
    body('check_out_date').isISO8601().withMessage('Valid check-out date is required'),
    body('rooms').optional().isInt({ min: 1 }).withMessage('Rooms must be at least 1'),
    body('guests').optional().isInt({ min: 1 }).withMessage('Guests must be at least 1')
];

const bookFlightValidation = [
    body('flight_id').notEmpty().withMessage('Flight ID is required'),
    body('departure_time').isISO8601().withMessage('Valid departure time is required'),
    body('arrival_time').isISO8601().withMessage('Valid arrival time is required'),
    body('passengers').optional().isInt({ min: 1 }).withMessage('Passengers must be at least 1')
];

// All routes require authentication
router.use(authenticateToken);

// Book items
router.post('/package', bookPackageValidation, bookingController.bookPackage);
router.post('/hotel', bookHotelValidation, bookingController.bookHotel);
router.post('/flight', bookFlightValidation, bookingController.bookFlight);

// Get user's bookings (requires ?type=package|hotel|flight)
router.get('/', bookingController.getMyBookings);

// Get specific booking details (requires ?type=package|hotel|flight)
router.get('/package/:id', bookingController.getBookingById);
router.get('/hotel/:id', bookingController.getBookingById);
router.get('/flight/:id', bookingController.getBookingById);

// Cancel booking (requires ?type=package|hotel|flight)
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;
