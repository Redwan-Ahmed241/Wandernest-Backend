const express = require('express');
const visaRouter = express.Router();

// Import route handlers
// const countriesRoutes = require('./countries');
// const applicationsRoutes = require('./applications');
// const documentsRoutes = require('./documents');
// const appointmentsRoutes = require('./appointments');
// const paymentsRoutes = require('./payments');

// Mount routes
// visaRouter.use('/countries', countriesRoutes);
// visaRouter.use('/applications', applicationsRoutes);
// visaRouter.use('/documents', documentsRoutes);
// visaRouter.use('/appointments', appointmentsRoutes);
// visaRouter.use('/payments', paymentsRoutes);

// Health check
visaRouter.get('/health', (req, res) => {
    res.json({ success: true, message: 'Visa API is healthy', timestamp: new Date().toISOString() });
});

module.exports = visaRouter;