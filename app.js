require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to Wandernest Backend!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});