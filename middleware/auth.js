const jwt = require('jsonwebtoken');

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_REQUIRED',
                message: 'Authentication required. Please provide a valid Bearer token.'
            }
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.userId || decoded.sub,
            email: decoded.email,
            role: decoded.role || 'user'
        };

        next();
    } catch (error) {
        let message = 'Invalid authentication token';

        if (error.name === 'TokenExpiredError') {
            message = 'Authentication token has expired';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid authentication token format';
        }

        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_INVALID',
                message
            }
        });
    }
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceType) => {
    return async (req, res, next) => {
        // This would typically check database ownership
        // For now, we'll assume the user owns their own resources
        // In production, you'd query the database to verify ownership

        const userId = req.user.id;
        const resourceId = req.params.id || req.params.applicationId;

        // Placeholder ownership check
        // In production: query database to verify user owns this resource

        req.ownership = {
            verified: true,
            userId,
            resourceId,
            resourceType
        };

        next();
    };
};

// Generate JWT token (utility function)
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify JWT token (utility function)
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.userId || decoded.sub,
                email: decoded.email,
                role: decoded.role || 'user'
            };
        } catch (error) {
            // Ignore auth errors for optional auth
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
};

module.exports = {
    authenticateToken,
    requireOwnership,
    generateToken,
    verifyToken,
    optionalAuth
};