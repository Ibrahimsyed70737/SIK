// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // We need the User model to find the user
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

/**
 * @description Middleware to protect routes by verifying JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
    let token;

    // Check if the authorization header exists and starts with 'Bearer'
    // The token is usually sent in the header like: Authorization: Bearer <TOKEN>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            // jwt.verify takes the token and your JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user to the request object (excluding the password)
            // This makes the user's data available in subsequent route handlers
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Move to the next middleware or route handler

        } catch (error) {
            console.error('Token verification error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
