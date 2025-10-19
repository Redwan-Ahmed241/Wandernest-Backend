const express = require('express');
const router = express.Router();

// Existing routes
const guidesRouter = require('../handlers/guides');
const guidePackagesRouter = require('../handlers/guides/packages');
const { transportRouter, transportPackagesRouter } = require('../handlers/public_transport');
const visaRouter = require('../handlers/visa');

// New booking system routes
const authRouter = require('./auth');
const packagesRouter = require('./packages');
const hotelsRouter = require('./hotels');
const flightsRouter = require('./flights');
const bookingsRouter = require('./bookings');
const dashboardRouter = require('./dashboard');

// Root route
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Wandernest API!',
        version: '2.0',
        endpoints: {
            auth: '/api/auth',
            packages: '/api/packages',
            hotels: '/api/hotels',
            flights: '/api/flights',
            bookings: '/api/bookings',
            dashboard: '/api/dashboard',
            guides: '/api/guides',
            transport: '/api/transport',
            visa: '/api/visa/v1'
        }
    });
});

// Legacy routes
router.use('/guides', guidesRouter);
router.use('/guides-packages', guidePackagesRouter);
router.use('/transport', transportRouter);
router.use('/public_transport', transportRouter); // Backwards compatibility alias
router.use('/transport-packages', transportPackagesRouter);
router.use('/visa/v1', visaRouter);

// New booking system routes
router.use('/auth', authRouter);
router.use('/packages', packagesRouter);
router.use('/hotels', hotelsRouter);
router.use('/flights', flightsRouter);
router.use('/bookings', bookingsRouter);
router.use('/dashboard', dashboardRouter);

module.exports = router;