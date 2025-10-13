const express = require('express');
const router = express.Router();

const guidesRouter = require('../api/guides');
const guidePackagesRouter = require('../api/guides/packages');
const { transportRouter, transportPackagesRouter } = require('../api/public_transport');

// Example route
router.get('/', (req, res) => {
    res.send('Welcome to Wandernest API!');
});

router.use('/guides', guidesRouter);
router.use('/guides-packages', guidePackagesRouter);
router.use('/transport', transportRouter);
router.use('/public_transport', transportRouter); // Backwards compatibility alias
router.use('/transport-packages', transportPackagesRouter);

module.exports = router;