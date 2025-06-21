// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); // Core Node.js module for path manipulation

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Use port from .env or default to 3000

// Middleware to parse JSON bodies in requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const imageGenRoutes = require('./routes/imageGenRoutes');
// Import auth middleware
const { protect } = require('./middleware/authMiddleware'); // NEW: Import the protect middleware

// Use routes
app.use('/api/auth', authRoutes);
// Apply the protect middleware to chat and image generation routes
// This means only authenticated users can access these routes
app.use('/api/chat', protect, chatRoutes); // UPDATED: Added protect middleware
app.use('/api/imagegen', protect, imageGenRoutes); // UPDATED: Added protect middleware

// Basic route to serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

