const express = require('express');
const guidePackagesRouter = express.Router();

// Define your guide packages endpoints here
// Example:
guidePackagesRouter.get('/', (req, res) => {
    res.json({ success: true, message: 'Guide packages endpoint is working!' });
});

module.exports = guidePackagesRouter;
