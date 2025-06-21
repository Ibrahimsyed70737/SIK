// server/models/GeneratedImage.js
const mongoose = require('mongoose');

// Define the GeneratedImage schema
const GeneratedImageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Link to the User model
        ref: 'User', // Reference the 'User' model
        required: true
    },
    prompt: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String, // Store the Base64 image URL
        required: true
    },
    aspectRatio: {
        type: String,
        enum: ['1:1', '16:9', '9:16', '4:3'], // Storing the selected aspect ratio
        default: '1:1'
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically set the generation date
    }
});

// Create an index on userId and timestamp for efficient querying
GeneratedImageSchema.index({ userId: 1, timestamp: -1 }); // Index for fetching recent images first

// Create the GeneratedImage model from the schema
// Check if the model already exists before compiling it to prevent OverwriteModelError
const GeneratedImage = mongoose.models.GeneratedImage || mongoose.model('GeneratedImage', GeneratedImageSchema);

module.exports = GeneratedImage;
