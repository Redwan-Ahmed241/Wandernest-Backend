const express = require('express');
const router = express.Router();

const guidesRouter = require('../api/guides');
const { transportRouter, transportPackagesRouter } = require('../api/public_transport');

// Example route
router.get('/', (req, res) => {
    res.send('Welcome to Wandernest API!');
});

router.use('/guides', guidesRouter);
router.use('/transport', transportRouter);
router.use('/public_transport', transportRouter); // Backwards compatibility alias
// router.use('/packages', guidePackagesRouter); // Removed: guidePackagesRouter is not exported
router.use('/packages', transportPackagesRouter);

module.exports = router;