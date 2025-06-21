// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens
const dotenv = require('dotenv');

// Load environment variables (ensure this is called if not handled globally in server.js)
// Although dotenv is loaded in server.js, it's good practice to have it here
// if these routes were to be used independently or for clarity.
dotenv.config();

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

/**
 * @route POST /api/auth/signup
 * @description Register a new user
 * @access Public
 */
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Check if user already exists by username or email
        let user = await User.findOne({ $or: [{ username }, { email }] });

        if (user) {
            return res.status(400).json({ message: 'User with that username or email already exists' });
        }

        // Create a new user instance
        user = new User({ username, email, password });

        // The password hashing logic is handled by the pre-save hook in the User model
        await user.save(); // Save the user to the database

        // Generate JWT token for the newly registered user
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token, // Send the token back to the client
            userId: user._id,
            username: user.username,
            email: user.email
        });

    } catch (err) {
        console.error('Signup error:', err.message);
        // Handle specific Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during signup' });
    }
});

/**
 * @route POST /api/auth/login
 * @description Authenticate user & get token
 * @access Public
 */
router.post('/login', async (req, res) => {
    const { emailOrUsername, password } = req.body;

    // Basic validation
    if (!emailOrUsername || !password) {
        return res.status(400).json({ message: 'Please enter both email/username and password' });
    }

    try {
        // Find user by email or username
        const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare submitted password with hashed password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            message: 'Logged in successfully',
            token, // Send the token back to the client
            userId: user._id,
            username: user.username,
            email: user.email
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
});


module.exports = router;
