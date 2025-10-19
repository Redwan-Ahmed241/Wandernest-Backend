require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to Wandernest Backend!');
});

// Test route
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Server is working' });
});

// Start the server
if (require.main === module) {
    console.log('Starting server...');
    const server = app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });

    process.on('SIGINT', () => {
        console.log('Shutting down server...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}

module.exports = app;