const express = require('express');
const router = express.Router();

const guidesRouter = require('../api/guides');
const publicTransportRouter = require('../api/public_transport');

// Example route
router.get('/', (req, res) => {
    res.send('Welcome to Wandernest API!');
});

router.use('/guides', guidesRouter);
router.use('/public_transport', publicTransportRouter);

module.exports = router;