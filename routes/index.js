const express = require('express');
const router = express.Router();

const guidesRouter = require('../handlers/guides');
const guidePackagesRouter = require('../handlers/guides/packages');
const { transportRouter, transportPackagesRouter } = require('../handlers/public_transport');

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