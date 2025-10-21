require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
// Configure CORS using environment variables
const allowAll = String(process.env.ALLOW_ALL_ORIGINS || 'false').toLowerCase() === 'true';
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || 'http://localhost:1241,http://localhost:3000';
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean);

if (allowAll) {
    app.use(cors());
    console.log('CORS: allowing all origins (ALLOW_ALL_ORIGINS=true)');
} else {
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            }
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
    }));
    console.log('CORS: allowed origins =>', allowedOrigins);
}

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

// Health check endpoint for Vercel
app.get('/health', (req, res) => {
    const { supabase } = require('./config/db');
    res.json({
        success: true,
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        supabaseConfigured: !!supabase,
        timestamp: new Date().toISOString()
    });
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