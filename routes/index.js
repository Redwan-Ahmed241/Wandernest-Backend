const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
    res.send('Welcome to Wandernest API!');
});

// Public Transport API
router.get('/public_transport/options', (req, res) => {
    res.json({ message: 'Transport options retrieved successfully' });
});

// Guides API
router.get('/guides', (req, res) => {
    res.json({ message: 'Guides retrieved successfully' });
});

module.exports = router;